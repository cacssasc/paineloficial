import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ inserted: [] as Record<string, unknown>[], existing: false }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validate = (value: unknown) => value;
    const builder = {
      inputValidator: (validator: typeof validate) => { validate = validator; return builder; },
      handler: (handler: (args: { data: unknown }) => unknown) => (args: { data: unknown }) => handler({ data: validate(args.data) }),
    };
    return builder;
  },
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: () => ({ select: () => ({ in: () => ({ eq: async () => ({ data: [{ id: "22222222-2222-4222-8222-222222222222", title: "Pneu", price: 99.9, stock: 50 }] }) }) }) }) }) }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (table: string) => ({
    insert: async (row: Record<string, unknown>) => { if (table === "orders") mocks.inserted.push(row); return { error: null }; },
    select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: mocks.existing ? { access_token: "33333333-3333-4333-8333-333333333333", stripe_payment_intent_id: "pi_existing" } : null }),
      single: async () => ({ data: { total: 99.9, payment_method: "cartao", email: "test@example.invalid" } }),
    }) }),
    update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
  }) },
}));
vi.mock("stripe", () => {
  class FakeStripe {
    static createFetchHttpClient() { return {}; }
    paymentIntents = {
      create: async () => ({ id: "pi_mock", amount: 9990, client_secret: "mock_only" }),
      retrieve: async () => ({ id: "pi_existing", amount: 9990, client_secret: "mock_only" }),
    };
  }
  return { default: FakeStripe };
});

import { createOrder } from "@/lib/store.functions";
const input = {
  checkoutId: "11111111-1111-4111-8111-111111111111", checkoutToken: "33333333-3333-4333-8333-333333333333",
  items: [{ productId: "22222222-2222-4222-8222-222222222222", variantId: null, quantity: 1 }],
  customer_name: "Teste UTM", email: "test@example.invalid", cep: "01001000", street: "Rua teste", number: "1", neighborhood: "Centro", city: "São Paulo", state: "SP", payment_method: "cartao" as const,
  utm_parameters: { utm_source: "meta", utm_campaign: "aro14", utm_custom: "grupo2" },
};
beforeEach(() => { mocks.inserted = []; mocks.existing = false; vi.stubEnv("STRIPE_SECRET_KEY", "mock-never-sent"); });
it("stores the originating campaign on the order with the server-calculated total", async () => {
  await createOrder({ data: input });
  expect(mocks.inserted[0]?.['utm_parameters']).toEqual({ utm_source: "meta", utm_campaign: "aro14", utm_custom: "grupo2" });
  expect(mocks.inserted[0]?.['total']).toBe(99.9);
});
it("does not replace the campaign of an existing order on payment retry", async () => {
  mocks.existing = true;
  await createOrder({ data: { ...input, utm_parameters: { utm_source: "different" } } });
  expect(mocks.inserted).toHaveLength(0);
});