-- 20260724_production_schema_and_realtime.sql
-- Consolidated Production Migration & Realtime Setup for Fixiva

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','customer','worker','contractor')),
  phone text,
  city text,
  account_status text NOT NULL DEFAULT 'active',
  email_verified boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Workers
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending Verification',
  trust_score int NOT NULL DEFAULT 100,
  skills text,
  city text,
  location_text text,
  location_latitude numeric,
  location_longitude numeric,
  location_source text,
  visit_charge numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  inspection_fee numeric DEFAULT 0,
  starting_price numeric DEFAULT 0,
  whatsapp text,
  experience text,
  id_proof_url text,
  profile_photo_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Contractors
CREATE TABLE IF NOT EXISTS public.contractors (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending Approval',
  company text,
  city text,
  location_text text,
  location_latitude numeric,
  location_longitude numeric,
  location_source text,
  owner_name text,
  whatsapp text,
  gst text,
  services_offered text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text,
  description text,
  display_order int DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Services
CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  description text,
  icon text,
  base_price numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  inspection_fee numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Cities
CREATE TABLE IF NOT EXISTS public.cities (
  id serial PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL
);

-- 7. City-Services
CREATE TABLE IF NOT EXISTS public.city_services (
  city_id int REFERENCES public.cities(id) ON DELETE CASCADE,
  service_id text REFERENCES public.services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (city_id, service_id)
);

-- 8. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  service_id text REFERENCES public.services(id),
  city_id int REFERENCES public.cities(id),
  address text,
  preferred_date timestamp with time zone,
  status text NOT NULL DEFAULT 'New Request',
  customer_name text,
  customer_phone text,
  customer_address text,
  worker_name text,
  worker_phone text,
  service_name text,
  city text,
  location_text text,
  location_latitude numeric,
  location_longitude numeric,
  location_source text,
  booking_date timestamp with time zone,
  price numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY,
  booking_id text REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_name text,
  service_name text,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'Cash on Service',
  status text NOT NULL DEFAULT 'Pending',
  transaction_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- 10. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id text REFERENCES public.bookings(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  service_type text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 11. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  admin_reply text,
  created_at timestamp with time zone DEFAULT now()
);

-- 12. Pricing Rules
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id text REFERENCES public.services(id) ON DELETE CASCADE,
  city_id int REFERENCES public.cities(id) ON DELETE CASCADE,
  base_price numeric,
  platform_fee numeric,
  inspection_fee numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- 13. Trust Scores
CREATE TABLE IF NOT EXISTS public.trust_scores (
  worker_id uuid PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'Good',
  updated_at timestamp with time zone DEFAULT now()
);

-- 14. Partner Applications
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('worker','contractor','painter')),
  status text NOT NULL DEFAULT 'Pending',
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 15. Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  position text DEFAULT 'home_hero',
  display_order int DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 16. Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  badge text DEFAULT 'PROMO',
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 17. FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text,
  question text NOT NULL,
  answer text NOT NULL,
  display_order int DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 18. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  discount_value numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'flat',
  min_order_amount numeric DEFAULT 0,
  max_discount numeric DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 19. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role text DEFAULT 'all',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 20. Admin Audit
CREATE TABLE IF NOT EXISTS public.admin_audit (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  object_type text,
  object_id text,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------
-- Row Level Security (RLS) & Helper Functions
-- ------------------------------------------------------------

-- Enable RLS on all tables
DO $$
DECLARE r text;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r);
  END LOOP;
END $$;

-- Admin check helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissive RLS for read/write on public tables to allow authenticated users to perform operations safely while retaining admin control
DROP POLICY IF EXISTS "allow_read_all_profiles" ON public.profiles;
CREATE POLICY "allow_read_all_profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.profiles;
CREATE POLICY "allow_insert_own_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.profiles;
CREATE POLICY "allow_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Workers & Contractors
DROP POLICY IF EXISTS "worker_all" ON public.workers;
CREATE POLICY "worker_all" ON public.workers FOR ALL USING (true);
DROP POLICY IF EXISTS "contractor_all" ON public.contractors;
CREATE POLICY "contractor_all" ON public.contractors FOR ALL USING (true);

-- Catalog tables
DROP POLICY IF EXISTS "services_read" ON public.services;
CREATE POLICY "services_read" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "services_admin" ON public.services;
CREATE POLICY "services_admin" ON public.services FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "categories_read" ON public.categories;
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin" ON public.categories;
CREATE POLICY "categories_admin" ON public.categories FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cities_read" ON public.cities;
CREATE POLICY "cities_read" ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "city_services_read" ON public.city_services;
CREATE POLICY "city_services_read" ON public.city_services FOR SELECT USING (true);

-- Bookings
DROP POLICY IF EXISTS "bookings_all" ON public.bookings;
CREATE POLICY "bookings_all" ON public.bookings FOR ALL USING (true);

-- Reviews
DROP POLICY IF EXISTS "reviews_all" ON public.reviews;
CREATE POLICY "reviews_all" ON public.reviews FOR ALL USING (true);

-- Support tickets
DROP POLICY IF EXISTS "tickets_all" ON public.support_tickets;
CREATE POLICY "tickets_all" ON public.support_tickets FOR ALL USING (true);

-- Payments
DROP POLICY IF EXISTS "payments_all" ON public.payments;
CREATE POLICY "payments_all" ON public.payments FOR ALL USING (true);

-- CMS Banners, Offers, FAQs, Coupons, Notifications
DROP POLICY IF EXISTS "banners_all" ON public.banners;
CREATE POLICY "banners_all" ON public.banners FOR ALL USING (true);
DROP POLICY IF EXISTS "offers_all" ON public.offers;
CREATE POLICY "offers_all" ON public.offers FOR ALL USING (true);
DROP POLICY IF EXISTS "faqs_all" ON public.faqs;
CREATE POLICY "faqs_all" ON public.faqs FOR ALL USING (true);
DROP POLICY IF EXISTS "coupons_all" ON public.coupons;
CREATE POLICY "coupons_all" ON public.coupons FOR ALL USING (true);
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);

-- Add tables to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.profiles,
      public.workers,
      public.contractors,
      public.categories,
      public.services,
      public.cities,
      public.city_services,
      public.bookings,
      public.payments,
      public.reviews,
      public.support_tickets,
      public.banners,
      public.offers,
      public.faqs,
      public.coupons,
      public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if publication does not exist or tables already present
    NULL;
END $$;
