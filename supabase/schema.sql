-- Cup and Co - Supabase/PostgreSQL schema
-- Run this file as the postgres role in the Supabase SQL Editor.
--
-- Security model:
--   * A public.users row is created when an auth user is created, but its role is
--     intentionally NULL until an owner assigns it. Unassigned users have no
--     staff privileges.
--   * Bootstrap the first owner from the SQL Editor after that user signs up:
--       UPDATE public.users SET role = 'OWNER' WHERE id = '<auth-user-uuid>';
--   * Never expose the service_role key to clients.

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums (conditional creation keeps this migration rerunnable)
-- ---------------------------------------------------------------------------
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS t
    JOIN pg_namespace AS n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
      AND t.typtype = 'e'
  ) THEN
    CREATE TYPE public.user_role AS ENUM (
      'OWNER',
      'MANAGER',
      'CASHIER',
      'BARISTA'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS t
    JOIN pg_namespace AS n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'order_status'
      AND t.typtype = 'e'
  ) THEN
    CREATE TYPE public.order_status AS ENUM (
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    );
  END IF;
END
$migration$;

-- Fail clearly rather than silently accepting an incompatible pre-existing enum.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['OWNER', 'MANAGER', 'CASHIER', 'BARISTA']::text[]) AS required(label)
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_enum AS e
      JOIN pg_type AS t ON t.oid = e.enumtypid
      JOIN pg_namespace AS n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'user_role'
        AND e.enumlabel = required.label
    )
  ) THEN
    RAISE EXCEPTION 'public.user_role exists but does not contain all required values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']::text[]) AS required(label)
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_enum AS e
      JOIN pg_type AS t ON t.oid = e.enumtypid
      JOIN pg_namespace AS n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname = 'order_status'
        AND e.enumlabel = required.label
    )
  ) THEN
    RAISE EXCEPTION 'public.order_status exists but does not contain all required values';
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
    REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role public.user_role,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_name_not_blank CHECK (btrim(name) <> '')
);

COMMENT ON COLUMN public.users.role IS
  'NULL means the authenticated user has not yet been granted staff access.';

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_categories_name_key UNIQUE (name),
  CONSTRAINT menu_categories_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT menu_categories_sort_order_nonnegative CHECK (sort_order >= 0)
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL
    REFERENCES public.menu_categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NOT NULL,
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_items_category_name_key UNIQUE (category_id, name),
  CONSTRAINT menu_items_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT menu_items_price_nonnegative CHECK (price >= 0),
  CONSTRAINT menu_items_sort_order_nonnegative CHECK (sort_order >= 0)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint NOT NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  notes text NOT NULL DEFAULT '',
  created_by uuid
    REFERENCES public.users (id)
    ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_order_number_positive CHECK (order_number >= 1000),
  CONSTRAINT orders_pending_has_no_timestamps CHECK (
    status <> 'PENDING'
    OR (started_at IS NULL AND completed_at IS NULL)
  ),
  CONSTRAINT orders_in_progress_is_not_complete CHECK (
    status <> 'IN_PROGRESS'
    OR completed_at IS NULL
  ),
  CONSTRAINT orders_terminal_has_completion_time CHECK (
    status NOT IN ('COMPLETED', 'CANCELLED')
    OR completed_at IS NOT NULL
  ),
  CONSTRAINT orders_completion_not_before_start CHECK (
    completed_at IS NULL
    OR started_at IS NULL
    OR completed_at >= started_at
  )
);

-- A PostgreSQL sequence is concurrency-safe. The BEFORE INSERT trigger below
-- always obtains the next value, so API clients cannot supply duplicate/custom
-- order numbers. Gaps after rollbacks are intentional and preferable to reuse.
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  AS bigint
  START WITH 1000
  INCREMENT BY 1
  MINVALUE 1000
  NO MAXVALUE
  CACHE 20
  NO CYCLE;

