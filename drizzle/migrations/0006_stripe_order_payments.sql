CREATE TABLE public.order_payments (
 order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
 access_token uuid NOT NULL UNIQUE,
 stripe_payment_intent_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_payments TO service_role;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.order_payments IS 'Server-only Stripe linkage and guest capability tokens; no browser Data API grants.';