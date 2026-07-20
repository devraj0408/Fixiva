-- Create states table
CREATE TABLE IF NOT EXISTS public.states (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'Live' CHECK (status IN ('Live', 'Disabled')),
  display_order int NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on states
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

-- Create RLS policies on states
DROP POLICY IF EXISTS states_read_all ON public.states;
DROP POLICY IF EXISTS states_admin_all ON public.states;

CREATE POLICY states_read_all ON public.states FOR SELECT USING (true);
CREATE POLICY states_admin_all ON public.states FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add columns to cities (districts) table
ALTER TABLE public.cities 
  ADD COLUMN IF NOT EXISTS state_id int REFERENCES public.states(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Coming Soon' CHECK (status IN ('Live', 'Coming Soon', 'Disabled')),
  ADD COLUMN IF NOT EXISTS display_order int NOT NULL DEFAULT 0;

-- Populate states from existing unique regions in cities
INSERT INTO public.states (name, status, display_order)
SELECT DISTINCT region, 'Live', 0 FROM public.cities
ON CONFLICT (name) DO NOTHING;

-- Update state_id in cities matching the region
UPDATE public.cities c
SET state_id = s.id
FROM public.states s
WHERE c.region = s.name;

-- Set status of existing cities 1 to 5 to 'Live'
UPDATE public.cities
SET status = 'Live'
WHERE id IN (1, 2, 3, 4, 5);
