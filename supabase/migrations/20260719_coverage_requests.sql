-- Create coverage_requests table
CREATE TABLE IF NOT EXISTS public.coverage_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  city text NOT NULL,
  state text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_city_email UNIQUE (city, email)
);
