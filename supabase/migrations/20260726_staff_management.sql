-- 20260726_staff_management.sql
-- Dedicated Staff Management Schema and Realtime Setup for Contractors

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  phone text,
  city text,
  status text NOT NULL DEFAULT 'Available',
  trust_score int NOT NULL DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policy for staff table
DROP POLICY IF EXISTS "staff_all" ON public.staff;
CREATE POLICY "staff_all" ON public.staff FOR ALL USING (true);

-- Add to realtime publication if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
