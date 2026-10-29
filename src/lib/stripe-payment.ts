import { z } from "zod";

export const paymentAccessSchema = z.object({ id: z.string().uuid(), token: z.string().uuid() });

export function verifiedOrderStatus(intent: { status: string; amount: number; amount_received: number; currency: string; metadata: Record<string, string> }, order: { id: string; total: number }) {
  const cents = Math.round(Number(order.total) * 100);
  if (intent.metadata["order_id"] !== order.id || intent.currency !== "brl" || intent.amount !== cents) {
    throw new Error("Payment/order mismatch");
  }
  if (intent.status === "succeeded" && intent.amount_received === cents) return "pago" as const;
  if (intent.status === "canceled") return "recusado" as const;
  return "gerado" as const;
}