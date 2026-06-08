-- supabase/migrations.sql
-- ------------------------------------------------------------
-- Profiles (users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','customer','worker','contractor')),
  phone text,
  city text,
  created_at timestamp with time zone DEFAULT now()
);

-- Workers (extensions of profiles with worker‑specific fields)
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending Verification',
  trust_score int NOT NULL DEFAULT 100,
  skills text,
  city text,
  visit_charge numeric,
  hourly_rate numeric,
  inspection_fee numeric,
  starting_price numeric,
  whatsapp text,
  experience text,
  id_proof_url text,
  profile_photo_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Contractors (extensions of profiles with contractor‑specific fields)
CREATE TABLE IF NOT EXISTS public.contractors (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending Approval',
  company text,
  city text,
  owner_name text,
  whatsapp text,
  gst text,
  services_offered text,
  created_at timestamp with time zone DEFAULT now()
);

-- Services (catalog of services)
CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text,
  base_price numeric,
  platform_fee numeric,
  inspection_fee numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Cities (list of cities per region)
CREATE TABLE IF NOT EXISTS public.cities (
  id serial PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL
);

-- City‑Service control (enable/disable services per city)
CREATE TABLE IF NOT EXISTS public.city_services (
  city_id int REFERENCES public.cities(id) ON DELETE CASCADE,
  service_id text REFERENCES public.services(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (city_id, service_id)
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  service_id text REFERENCES public.services(id),
  city_id int REFERENCES public.cities(id),
  address text,
  preferred_date timestamp with time zone,
  status text NOT NULL DEFAULT 'New Request',
  
  -- Flat transaction fields for launch mode
  customer_name text,
  customer_phone text,
  customer_address text,
  worker_name text,
  worker_phone text,
  service_name text,
  city text,
  booking_date timestamp with time zone,
  price numeric,
  platform_fee numeric,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id text REFERENCES public.bookings(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  service_type text,
  created_at timestamp with time zone DEFAULT now()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamp with time zone DEFAULT now()
);

-- Pricing rules (dynamic pricing per city/service)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id text REFERENCES public.services(id),
  city_id int REFERENCES public.cities(id),
  base_price numeric,
  platform_fee numeric,
  inspection_fee numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Trust scores (mirrors workers.trust_score for quick reporting)
CREATE TABLE IF NOT EXISTS public.trust_scores (
  worker_id uuid PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'Good',
  updated_at timestamp with time zone DEFAULT now()
);

-- Partner applications
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('worker','contractor','painter')),
  status text NOT NULL DEFAULT 'Pending',
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ------------------------------------------------------------
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
DO $$
DECLARE r text;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r);
  END LOOP;
END $$;

-- Admin helper function to avoid infinite recursion in policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users can read and update their own profile, admin can read/update all, others can read worker/contractor names
CREATE POLICY "allow_user_read_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "allow_user_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "allow_user_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "allow_admin_all" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "allow_public_read_professionals" ON public.profiles FOR SELECT USING (role IN ('worker', 'contractor'));

-- Workers: workers see/update only their own record, public can select for service details
CREATE POLICY "worker_read_all" ON public.workers FOR SELECT USING (true);
CREATE POLICY "worker_insert_own" ON public.workers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "worker_update_own" ON public.workers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "worker_admin_all" ON public.workers FOR ALL USING (public.is_admin());

-- Contractors: similar to workers
CREATE POLICY "contractor_read_all" ON public.contractors FOR SELECT USING (true);
CREATE POLICY "contractor_insert_own" ON public.contractors FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "contractor_update_own" ON public.contractors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "contractor_admin_all" ON public.contractors FOR ALL USING (public.is_admin());

-- Bookings: customers see/create their own, workers see assigned/update assigned, admin sees all
CREATE POLICY "booking_customer_read" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "booking_customer_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "booking_customer_update" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "booking_worker_read" ON public.bookings FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "booking_worker_update" ON public.bookings FOR UPDATE USING (auth.uid() = worker_id);
CREATE POLICY "booking_admin_all" ON public.bookings FOR ALL USING (public.is_admin());

