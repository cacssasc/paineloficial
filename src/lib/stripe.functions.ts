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
      .select("stripe_payment_intent_id").eq("order_id", data.id).eq("access_token", data.token).maybeSingle();
    if (error || !payment?.stripe_payment_intent_id) throw new Error("Pagamento não encontrado neste navegador.");
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("Pagamento indisponível.");
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    const { reconcileStripePayment } = await import("@/lib/stripe-payment.server");
    await reconcileStripePayment(intent);
    const { data: order } = await supabaseAdmin.from("orders").select("total, status, payment_method").eq("id", data.id).single();
    if (!order) throw new Error("Pedido não encontrado.");
    const qr = intent.next_action?.pix_display_qr_code;
    return {
      total: Number(order.total), status: order.status, method: order.payment_method,
      providerStatus: intent.status,
      code: qr?.data ?? null, expiresAt: qr?.expires_at ? qr.expires_at * 1000 : null,
      qrImage: qr?.image_url_png ?? null,
    };
  });