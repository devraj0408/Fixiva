-- 2026-07-15: Align services schema with admin panel expectations

-- Add admin panel service fields safely if they do not already exist.
ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0 NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'active'
  ) THEN
    EXECUTE 'ALTER TABLE public.services ALTER COLUMN active SET NOT NULL';
  END IF;
END$$;

ALTER TABLE IF EXISTS public.city_services
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_services' AND column_name = 'enabled'
  ) THEN
    EXECUTE 'ALTER TABLE public.city_services ALTER COLUMN enabled SET NOT NULL';
  END IF;
END$$;

-- Optional index for service name uniqueness and case-insensitive lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'services_name_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX services_name_lower_idx ON public.services (LOWER(name));
  END IF;
END$$;
