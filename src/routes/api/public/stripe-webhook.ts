import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });
        const secret = process.env['STRIPE_WEBHOOK_SECRET'];
        const apiKey = process.env['STRIPE_SECRET_KEY'];
        if (!secret || !apiKey) return new Response("Webhook not configured", { status: 503 });
        const stripe = new Stripe(apiKey, { httpClient: Stripe.createFetchHttpClient() });
        const body = await request.text();
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, Stripe.createSubtleCryptoProvider());
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }
        if (["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled", "payment_intent.processing"].includes(event.type)) {
          try {
            // Retrieve the latest state so delayed/duplicate events cannot regress a paid order.
            const intent = await stripe.paymentIntents.retrieve((event.data.object as Stripe.PaymentIntent).id);
            const { reconcileStripePayment } = await import("@/lib/stripe-payment.server");
            await reconcileStripePayment(intent);
          } catch {
            return new Response("Payment reconciliation pending", { status: 503 });
          }
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});