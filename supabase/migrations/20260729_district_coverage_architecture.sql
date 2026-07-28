-- supabase/migrations/20260729_district_coverage_architecture.sql
-- Consolidated SQL Migration for Fixiva District Coverage & Locality Matching System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure States Table Exists
CREATE TABLE IF NOT EXISTS public.states (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Coming Soon', 'Disabled')),
  display_order int NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Populate default states
INSERT INTO public.states (name, status, display_order) VALUES
  ('Jharkhand', 'Active', 1),
  ('Bihar', 'Active', 2),
  ('Uttar Pradesh', 'Active', 3),
  ('West Bengal', 'Active', 4),
  ('Delhi NCR', 'Active', 5),
  ('Odisha', 'Active', 6),
  ('Maharashtra', 'Coming Soon', 7),
  ('Karnataka', 'Coming Soon', 8)
ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;

-- 2. Districts Table (Canonical table for district coverage)
CREATE TABLE IF NOT EXISTS public.districts (
  id serial PRIMARY KEY,
  state_id int REFERENCES public.states(id) ON DELETE CASCADE,
  state_name text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Coming Soon' CHECK (status IN ('Active', 'Coming Soon', 'Disabled')),
  coverage_radius_km numeric NOT NULL DEFAULT 15,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_state_district UNIQUE (state_name, name)
);

-- Seed initial Districts (incorporating existing operational cities as Districts for backward compatibility)
INSERT INTO public.districts (state_name, name, status, coverage_radius_km) VALUES
  ('Jharkhand', 'Ranchi', 'Active', 15),
  ('Jharkhand', 'Jamshedpur', 'Active', 15),
  ('Jharkhand', 'Dhanbad', 'Active', 15),
  ('Jharkhand', 'Bokaro', 'Active', 15),
  ('Jharkhand', 'Deoghar', 'Active', 15),
  ('Jharkhand', 'Hazaribagh', 'Coming Soon', 15),
  ('Bihar', 'Patna', 'Active', 15),
  ('Bihar', 'Gaya', 'Coming Soon', 15),
  ('Bihar', 'Bhagalpur', 'Coming Soon', 15),
  ('Uttar Pradesh', 'Lucknow', 'Active', 20),
  ('Uttar Pradesh', 'Kanpur', 'Coming Soon', 20),
  ('Uttar Pradesh', 'Varanasi', 'Coming Soon', 20),
  ('West Bengal', 'Kolkata', 'Active', 20),
  ('West Bengal', 'Siliguri', 'Coming Soon', 15),
  ('Delhi NCR', 'New Delhi', 'Active', 25),
  ('Delhi NCR', 'Noida', 'Active', 25),
  ('Delhi NCR', 'Gurugram', 'Active', 25),
  ('Odisha', 'Bhubaneswar', 'Active', 15),
  ('Odisha', 'Cuttack', 'Coming Soon', 15)
ON CONFLICT (state_name, name) DO NOTHING;

-- Link district state_id to states table
UPDATE public.districts d
SET state_id = s.id
FROM public.states s
WHERE LOWER(d.state_name) = LOWER(s.name);

-- 3. Enhance Profiles, Workers, Contractors for District & Locality Storage
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

ALTER TABLE IF EXISTS public.workers
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS coverage_radius_km numeric DEFAULT 15,
  ADD COLUMN IF NOT EXISTS completed_jobs int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 4.8;

ALTER TABLE IF EXISTS public.contractors
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS coverage_radius_km numeric DEFAULT 15,
  ADD COLUMN IF NOT EXISTS completed_jobs int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 4.9;

ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS pincode text;

-- Populate missing state/district from legacy city field for backward compatibility
UPDATE public.workers SET district = city WHERE district IS NULL AND city IS NOT NULL;
UPDATE public.workers SET state = 'Jharkhand' WHERE state IS NULL;

UPDATE public.contractors SET district = city WHERE district IS NULL AND city IS NOT NULL;
UPDATE public.contractors SET state = 'Jharkhand' WHERE state IS NULL;

UPDATE public.bookings SET district = city WHERE district IS NULL AND city IS NOT NULL;

-- 4. Coverage Requests Table
CREATE TABLE IF NOT EXISTS public.coverage_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text,
  phone text NOT NULL,
  email text,
  service_id text REFERENCES public.services(id),
  service_name text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  locality text NOT NULL,
  pincode text,
  latitude numeric,
  longitude numeric,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  request_count int NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_request_locality_service UNIQUE (phone, service_name, state, district, locality)
);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS states_read_all ON public.states;
CREATE POLICY states_read_all ON public.states FOR SELECT USING (true);

DROP POLICY IF EXISTS districts_read_all ON public.districts;
CREATE POLICY districts_read_all ON public.districts FOR SELECT USING (true);

DROP POLICY IF EXISTS districts_admin_all ON public.districts;
CREATE POLICY districts_admin_all ON public.districts FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS coverage_requests_read_all ON public.coverage_requests;
CREATE POLICY coverage_requests_read_all ON public.coverage_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS coverage_requests_insert_all ON public.coverage_requests;
CREATE POLICY coverage_requests_insert_all ON public.coverage_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS coverage_requests_admin_all ON public.coverage_requests;
CREATE POLICY coverage_requests_admin_all ON public.coverage_requests FOR ALL USING (public.is_admin());

-- Indexes for fast locality and district queries
CREATE INDEX IF NOT EXISTS idx_districts_state_status ON public.districts(state_name, status);
CREATE INDEX IF NOT EXISTS idx_workers_district ON public.workers(district);
CREATE INDEX IF NOT EXISTS idx_contractors_district ON public.contractors(district);
CREATE INDEX IF NOT EXISTS idx_coverage_requests_district ON public.coverage_requests(district, status);
