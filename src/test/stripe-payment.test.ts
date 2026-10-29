import { describe, expect, it } from "vitest";
import { paymentAccessSchema, verifiedOrderStatus } from "@/lib/stripe-payment";

const order = { id: "928f3a55-b5f3-4b7a-a587-a16ea13e0139", total: 99.9 };
const intent = { status: "succeeded", amount: 9990, amount_received: 9990, currency: "brl", metadata: { order_id: order.id } };
describe("Stripe payment authority", () => {
  it("only approves a succeeded payment for the exact server order total", () => {
    expect(verifiedOrderStatus(intent, order)).toBe("pago");
    expect(verifiedOrderStatus({ ...intent, status: "processing" }, order)).toBe("gerado");
    expect(verifiedOrderStatus({ ...intent, amount_received: 9989 }, order)).toBe("gerado");
  });
  it("rejects payment amount tampering", () => {
    expect(() => verifiedOrderStatus({ ...intent, amount: 100 }, order)).toThrow();
  });
  it("rejects a payment for a different order", () => {
    expect(() => verifiedOrderStatus({ ...intent, metadata: { order_id: "another" } }, order)).toThrow();
  });
  it("rejects a payment in a different currency", () => {
    expect(() => verifiedOrderStatus({ ...intent, currency: "usd" }, order)).toThrow();
  });
  it("requires both the order and its guest access token", () => {
    expect(paymentAccessSchema.safeParse({ id: order.id }).success).toBe(false);
    expect(paymentAccessSchema.safeParse({ id: order.id, token: "invalid" }).success).toBe(false);
  });
});