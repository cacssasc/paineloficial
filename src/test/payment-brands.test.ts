import { describe, expect, it } from "vitest";
import { PAYMENT_BRANDS } from "@/lib/payment-brands";

describe("faixa de meios de pagamento da loja", () => {
  it("mostra exatamente as bandeiras escolhidas, nesta ordem", () => {
    expect(PAYMENT_BRANDS.map((b) => b.name)).toEqual([
      "Mercado Pago", "Elo", "Visa", "Mastercard", "Pix",
    ]);
  });

  it("nunca mostra boleto", () => {
    expect(PAYMENT_BRANDS.some((b) => /boleto/i.test(b.name))).toBe(false);
  });

  it("cada bandeira tem um endereço de imagem", () => {
    for (const b of PAYMENT_BRANDS) expect(b.src).toMatch(/^\/__l5e\/assets-v1\//);
  });
});
