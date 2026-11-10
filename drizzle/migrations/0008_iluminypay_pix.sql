ALTER TABLE public.order_payments
  ADD COLUMN IF NOT EXISTS iluminypay_transaction_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS pix_qr_code text,
  ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz;

COMMENT ON COLUMN public.order_payments.iluminypay_transaction_id IS 'Iluminypay transaction ID; server-only.';
COMMENT ON COLUMN public.order_payments.pix_qr_code IS 'Pix copia-e-cola returned by Iluminypay; server-only.';
