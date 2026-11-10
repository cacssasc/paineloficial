import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { paymentMethodSchema } from "@/lib/payment";
import { utmSchema } from "@/lib/utm";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select("id, slug, title, price, old_price, images, installments, free_shipping")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const [{ data: variants }, { data: reviews }] = await Promise.all([
      sb.from("product_variants").select("*").eq("product_id", product.id).order("position"),
      sb.from("reviews").select("*").eq("product_id", product.id).order("created_at", { ascending: false }),
    ]);
    const { data: store } = await sb.from("store_settings").select("name, logo_url, banner_url, followers, products_label, sales_label").eq("id", 1).maybeSingle();
    return { product, variants: variants ?? [], reviews: reviews ?? [], store };
  });

const orderSchema = z.object({
  checkoutId: z.string().uuid(),
  checkoutToken: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(30),
  customer_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).default(""),
  cpf: z.string().trim().max(20).default(""),
  cep: z.string().trim().min(8).max(10),
  street: z.string().trim().min(2).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(100).default(""),
  neighborhood: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(2),
  payment_method: paymentMethodSchema.default("pix"),
  utm_parameters: utmSchema.default({}),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof orderSchema>) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.payment_method !== "pix") throw new Error("Esta loja aceita somente Pix.");
    const sb = publicClient();
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const vids = data.items.map((i) => i.variantId).filter((v): v is string => !!v);
    const [{ data: products }, { data: variants }] = await Promise.all([
      sb.from("products").select("id, title, price, stock").in("id", ids).eq("active", true),
      vids.length ? sb.from("product_variants").select("id, name, price, product_id").in("id", vids) : Promise.resolve({ data: [] as { id: string; name: string; price: number | null; product_id: string }[] }),
    ]);
    const lines = data.items.map((i) => {
      const product = products?.find((p) => p.id === i.productId);
      if (!product) throw new Error("Produto não encontrado");
      const requestedQuantity = data.items.filter((line) => line.productId === product.id).reduce((sum, line) => sum + line.quantity, 0);
      if (requestedQuantity > product.stock) throw new Error("Quantidade indisponível em estoque.");
      let unit = Number(product.price);
      let variantName: string | null = null;
      if (i.variantId) {
        const v = variants?.find((x) => x.id === i.variantId);
        if (!v || v.product_id !== product.id) throw new Error("Variante inválida");
        variantName = v.name;
        if (v.price != null) unit = Number(v.price);
      }
      return { product_id: product.id, title: product.title, variant_name: variantName, quantity: i.quantity, unit_price: unit, subtotal: Math.round(unit * i.quantity * 100) / 100 };
    });
    const total = Math.round(lines.reduce((sum, line) => sum + line.subtotal, 0) * 100) / 100;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createIluminypayPix } = await import("@/lib/iluminypay.server");
    const { items, checkoutId, checkoutToken, ...customer } = data;
    void items;
    const first = lines[0];
    if (!first || total <= 0) throw new Error("Carrinho inválido.");
    const { data: existing, error: existingError } = await supabaseAdmin.from("order_payments")
      .select("access_token, iluminypay_transaction_id, pix_qr_code, pix_expires_at")
      .eq("order_id", checkoutId).maybeSingle();
    if (existingError) throw new Error("Não foi possível consultar o pedido.");
    if (existing && existing.access_token !== checkoutToken) throw new Error("Pedido inválido.");
    if (!existing) {
      const { error } = await supabaseAdmin.from("orders").insert({
        id: checkoutId,
        ...customer,
        state: customer.state.toUpperCase(),
        product_id: first.product_id,
        product_title: lines.length > 1 ? `${first.title} + ${lines.length - 1} produto(s)` : first.title,
        variant_name: lines.length > 1 ? null : first.variant_name,
        quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
        total,
        items: lines,
        payment_method: "pix",
        status: "gerado",
      });
      if (error) throw new Error(error.message);
      const { error: linkError } = await supabaseAdmin.from("order_payments").insert({
        order_id: checkoutId, access_token: checkoutToken,
      });
      if (linkError) throw new Error("Não foi possível preparar o pagamento.");
    }
    const { data: storedOrder, error: orderError } = await supabaseAdmin.from("orders")
      .select("total, payment_method, customer_name, email, cpf, phone, product_title")
      .eq("id", checkoutId).single();
    if (orderError || !storedOrder) throw new Error("Pedido não encontrado.");
    if (storedOrder.payment_method !== "pix") throw new Error("Este pedido não está configurado para Pix.");
    const { data: currentPayment, error: paymentReadError } = await supabaseAdmin.from("order_payments")
      .select("iluminypay_transaction_id, pix_qr_code, pix_expires_at")
      .eq("order_id", checkoutId).eq("access_token", checkoutToken).single();
    if (paymentReadError || !currentPayment) throw new Error("Vínculo de pagamento inválido.");
    if (currentPayment.iluminypay_transaction_id && currentPayment.pix_qr_code) {
      return {
        id: checkoutId, token: checkoutToken, total: Number(storedOrder.total),
        code: currentPayment.pix_qr_code,
        expiresAt: currentPayment.pix_expires_at ? Date.parse(currentPayment.pix_expires_at) : null,
      };
    }
    const amountInCents = Math.round(Number(storedOrder.total) * 100);
    const charge = await createIluminypayPix({
      orderId: checkoutId, amountInCents,
      customerName: storedOrder.customer_name, email: storedOrder.email,
      cpf: storedOrder.cpf, phone: storedOrder.phone,
      title: storedOrder.product_title,
    });
    const { error: saveError } = await supabaseAdmin.from("order_payments").update({
      iluminypay_transaction_id: charge.transactionId,
      pix_qr_code: charge.qrCode,
      pix_expires_at: charge.expiresAt ? new Date(charge.expiresAt).toISOString() : null,
    }).eq("order_id", checkoutId).eq("access_token", checkoutToken);
    if (saveError) throw new Error("A cobrança foi criada, mas não foi possível vinculá-la ao pedido. Contate o suporte antes de tentar novamente.");
    return {
      id: checkoutId, token: checkoutToken, total: Number(storedOrder.total),
      code: charge.qrCode, expiresAt: charge.expiresAt,
    };
  });

export const getCatalogBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: catalog } = await sb.from("catalogs").select("id, title, slug").eq("slug", data.slug).eq("active", true).maybeSingle();
    if (!catalog) return null;
    const { data: links } = await sb
      .from("catalog_products")
      .select("position, products(id, slug, title, price, old_price, images, installments, free_shipping, rating, active, subtitle, product_variants(name, position))")
      .eq("catalog_id", catalog.id)
      .order("position");
    const products = (links ?? [])
      .map((l) => l.products)
      .filter((p): p is NonNullable<typeof p> => !!p && p.active)
      .map(({ product_variants, subtitle, ...p }) => ({
        ...p,
        subtitle: subtitle || ([...(product_variants ?? [])].sort((a, b) => a.position - b.position)[0]?.name ?? null),
      }));
    return { catalog, products };
  });
