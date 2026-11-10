import { getIluminypayTransaction } from "@/lib/iluminypay.server";

function orderIdFromMetadata(value: IluminypayTransaction["metadata"]) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as { order_id?: unknown };
      return typeof parsed.order_id === "string" ? parsed.order_id : null;
    } catch { return null; }
  }
  return typeof value.order_id === "string" ? value.order_id : null;
}

type IluminypayTransaction = Awaited<ReturnType<typeof getIluminypayTransaction>>;

/** Always fetches authoritative transaction data from Iluminypay before changing an order. */
export async function reconcileIluminypayPayment(transactionId: string, expectedOrderId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: payment, error } = await supabaseAdmin.from("order_payments")
    .select("order_id, iluminypay_transaction_id")
    .eq("iluminypay_transaction_id", transactionId).maybeSingle();
  if (error || !payment || payment.iluminypay_transaction_id !== transactionId) {
    throw new Error("Iluminypay payment linkage not found");
  }
  if (expectedOrderId && payment.order_id !== expectedOrderId) throw new Error("Iluminypay order mismatch");
  const { data: order, error: orderError } = await supabaseAdmin.from("orders")
    .select("id, total, status, payment_method").eq("id", payment.order_id).single();
  if (orderError || !order || order.payment_method !== "pix") throw new Error("Order not found");
  const transaction = await getIluminypayTransaction(transactionId);
  const expectedCents = Math.round(Number(order.total) * 100);
  const metadataOrderId = orderIdFromMetadata(transaction.metadata);
  if (transaction.id !== transactionId || transaction.amount !== expectedCents ||
      (metadataOrderId && metadataOrderId !== order.id) ||
      (transaction.external_id && transaction.external_id !== order.id)) {
    throw new Error("Iluminypay transaction/order amount mismatch");
  }
  let next: "pago" | "recusado" | null = null;
  if (transaction.status === "PAID") next = "pago";
  else if (["REFUSED", "FAILED"].includes(transaction.status)) next = "recusado";
  if (next && !(order.status === "pago" && next !== "pago") && order.status !== next) {
    const query = supabaseAdmin.from("orders").update({ status: next }).eq("id", order.id);
    const { error: updateError } = next === "pago"
      ? await query
      : await query.neq("status", "pago");
    if (updateError) throw new Error("Iluminypay payment reconciliation failed");
  }
  return transaction;
}
