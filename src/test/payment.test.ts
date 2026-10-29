import { describe, expect, it } from "vitest";
import { PAYMENT_LABELS, paymentMethodSchema } from "@/lib/payment";

describe("métodos de pagamento do checkout", () => {
  it("aceita exatamente pix e cartão", () => {
    expect(paymentMethodSchema.parse("pix")).toBe("pix");
    expect(paymentMethodSchema.parse("cartao")).toBe("cartao");
    expect(Object.keys(PAYMENT_LABELS)).toEqual(["pix", "cartao"]);
  });

  it("rejeita qualquer outro meio de pagamento", () => {
    for (const bad of ["boleto", "mercadopago", "dinheiro", "PIX", ""]) {
      expect(paymentMethodSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("mostra os rótulos em português usados no painel", () => {
    expect(PAYMENT_LABELS.pix).toBe("Pix");
    expect(PAYMENT_LABELS.cartao).toBe("Cartão de crédito");
  });
});
