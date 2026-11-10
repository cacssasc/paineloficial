import { createServerFn } from "@tanstack/react-start";
import { paymentAccessSchema } from "@/lib/stripe-payment";

export const getOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; token: string }) => paymentAccessSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error } = await supabaseAdmin.from("order_payments")
      .select("iluminypay_transaction_id, pix_qr_code, pix_expires_at")
      .eq("order_id", data.id).eq("access_token", data.token).maybeSingle();
    if (error || !payment?.iluminypay_transaction_id) throw new Error("Pagamento não encontrado neste navegador.");
    const { reconcileIluminypayPayment } = await import("@/lib/iluminypay-payment.server");
    const transaction = await reconcileIluminypayPayment(payment.iluminypay_transaction_id, data.id);
    const { data: order, error: orderError } = await supabaseAdmin.from("orders")
      .select("total, status, payment_method").eq("id", data.id).single();
    if (orderError || !order) throw new Error("Pedido não encontrado.");
    return {
      total: Number(order.total), status: order.status, method: order.payment_method,
      providerStatus: transaction.status,
      code: payment.pix_qr_code,
      expiresAt: payment.pix_expires_at ? Date.parse(payment.pix_expires_at) : null,
    };
  });
