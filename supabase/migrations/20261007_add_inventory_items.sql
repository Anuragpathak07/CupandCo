-- Cup and Co - inventory tracking.
-- Run this in the Supabase SQL Editor (idempotent, safe to rerun).
-- All assigned staff (owners, managers, cashiers, baristas) share the
-- inventory list, matching the app's Inventory tab access.

BEGIN;

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pcs',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_name_key UNIQUE (name),
  CONSTRAINT inventory_items_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT inventory_items_unit_not_blank CHECK (btrim(unit) <> ''),
  CONSTRAINT inventory_items_quantity_nonnegative CHECK (quantity >= 0)
);

CREATE INDEX IF NOT EXISTS inventory_items_name_idx
  ON public.inventory_items (name);

DROP TRIGGER IF EXISTS inventory_items_set_updated_at ON public.inventory_items;
CREATE TRIGGER inventory_items_set_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_items_select_staff ON public.inventory_items;
CREATE POLICY inventory_items_select_staff
ON public.inventory_items
FOR SELECT
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS inventory_items_insert_staff ON public.inventory_items;
CREATE POLICY inventory_items_insert_staff
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS inventory_items_update_staff ON public.inventory_items;
CREATE POLICY inventory_items_update_staff
ON public.inventory_items
FOR UPDATE
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL)
WITH CHECK ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS inventory_items_delete_staff ON public.inventory_items;
CREATE POLICY inventory_items_delete_staff
ON public.inventory_items
FOR DELETE
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL);

REVOKE ALL PRIVILEGES ON TABLE public.inventory_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_items TO authenticated;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'inventory_items'
  ) THEN
    NULL;
  ELSE
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items';
  END IF;
END
$migration$;

COMMIT;
