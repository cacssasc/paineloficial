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
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) throw new Error("Pagamentos indisponíveis. Tente novamente mais tarde.");
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
    const total = Math.round(lines.reduce((s, l) => s + l.subtotal, 0) * 100) / 100;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { items, checkoutId, checkoutToken, ...customer } = data;
    void items;
    const first = lines[0];
    if (!first || total <= 0) throw new Error("Carrinho inválido.");
    const { data: existing } = await supabaseAdmin.from("order_payments").select("access_token, stripe_payment_intent_id").eq("order_id", checkoutId).maybeSingle();
    if (existing && existing.access_token !== checkoutToken) throw new Error("Pedido inválido.");
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });
    if (existing?.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
      return { id: checkoutId, token: checkoutToken, clientSecret: intent.client_secret, total: intent.amount / 100 };
    }
    if (!existing) {
    const { error } = await supabaseAdmin
      .from("orders")
      .insert({
        id: checkoutId,
        ...customer,
        state: customer.state.toUpperCase(),
        product_id: first.product_id,
        product_title: lines.length > 1 ? `${first.title} + ${lines.length - 1} produto(s)` : first.title,
        variant_name: lines.length > 1 ? null : first.variant_name,
        quantity: lines.reduce((s, l) => s + l.quantity, 0),
        total,
        items: lines,
        status: "gerado",
      })
      ;
    if (error) throw new Error(error.message);
    const { error: linkError } = await supabaseAdmin.from("order_payments").insert({ order_id: checkoutId, access_token: checkoutToken });
    if (linkError) throw new Error("Não foi possível preparar o pagamento.");
    }
    // The stored order, not any browser amount, is the authority on retry too.
    const { data: storedOrder } = await supabaseAdmin.from("orders").select("total, payment_method, customer_name, email, cpf").eq("id", checkoutId).single();
    if (!storedOrder) throw new Error("Pedido não encontrado.");
    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(Number(storedOrder.total) * 100), currency: "brl",
        allowed_payment_method_types: [storedOrder.payment_method === "pix" ? "pix" : "card"],
        metadata: { order_id: checkoutId, store_payment: "1" },
        receipt_email: storedOrder.email,
        ...(storedOrder.payment_method === "pix" ? {
          confirm: true,
          payment_method_data: { type: "pix" as const, billing_details: { name: storedOrder.customer_name, email: storedOrder.email, tax_id: storedOrder.cpf.replace(/\D/g, "") } },
          payment_method_options: { pix: { expires_after_seconds: 900 } },
        } : {}),
      }, { idempotencyKey: `order:${checkoutId}` });
      const { error: paymentError } = await supabaseAdmin.from("order_payments").update({ stripe_payment_intent_id: intent.id }).eq("order_id", checkoutId).eq("access_token", checkoutToken);
      if (paymentError) throw new Error("Não foi possível vincular o pagamento.");
      return { id: checkoutId, token: checkoutToken, clientSecret: intent.client_secret, total: intent.amount / 100 };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) console.warn("Stripe payment rejected", { type: error.type, code: error.code, param: error.param });
      if (error instanceof Stripe.errors.StripePermissionError || error instanceof Stripe.errors.StripeAuthenticationError) {
        throw new Error("A chave Stripe não permite criar pagamentos. O lojista precisa ajustar as permissões da chave.");
      }
      if (error instanceof Stripe.errors.StripeCardError) throw new Error("A Stripe recusou este pagamento. Confira seus dados e tente novamente.");
      if (error instanceof Stripe.errors.StripeInvalidRequestError && storedOrder.payment_method === "pix") {
        if (error.param?.includes("tax_id")) throw new Error("Informe um CPF válido no endereço para gerar o Pix.");
        console.warn("Stripe Pix request rejected", { code: error.code, param: error.param });
        throw new Error("Pix indisponível na Stripe desta loja. É necessário habilitar Pix e verificar a elegibilidade da conta.");
      }
      throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");
    }
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