ALTER SEQUENCE public.order_number_seq OWNED BY public.orders.order_number;

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL
    REFERENCES public.orders (id)
    ON DELETE CASCADE,
  menu_item_id uuid
    REFERENCES public.menu_items (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_item_name_not_blank CHECK (btrim(item_name) <> ''),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_nonnegative CHECK (unit_price >= 0)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS users_role_idx
  ON public.users (role)
  WHERE role IS NOT NULL;

CREATE INDEX IF NOT EXISTS menu_categories_sort_order_idx
  ON public.menu_categories (sort_order, name);

CREATE INDEX IF NOT EXISTS menu_items_category_sort_order_idx
  ON public.menu_items (category_id, sort_order, name);

CREATE INDEX IF NOT EXISTS menu_items_availability_idx
  ON public.menu_items (is_available, category_id, sort_order);

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_status_created_at_idx
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_completed_at_idx
  ON public.orders (completed_at)
  WHERE status = 'COMPLETED';

CREATE INDEX IF NOT EXISTS orders_created_by_created_at_idx
  ON public.orders (created_by, created_at DESC)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_active_created_at_idx
  ON public.orders (created_at DESC)
  WHERE status IN ('PENDING', 'IN_PROGRESS');

CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS order_items_menu_item_id_idx
  ON public.order_items (menu_item_id)
  WHERE menu_item_id IS NOT NULL;

-- Keep a pre-existing sequence ahead of any pre-existing orders. This block is
-- intentionally safe on both the first run and later reruns.
DO $migration$
DECLARE
  v_last_value bigint;
  v_is_called boolean;
  v_max_order_number bigint;
BEGIN
  SELECT s.last_value, s.is_called
  INTO v_last_value, v_is_called
  FROM public.order_number_seq AS s;

  SELECT max(o.order_number)
  INTO v_max_order_number
  FROM public.orders AS o;

  IF v_max_order_number IS NOT NULL AND v_max_order_number >= v_last_value THEN
    PERFORM setval(
      'public.order_number_seq'::regclass,
      v_max_order_number,
      true
    );
  ELSIF v_max_order_number IS NOT NULL AND NOT v_is_called THEN
    PERFORM setval(
      'public.order_number_seq'::regclass,
      greatest(v_max_order_number, 1000::bigint),
      false
    );
  ELSIF v_max_order_number IS NULL AND NOT v_is_called THEN
    PERFORM setval(
      'public.order_number_seq'::regclass,
      greatest(v_last_value, 1000::bigint),
      false
    );
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------------
-- Helper and trigger functions
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER avoids self-referential RLS on public.users. An empty search
-- path and fully-qualified object names prevent search-path hijacking.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT u.role
  FROM public.users AS u
  WHERE u.id = (SELECT auth.uid())
    AND u.role IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END
$function$;

-- Keep auth identity fields synchronized without ever changing the staff role.
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(
    NULLIF(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), ''),
    NULLIF(pg_catalog.split_part(COALESCE(new.email, ''), '@', 1), ''),
    'User'
  );

  INSERT INTO public.users (id, name, email, avatar_url, created_at)
  VALUES (
    new.id,
    v_name,
    COALESCE(new.email, ''),
    NULLIF(new.raw_user_meta_data ->> 'avatar_url', ''),
    COALESCE(new.created_at, pg_catalog.now())
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url;

  RETURN new;
END
$function$;

-- Assign order numbers, protect audit columns, and maintain lifecycle times.
-- Client-created orders always begin as PENDING. Terminal orders cannot be
-- reopened, and only owners/managers/cashiers may cancel through the API.
CREATE OR REPLACE FUNCTION public.prepare_order_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_actor_id uuid := (SELECT auth.uid());
  v_actor_role public.user_role := (SELECT public.current_user_role());
  v_now timestamptz := pg_catalog.now();
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.order_number := pg_catalog.nextval(
      'public.order_number_seq'::pg_catalog.regclass
    );

    IF v_actor_id IS NOT NULL AND v_actor_role IS NOT NULL THEN
      NEW.created_by := v_actor_id;
      NEW.created_at := v_now;
      NEW.status := 'PENDING';
    END IF;

    NEW.started_at := NULL;
    NEW.completed_at := NULL;

    CASE NEW.status
      WHEN 'IN_PROGRESS' THEN
        NEW.started_at := v_now;
      WHEN 'COMPLETED' THEN
        NEW.started_at := v_now;
        NEW.completed_at := v_now;
      WHEN 'CANCELLED' THEN
        NEW.completed_at := v_now;
      ELSE
        NULL;
    END CASE;

    NEW.updated_at := v_now;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.order_number IS DISTINCT FROM OLD.order_number
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'order identity and audit columns are immutable'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('COMPLETED', 'CANCELLED') THEN
      RAISE EXCEPTION 'terminal orders cannot be reopened'
        USING ERRCODE = '22023';
    END IF;

    IF NOT (
      (OLD.status = 'PENDING')
      OR (OLD.status = 'IN_PROGRESS' AND NEW.status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
    ) THEN
      RAISE EXCEPTION 'invalid order status transition: % -> %', OLD.status, NEW.status
        USING ERRCODE = '22023';
    END IF;

    IF NEW.status = 'CANCELLED'
      AND v_actor_id IS NOT NULL
      AND v_actor_role IS NOT NULL
      AND v_actor_role NOT IN ('OWNER', 'MANAGER', 'CASHIER')
    THEN
      RAISE EXCEPTION 'only owners, managers, and cashiers may cancel orders'
        USING ERRCODE = '42501';
    END IF;

    CASE NEW.status
      WHEN 'PENDING' THEN
        NEW.started_at := NULL;
        NEW.completed_at := NULL;
      WHEN 'IN_PROGRESS' THEN
        NEW.started_at := COALESCE(OLD.started_at, v_now);
        NEW.completed_at := NULL;
      WHEN 'COMPLETED' THEN
        NEW.started_at := COALESCE(OLD.started_at, v_now);
        NEW.completed_at := COALESCE(OLD.completed_at, v_now);
      WHEN 'CANCELLED' THEN
        NEW.started_at := OLD.started_at;
        NEW.completed_at := COALESCE(OLD.completed_at, v_now);
      ELSE
        RAISE EXCEPTION 'invalid order status: %', NEW.status
          USING ERRCODE = '22023';
    END CASE;
  ELSE
    -- Lifecycle timestamps are trigger-controlled, never client-controlled.
    NEW.started_at := OLD.started_at;
    NEW.completed_at := OLD.completed_at;
  END IF;

  NEW.updated_at := v_now;
  RETURN NEW;
END
$function$;

-- New lines always snapshot the current menu name and price. A nullable
-- menu_item_id is reserved for historical lines after ON DELETE SET NULL.
CREATE OR REPLACE FUNCTION public.snapshot_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_item_name text;
  v_unit_price numeric(12, 2);
  v_should_snapshot boolean;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.menu_item_id IS NULL THEN
    RAISE EXCEPTION 'menu_item_id is required for new order items'
      USING ERRCODE = '23502';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_snapshot := true;
  ELSE
    v_should_snapshot := NEW.menu_item_id IS DISTINCT FROM OLD.menu_item_id;
  END IF;

  IF NEW.menu_item_id IS NOT NULL AND v_should_snapshot THEN
    SELECT mi.name, mi.price
    INTO v_item_name, v_unit_price
    FROM public.menu_items AS mi
    WHERE mi.id = NEW.menu_item_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'menu item % does not exist', NEW.menu_item_id
        USING ERRCODE = '23503';
    END IF;

    NEW.item_name := v_item_name;
    NEW.unit_price := v_unit_price;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Preserve the original snapshot, including after a menu item is deleted.
    NEW.item_name := OLD.item_name;
    NEW.unit_price := OLD.unit_price;
  END IF;

  RETURN NEW;
END
$function$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS menu_categories_set_updated_at ON public.menu_categories;
CREATE TRIGGER menu_categories_set_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS menu_items_set_updated_at ON public.menu_items;
CREATE TRIGGER menu_items_set_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_prepare_write ON public.orders;
CREATE TRIGGER orders_prepare_write
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prepare_order_write();

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS order_items_snapshot ON public.order_items;
CREATE TRIGGER order_items_snapshot
BEFORE INSERT OR UPDATE OF menu_item_id, item_name, unit_price
ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_order_item();

DROP TRIGGER IF EXISTS order_items_set_updated_at ON public.order_items;
CREATE TRIGGER order_items_set_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS auth_users_sync_profile ON auth.users;
CREATE TRIGGER auth_users_sync_profile
AFTER INSERT OR UPDATE OF email, raw_user_meta_data
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_change();

-- Backfill profiles for auth users that predate this migration. Existing roles
-- and profile data are deliberately preserved.
INSERT INTO public.users (id, name, email, avatar_url, created_at)
SELECT
  au.id,
  COALESCE(
    NULLIF(pg_catalog.btrim(au.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(pg_catalog.btrim(au.raw_user_meta_data ->> 'name'), ''),
    NULLIF(pg_catalog.split_part(COALESCE(au.email, ''), '@', 1), ''),
    'User'
  ),
  COALESCE(au.email, ''),
  NULLIF(au.raw_user_meta_data ->> 'avatar_url', ''),
  COALESCE(au.created_at, pg_catalog.now())
FROM auth.users AS au
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users: everyone can read their own profile; staff can read the team directory;
-- only owners can assign or change roles.
DROP POLICY IF EXISTS users_select_self_or_staff ON public.users;
CREATE POLICY users_select_self_or_staff
ON public.users
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.current_user_role()) IS NOT NULL
);

DROP POLICY IF EXISTS users_insert_owner ON public.users;
CREATE POLICY users_insert_owner
ON public.users
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.current_user_role()) = 'OWNER'::public.user_role);

