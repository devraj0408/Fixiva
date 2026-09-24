-- 20260728_notifications_schema_enhancement.sql
-- Ensure all notification table fields exist and Realtime is enabled

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Permissive RLS policy for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);

-- Ensure table is added to realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
