import type Stripe from "stripe";
import { verifiedOrderStatus } from "@/lib/stripe-payment";

/** Caller has already verified a Stripe signature or the order capability. */
export async function reconcileStripePayment(intent: Stripe.PaymentIntent) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: payment, error } = await supabaseAdmin.from("order_payments")
    .select("order_id").eq("stripe_payment_intent_id", intent.id).maybeSingle();
  if (error) throw new Error("Unable to read payment");
  if (!payment) {
    if (intent.metadata["store_payment"] === "1") throw new Error("Payment linkage pending");
    return;
  }
  const { data: order, error: orderError } = await supabaseAdmin.from("orders")
    .select("id, total, status").eq("id", payment.order_id).single();
  if (orderError || !order) throw new Error("Order missing");
  const status = verifiedOrderStatus(intent, { id: order.id, total: Number(order.total) });
  const rejected = intent.status === "requires_payment_method" && Boolean(intent.last_payment_error);
  const next = rejected ? "recusado" : status;
  if (order.status === "pago" && next !== "pago") return;
  if (order.status !== next) {
    const query = supabaseAdmin.from("orders").update({ status: next }).eq("id", order.id);
    const { error: updateError } = next === "pago" ? await query : await query.neq("status", "pago");
    if (updateError) throw new Error("Payment reconciliation failed");
  }
}