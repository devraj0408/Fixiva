-- 2026-07-15: Safe creation of service/city schema for admin panel support

-- Create core tables only if they are missing.
CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  base_price numeric DEFAULT 0 NOT NULL,
  platform_fee numeric DEFAULT 0 NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cities (
  id serial PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.city_services (
  city_id int REFERENCES public.cities(id) ON DELETE CASCADE,
  service_id text REFERENCES public.services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (city_id, service_id)
);

-- Ensure the expected fields exist without modifying existing columns.
ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE IF EXISTS public.city_services
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'active'
  ) THEN
    EXECUTE 'ALTER TABLE public.services ALTER COLUMN active SET NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_services' AND column_name = 'enabled'
  ) THEN
    EXECUTE 'ALTER TABLE public.city_services ALTER COLUMN enabled SET NOT NULL';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'services_name_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX services_name_lower_idx ON public.services (LOWER(name));
  END IF;
END$$;
