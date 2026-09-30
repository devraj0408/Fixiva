-- 2026-07-15: Services constraints, RLS policies, and admin RPCs

-- 1) Schema hardening: add columns if missing and constraints
ALTER TABLE IF EXISTS services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0 NOT NULL;

-- add non-negative checks (guard: uses IF NOT EXISTS style via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_base_price_nonneg'
  ) THEN
    ALTER TABLE services ADD CONSTRAINT services_base_price_nonneg CHECK (base_price >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_platform_fee_nonneg'
  ) THEN
    ALTER TABLE services ADD CONSTRAINT services_platform_fee_nonneg CHECK (platform_fee >= 0);
  END IF;
END$$;

-- unique index on lower(name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'services_name_lower_idx') THEN
    CREATE UNIQUE INDEX services_name_lower_idx ON services (LOWER(name));
  END IF;
END$$;

-- city_services defaults/constraints
ALTER TABLE IF EXISTS city_services
  ALTER COLUMN IF EXISTS enabled SET DEFAULT true;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='city_services' AND column_name='enabled') THEN
    -- ensure NOT NULL
    EXECUTE 'ALTER TABLE city_services ALTER COLUMN enabled SET NOT NULL';
  END IF;
  -- unique constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'city_services_city_service_unique') THEN
    ALTER TABLE city_services ADD CONSTRAINT city_services_city_service_unique UNIQUE (city_id, service_id);
  END IF;
  -- FK to services with cascade
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'city_services_service_fk') THEN
    ALTER TABLE city_services ADD CONSTRAINT city_services_service_fk FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 2) RLS policies
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS city_services ENABLE ROW LEVEL SECURITY;

-- create helper boolean expression for admin check via policies
-- Policies: allow public SELECT, restrict MUTATE to admins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'public_read_services' AND polrelid = 'services'::regclass) THEN
    CREATE POLICY public_read_services ON services FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'public_read_city_services' AND polrelid = 'city_services'::regclass) THEN
    CREATE POLICY public_read_city_services ON city_services FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'admin_manage_services' AND polrelid = 'services'::regclass) THEN
    CREATE POLICY admin_manage_services ON services FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'admin_manage_city_services' AND polrelid = 'city_services'::regclass) THEN
    CREATE POLICY admin_manage_city_services ON city_services FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END$$;

-- 3) Transactional RPCs (security definer) - must be created by a DB owner

-- admin_create_service
CREATE OR REPLACE FUNCTION public.admin_create_service(
  p_name text,
  p_description text DEFAULT '',
  p_category text DEFAULT '',
  p_base_price numeric DEFAULT 0,
  p_platform_fee numeric DEFAULT 0,
  p_city_ids int[] DEFAULT '{}'
) RETURNS TABLE(service_id uuid) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_service_id uuid;
BEGIN
  -- admin check
  IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- duplicate name check
  IF EXISTS (SELECT 1 FROM services WHERE lower(name) = lower(p_name)) THEN
    RAISE EXCEPTION 'duplicate_service';
  END IF;

  INSERT INTO services (name, description, category, base_price, platform_fee, active)
  VALUES (p_name, p_description, p_category, p_base_price, p_platform_fee, true)
  RETURNING id INTO v_service_id;

  IF array_length(p_city_ids, 1) IS NOT NULL THEN
    FOREACH cid IN ARRAY p_city_ids LOOP
      INSERT INTO city_services (city_id, service_id, enabled)
      VALUES (cid, v_service_id, true)
      ON CONFLICT (city_id, service_id) DO UPDATE SET enabled = true;
    END LOOP;
  END IF;

  RETURN QUERY SELECT v_service_id::uuid;
END;$$;

-- admin_update_service
CREATE OR REPLACE FUNCTION public.admin_update_service(
  p_service_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_base_price numeric DEFAULT NULL,
  p_platform_fee numeric DEFAULT NULL,
  p_city_ids int[] DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE services SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    category = COALESCE(p_category, category),
    base_price = COALESCE(p_base_price, base_price),
    platform_fee = COALESCE(p_platform_fee, platform_fee)
  WHERE id = p_service_id;

  IF p_city_ids IS NOT NULL THEN
    -- enable listed
    FOREACH cid IN ARRAY p_city_ids LOOP
      INSERT INTO city_services (city_id, service_id, enabled)
      VALUES (cid, p_service_id, true)
      ON CONFLICT (city_id, service_id) DO UPDATE SET enabled = true;
    END LOOP;
    -- disable others
    UPDATE city_services SET enabled = false
      WHERE service_id = p_service_id AND city_id <> ALL(p_city_ids);
  END IF;
END;$$;

-- admin_delete_service
CREATE OR REPLACE FUNCTION public.admin_delete_service(p_service_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  DELETE FROM city_services WHERE service_id = p_service_id;
  DELETE FROM services WHERE id = p_service_id;
END;$$;

-- End of migration
