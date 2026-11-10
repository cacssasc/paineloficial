import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { Id?: unknown; id?: unknown };
        try { payload = await request.json() as typeof payload; }
        catch { return new Response("Invalid JSON", { status: 400 }); }
        const transactionId = typeof payload.Id === "string" ? payload.Id : payload.id;
        if (typeof transactionId !== "string" || !/^[a-f0-9]{32}$/i.test(transactionId)) {
          return new Response("Invalid transaction ID", { status: 400 });
        }
        try {
          const { reconcileIluminypayPayment } = await import("@/lib/iluminypay-payment.server");
          await reconcileIluminypayPayment(transactionId);
          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("Iluminypay webhook reconciliation failed", error);
          return new Response("Payment reconciliation pending", { status: 503 });
        }
      },
    },
  },
});
