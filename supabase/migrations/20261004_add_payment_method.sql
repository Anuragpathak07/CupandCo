-- Cup and Co - payment method tracking for completed orders.
-- Run this in the Supabase SQL Editor (idempotent, safe to rerun).
-- The app records CASH vs UPI when an order is marked done and keeps working
-- in mock mode / before this migration (payment update is best-effort).

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'UPI'));

COMMENT ON COLUMN public.orders.payment_method IS
  'How a COMPLETED order was paid: CASH or UPI. NULL until recorded.';

-- The base schema grants UPDATE (status, notes); accumulate the new column.
GRANT UPDATE (payment_method) ON TABLE public.orders TO authenticated;

COMMIT;