-- Reviews: customers can read/write reviews of their own completed bookings, admin sees all
CREATE POLICY "review_customer_create" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = (SELECT customer_id FROM public.bookings WHERE id = booking_id));
CREATE POLICY "review_read_all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "review_admin_all" ON public.reviews FOR ALL USING (public.is_admin());

-- Support tickets: user sees own tickets, can insert, admin sees all. Anon can insert if user_id is null.
CREATE POLICY "ticket_user_read" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ticket_user_insert" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "ticket_admin_all" ON public.support_tickets FOR ALL USING (public.is_admin());

-- Pricing rules: admin only (no other reads needed in UI)
CREATE POLICY "pricing_admin" ON public.pricing_rules FOR ALL USING (public.is_admin());

-- Trust scores: admin only update, everyone can read
CREATE POLICY "trust_read_all" ON public.trust_scores FOR SELECT USING (true);
CREATE POLICY "trust_admin_all" ON public.trust_scores FOR ALL USING (public.is_admin());

-- Partner applications: admin sees all, applicant sees/inserts own
CREATE POLICY "partner_applicant_own" ON public.partner_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "partner_insert_own" ON public.partner_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "partner_admin_all" ON public.partner_applications FOR ALL USING (public.is_admin());

-- Services: anyone can read
CREATE POLICY "service_read_all" ON public.services FOR SELECT USING (true);
CREATE POLICY "service_admin_all" ON public.services FOR ALL USING (public.is_admin());

-- Cities: anyone can read
CREATE POLICY "cities_read_all" ON public.cities FOR SELECT USING (true);
CREATE POLICY "cities_admin_all" ON public.cities FOR ALL USING (public.is_admin());

-- City Services: anyone can read
CREATE POLICY "city_services_read_all" ON public.city_services FOR SELECT USING (true);
CREATE POLICY "city_services_admin_all" ON public.city_services FOR ALL USING (public.is_admin());

-- Notifications: users see/update own, admin manages all, anyone can read/write their own
CREATE POLICY "Allow users to read their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow admin to manage all notifications" ON public.notifications FOR ALL USING (public.is_admin());


INSERT INTO public.cities (id, name, region) VALUES
  (1, 'Ranchi', 'Jharkhand'),
  (2, 'Jamshedpur', 'Jharkhand'),
  (3, 'Dhanbad', 'Jharkhand'),
  (4, 'Bokaro', 'Jharkhand'),
  (5, 'Deoghar', 'Jharkhand')
ON CONFLICT (id) DO NOTHING;

-- Default Services
INSERT INTO public.services (id, name, icon, base_price, platform_fee, inspection_fee, active) VALUES
  ('electrician', 'Electrician', 'zap', 199, 49, 150, true),
  ('plumber', 'Plumber', 'droplets', 249, 49, 150, true),
  ('ac-repair', 'AC Repair', 'wind', 499, 99, 250, true),
  ('cleaning', 'Cleaning Help', 'sparkles', 799, 149, 300, true),
  ('painter', 'Painting Services', 'paintbrush', 999, 199, 400, true),
  ('carpenter', 'Carpenter Help', 'hammer', 299, 59, 200, true)
ON CONFLICT (id) DO NOTHING;

-- Populate city-service mappings
INSERT INTO public.city_services (city_id, service_id, enabled) VALUES
  (1, 'electrician', true), (1, 'plumber', true), (1, 'ac-repair', true), (1, 'cleaning', true), (1, 'painter', true), (1, 'carpenter', true),
  (2, 'electrician', true), (2, 'plumber', true), (2, 'ac-repair', true), (2, 'cleaning', true), (2, 'painter', true), (2, 'carpenter', true),
  (3, 'electrician', true), (3, 'plumber', true), (3, 'ac-repair', true), (3, 'cleaning', true), (3, 'painter', true), (3, 'carpenter', true),
  (4, 'electrician', true), (4, 'plumber', true), (4, 'ac-repair', true), (4, 'cleaning', true), (4, 'painter', true), (4, 'carpenter', true),
  (5, 'electrician', true), (5, 'plumber', true), (5, 'ac-repair', true), (5, 'cleaning', true), (5, 'painter', true), (5, 'carpenter', true)
ON CONFLICT (city_id, service_id) DO NOTHING;

