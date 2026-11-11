ALTER TABLE public.order_payments
  ADD COLUMN IF NOT EXISTS pagpix_transaction_id text UNIQUE;

COMMENT ON COLUMN public.order_payments.pagpix_transaction_id IS
  'PagPix Hub transaction id used to query Pix generation and payment status server-side.';