DROP POLICY IF EXISTS users_update_owner ON public.users;
CREATE POLICY users_update_owner
ON public.users
FOR UPDATE
TO authenticated
USING ((SELECT public.current_user_role()) = 'OWNER'::public.user_role)
WITH CHECK ((SELECT public.current_user_role()) = 'OWNER'::public.user_role);

DROP POLICY IF EXISTS users_delete_owner ON public.users;
CREATE POLICY users_delete_owner
ON public.users
FOR DELETE
TO authenticated
USING ((SELECT public.current_user_role()) = 'OWNER'::public.user_role);

-- Menu: all assigned staff can read; only owners/managers can change it.
DROP POLICY IF EXISTS menu_categories_select_staff ON public.menu_categories;
CREATE POLICY menu_categories_select_staff
ON public.menu_categories
FOR SELECT
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS menu_categories_insert_manager ON public.menu_categories;
CREATE POLICY menu_categories_insert_manager
ON public.menu_categories
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

DROP POLICY IF EXISTS menu_categories_update_manager ON public.menu_categories;
CREATE POLICY menu_categories_update_manager
ON public.menu_categories
FOR UPDATE
TO authenticated
USING (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
)
WITH CHECK (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

DROP POLICY IF EXISTS menu_categories_delete_manager ON public.menu_categories;
CREATE POLICY menu_categories_delete_manager
ON public.menu_categories
FOR DELETE
TO authenticated
USING (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

DROP POLICY IF EXISTS menu_items_select_staff ON public.menu_items;
CREATE POLICY menu_items_select_staff
ON public.menu_items
FOR SELECT
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS menu_items_insert_manager ON public.menu_items;
CREATE POLICY menu_items_insert_manager
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

DROP POLICY IF EXISTS menu_items_update_manager ON public.menu_items;
CREATE POLICY menu_items_update_manager
ON public.menu_items
FOR UPDATE
TO authenticated
USING (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
)
WITH CHECK (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

DROP POLICY IF EXISTS menu_items_delete_manager ON public.menu_items;
CREATE POLICY menu_items_delete_manager
ON public.menu_items
FOR DELETE
TO authenticated
USING (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

-- Orders: all staff share the operational queue. Creation is attributed to the
-- authenticated actor; owners/managers alone may hard-delete orders.
DROP POLICY IF EXISTS orders_select_staff ON public.orders;
CREATE POLICY orders_select_staff
ON public.orders
FOR SELECT
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS orders_insert_staff ON public.orders;
CREATE POLICY orders_insert_staff
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.current_user_role()) IS NOT NULL
  AND created_by = (SELECT auth.uid())
);

DROP POLICY IF EXISTS orders_update_staff ON public.orders;
CREATE POLICY orders_update_staff
ON public.orders
FOR UPDATE
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL)
WITH CHECK ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS orders_delete_manager ON public.orders;
CREATE POLICY orders_delete_manager
ON public.orders
FOR DELETE
TO authenticated
USING (
  (SELECT public.current_user_role()) IN (
    'OWNER'::public.user_role,
    'MANAGER'::public.user_role
  )
);

-- Order lines can change only while their parent order is active. This keeps
-- completed/cancelled history immutable through the client API.
DROP POLICY IF EXISTS order_items_select_staff ON public.order_items;
CREATE POLICY order_items_select_staff
ON public.order_items
FOR SELECT
TO authenticated
USING ((SELECT public.current_user_role()) IS NOT NULL);

DROP POLICY IF EXISTS order_items_insert_staff ON public.order_items;
CREATE POLICY order_items_insert_staff
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.current_user_role()) IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = order_id
      AND o.status IN ('PENDING', 'IN_PROGRESS')
  )
);

