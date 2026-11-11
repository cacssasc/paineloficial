import { createServerFn } from "@tanstack/react-start";
import { paymentAccessSchema } from "@/lib/stripe-payment";

/** Only the Stripe publishable key may cross this public boundary. */
export const getStripePublicConfig = createServerFn({ method: "GET" }).handler(() => {
  const publishableKey = process.env["STRIPE_PUBLISHABLE_KEY"];
  if (!publishableKey || !/^pk_(test|live)_/.test(publishableKey)) {
    return { publishableKey: null };
  }
  return { publishableKey };
});

export const getOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; token: string }) => paymentAccessSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error } = await supabaseAdmin.from("order_payments")
      .select("stripe_payment_intent_id, pagpix_transaction_id").eq("order_id", data.id).eq("access_token", data.token).maybeSingle();
    if (error || !payment) throw new Error("Pagamento não encontrado neste navegador.");
    const { data: order } = await supabaseAdmin.from("orders").select("total, status, payment_method").eq("id", data.id).single();
    if (!order) throw new Error("Pedido não encontrado.");
    if (order.payment_method === "pix") {
      if (!payment.pagpix_transaction_id) throw new Error("Cobrança Pix ainda não vinculada ao pedido.");
      const { getPagPixTransaction } = await import("@/lib/pagpix-payment.server");
      const transaction = await getPagPixTransaction(payment.pagpix_transaction_id);
      const expectedCents = Math.round(Number(order.total) * 100);
      if (transaction.id !== payment.pagpix_transaction_id || transaction.amount_cents !== expectedCents) {
        throw new Error("A cobrança Pix não corresponde ao valor deste pedido.");
      }
      if (transaction.status === "PAID" && order.status !== "pago") {
        const { error: updateError } = await supabaseAdmin.from("orders").update({ status: "pago" }).eq("id", data.id).neq("status", "pago");
        if (updateError) throw new Error("Não foi possível confirmar o pagamento do pedido.");
      }
      if (["EXPIRED", "FAILED"].includes(transaction.status) && order.status === "gerado") {
        const { error: updateError } = await supabaseAdmin.from("orders").update({ status: "recusado" }).eq("id", data.id).eq("status", "gerado");
        if (updateError) throw new Error("Não foi possível atualizar o status do pedido.");
      }
      return {
        total: Number(order.total), status: transaction.status === "PAID" ? "pago" : order.status,
        method: order.payment_method, providerStatus: transaction.pix_status,
        code: transaction.pix?.copy_paste ?? null,
        expiresAt: transaction.pix?.expires_at ? Date.parse(transaction.pix.expires_at) : null,
        qrImage: null,
      };
    }
    if (!payment.stripe_payment_intent_id) throw new Error("Pagamento não encontrado neste navegador.");
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Pagamento indisponível.");
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    const { reconcileStripePayment } = await import("@/lib/stripe-payment.server");
    await reconcileStripePayment(intent);
    const qr = intent.next_action?.pix_display_qr_code;
    return {
      total: Number(order.total), status: order.status, method: order.payment_method,
      providerStatus: intent.status,
      code: qr?.data ?? null, expiresAt: qr?.expires_at ? qr.expires_at * 1000 : null,
      qrImage: qr?.image_url_png ?? null,
    };
  });

