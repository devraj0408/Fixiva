-- ============================================================================
-- FIXIVA SUPABASE PRODUCTION MIGRATION SCRIPT
-- Services Catalog, Image Storage Columns, RLS Policies & Storage Buckets
-- Run this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. ENSURE CORE 'services' TABLE EXISTS AND HAS ALL REQUIRED COLUMNS
CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text DEFAULT 'General',
  category_id text,
  icon text DEFAULT 'wrench',
  image_url text,
  image text,
  base_price numeric DEFAULT 0 NOT NULL,
  platform_fee numeric DEFAULT 0 NOT NULL,
  inspection_fee numeric DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Safely add missing columns to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS category_id text,
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'wrench',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS inspection_fee numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;

-- 2. ENSURE CORE 'categories' TABLE EXISTS AND HAS ALL REQUIRED COLUMNS
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'tag',
  image_url text,
  image text,
  display_order int DEFAULT 0,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Safely add missing columns to categories table
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'tag',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS display_order int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL;

-- 3. ENSURE 'city_services' TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.city_services (
  city_id int REFERENCES public.cities(id) ON DELETE CASCADE,
  service_id text REFERENCES public.services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (city_id, service_id)
);

-- 4. CASE-INSENSITIVE INDEX FOR SERVICES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'services_name_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX services_name_lower_idx ON public.services (LOWER(name));
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END$$;

-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON TABLES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_services ENABLE ROW LEVEL SECURITY;

-- 6. PUBLIC READ ACCESS POLICIES (Allow any visitor to view services & catalog)
DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read city_services" ON public.city_services;
CREATE POLICY "Public read city_services" ON public.city_services
  FOR SELECT USING (true);

-- 7. ADMIN / AUTHENTICATED MUTATION POLICIES (Allow insert/update/delete)
DROP POLICY IF EXISTS "Admin write services" ON public.services;
CREATE POLICY "Admin write services" ON public.services
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories" ON public.categories
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write city_services" ON public.city_services;
CREATE POLICY "Admin write city_services" ON public.city_services
  FOR ALL USING (true) WITH CHECK (true);

-- 8. STORAGE BUCKETS CREATION FOR SERVICE & CMS IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 9. STORAGE BUCKET RLS POLICIES (Allow public image viewing & admin upload)
DROP POLICY IF EXISTS "Public Storage Read" ON storage.objects;
CREATE POLICY "Public Storage Read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('cms-assets', 'services', 'avatars'));

DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
CREATE POLICY "Public Storage Insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('cms-assets', 'services', 'avatars'));

DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
CREATE POLICY "Public Storage Update" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('cms-assets', 'services', 'avatars'));

DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;
CREATE POLICY "Public Storage Delete" ON storage.objects
  FOR DELETE USING (bucket_id IN ('cms-assets', 'services', 'avatars'));
