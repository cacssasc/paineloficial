import { z } from "zod";

/** Métodos de pagamento aceitos no checkout. */
export const paymentMethodSchema = z.literal("pix");
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
};