DROP POLICY IF EXISTS order_items_update_staff ON public.order_items;
CREATE POLICY order_items_update_staff
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  (SELECT public.current_user_role()) IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = order_id
      AND o.status IN ('PENDING', 'IN_PROGRESS')
  )
)
WITH CHECK (
  (SELECT public.current_user_role()) IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = order_id
      AND o.status IN ('PENDING', 'IN_PROGRESS')
  )
);

DROP POLICY IF EXISTS order_items_delete_staff ON public.order_items;
CREATE POLICY order_items_delete_staff
ON public.order_items
FOR DELETE
TO authenticated
USING (
  (SELECT public.current_user_role()) IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.id = order_id
      AND o.status IN ('PENDING', 'IN_PROGRESS')
  )
);

-- ---------------------------------------------------------------------------
-- Explicit API privileges (RLS remains the final authorization layer)
-- ---------------------------------------------------------------------------
REVOKE ALL PRIVILEGES ON TABLE public.users FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.menu_categories FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.menu_items FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.order_items FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public.order_number_seq FROM anon, authenticated;

GRANT SELECT ON TABLE public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.menu_categories, public.menu_items
  TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.orders TO authenticated;
-- Identity, creator, and lifecycle timestamps are trigger-controlled.
GRANT UPDATE (status, notes) ON TABLE public.orders TO authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.order_items TO authenticated;
-- Snapshot and foreign-key columns are not client-updatable.
GRANT UPDATE (quantity, notes) ON TABLE public.order_items TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO authenticated;

REVOKE ALL ON FUNCTION public.current_user_role()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_updated_at()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_auth_user_change()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.prepare_order_write()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.snapshot_order_item()
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.current_user_role()
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Realtime publication (idempotent)
-- ---------------------------------------------------------------------------
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'the supabase_realtime publication does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'menu_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'menu_categories'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories';
  END IF;

  -- Order creation and its line items are separate inserts. Publishing the
  -- child table ensures a client that receives the order INSERT event also
  -- refreshes after the complete line-item snapshot is available.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items';
  END IF;
END
$migration$;

-- ---------------------------------------------------------------------------
-- Idempotent starter menu
-- Existing rows are preserved so rerunning never resets prices or availability.
-- ---------------------------------------------------------------------------
INSERT INTO public.menu_categories (name, sort_order)
VALUES
  ('Coffee', 10),
  ('Tea & Matcha', 20),
  ('Bakery', 30)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.menu_items (
  category_id,
  name,
  description,
  price,
  sort_order
)
SELECT
  c.id,
  seed.name,
  seed.description,
  seed.price,
  seed.sort_order
FROM (
  VALUES
    ('Coffee', 'Espresso', 'A rich single shot of coffee.', 2.75::numeric, 10),
    ('Coffee', 'Americano', 'Espresso topped with hot water.', 3.50::numeric, 20),
    ('Coffee', 'Cappuccino', 'Espresso, steamed milk, and milk foam.', 4.50::numeric, 30),
    ('Coffee', 'Latte', 'Espresso with steamed milk and light foam.', 4.75::numeric, 40),
    ('Coffee', 'Cold Brew', 'Slow-steeped coffee served over ice.', 4.25::numeric, 50),
    ('Tea & Matcha', 'English Breakfast Tea', 'Classic black tea.', 3.00::numeric, 10),
    ('Tea & Matcha', 'Matcha Latte', 'Ceremonial matcha with steamed milk.', 5.25::numeric, 20),
    ('Bakery', 'Butter Croissant', 'Flaky, buttery baked pastry.', 3.75::numeric, 10),
    ('Bakery', 'Banana Bread', 'Moist banana loaf with a golden crust.', 4.25::numeric, 20),
    ('Bakery', 'Chocolate Chip Cookie', 'Classic chocolate chip cookie.', 2.75::numeric, 30)
) AS seed(category_name, name, description, price, sort_order)
JOIN public.menu_categories AS c
  ON c.name = seed.category_name
ON CONFLICT (category_id, name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Cup & Co food additions
-- Only rows with an explicit, usable price are seeded. Unclear rows such as
-- Chicken Boneless, Schezwan Maggi, and unnamed pizza variants are intentionally
-- left out until the menu owner confirms their price/name.
-- ---------------------------------------------------------------------------
INSERT INTO public.menu_categories (name, sort_order)
VALUES
  ('Fries', 40),
  ('Maggi', 50),
  ('Momos', 60),
  ('Pizza', 70),
  ('Desserts', 80),
  ('Air Fried', 90)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.menu_items (category_id, name, description, price, sort_order)
SELECT c.id, seed.name, seed.description, seed.price, seed.sort_order
FROM (
  VALUES
    ('Fries', 'Classic Salted Fries', '', 99::numeric, 10),
    ('Fries', 'Masala Fries', '', 119::numeric, 20),
    ('Fries', 'Peri Peri Fries', '', 129::numeric, 30),
    ('Fries', 'Cheesy Fries', '', 139::numeric, 40),
    ('Fries', 'McCain Smiles', '', 109::numeric, 50),
    ('Fries', 'Classic Potato Wedges', '', 119::numeric, 60),
    ('Fries', 'Peri Peri Wedges', '', 139::numeric, 70),
    ('Fries', 'Jalapeño Cheesy Pops', '', 149::numeric, 80),
    ('Fries', 'Chicken Popcorn', '', 159::numeric, 90),
    ('Maggi', 'Plain Maggi', '', 69::numeric, 10),
    ('Maggi', 'Plain Cheese Maggi', '', 89::numeric, 20),
    ('Maggi', 'Cheese Corn Maggi', '', 129::numeric, 30),
    ('Momos', 'Veg · 5 Pieces', '', 70::numeric, 10),
    ('Momos', 'Paneer · 5 Pieces', '', 80::numeric, 20),
    ('Momos', 'Cheese Corn · 5 Pieces', '', 90::numeric, 30),
    ('Momos', 'Tandoori Paneer · 5 Pieces', '', 95::numeric, 40),
    ('Momos', 'Chicken · 5 Pieces', '', 80::numeric, 50),
    ('Momos', 'Chicken Cheese · 5 Pieces', '', 95::numeric, 60),
    ('Momos', 'Veg · 10 Pieces', '', 120::numeric, 70),
    ('Momos', 'Paneer · 10 Pieces', '', 140::numeric, 80),
    ('Momos', 'Cheese Corn · 10 Pieces', '', 150::numeric, 90),
    ('Momos', 'Tandoori Paneer · 10 Pieces', '', 170::numeric, 100),
    ('Momos', 'Chicken · 10 Pieces', '', 140::numeric, 110),
    ('Momos', 'Chicken Cheese · 10 Pieces', '', 160::numeric, 120),
    ('Pizza', 'Classic Margherita', '', 109::numeric, 10),
    ('Desserts', 'Gulab Jamun', '', 60::numeric, 10),
    ('Desserts', 'Vanilla Ice Cream', '', 60::numeric, 20),
    ('Desserts', 'Chocolate Ice Cream', '', 70::numeric, 30),
    ('Desserts', 'Hot Gulab Jamun & Ice Cream', '', 109::numeric, 40),
    ('Desserts', 'Choco Fantasy Sundae', '', 159::numeric, 50),
    ('Desserts', 'Oreo Mud Sundae', '', 169::numeric, 60),
    ('Desserts', 'Kit Kat Crunch Sundae', '', 169::numeric, 70),
    ('Desserts', 'Brownie Overload Sundae', '', 179::numeric, 80),
    ('Desserts', 'Nutella Brownie Sundae', '', 189::numeric, 90),
    ('Desserts', 'Ice Cream Affogato', '', 159::numeric, 100),
    ('Desserts', 'Irish Affogato', '', 159::numeric, 110),
    ('Desserts', 'Tiramisu Ice Cream Affogato', '', 169::numeric, 120),
    ('Desserts', 'Sizzling Brownie', '', 159::numeric, 130),
    ('Air Fried', 'Air Fried Veg · 5 Pieces', '', 75::numeric, 10),
    ('Air Fried', 'Air Fried Paneer · 5 Pieces', '', 90::numeric, 20),
    ('Air Fried', 'Air Fried Cheese & Corn · 5 Pieces', '', 95::numeric, 30),
    ('Air Fried', 'Air Fried Tandoori · 5 Pieces', '', 100::numeric, 40),
    ('Air Fried', 'Air Fried Chicken · 5 Pieces', '', 80::numeric, 50),
    ('Air Fried', 'Air Fried Chicken Cheese · 5 Pieces', '', 95::numeric, 60),
    ('Air Fried', 'Air Fried Veg · 10 Pieces', '', 130::numeric, 70),
    ('Air Fried', 'Air Fried Paneer · 10 Pieces', '', 150::numeric, 80),
    ('Air Fried', 'Air Fried Cheese & Corn · 10 Pieces', '', 160::numeric, 90),
    ('Air Fried', 'Air Fried Tandoori · 10 Pieces', '', 180::numeric, 100),
    ('Air Fried', 'Air Fried Chicken · 10 Pieces', '', 140::numeric, 110),
    ('Air Fried', 'Air Fried Chicken Cheese · 10 Pieces', '', 160::numeric, 120)
) AS seed(category_name, name, description, price, sort_order)
JOIN public.menu_categories AS c ON c.name = seed.category_name
ON CONFLICT (category_id, name) DO NOTHING;

COMMIT;
