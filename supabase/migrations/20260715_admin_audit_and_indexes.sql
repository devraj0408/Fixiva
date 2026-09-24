-- 2026-07-15: Add admin_audit table, triggers, and useful indexes

-- admin audit table
CREATE TABLE IF NOT EXISTS admin_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  object_type text,
  object_id text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- function to insert audit row
CREATE OR REPLACE FUNCTION public.log_admin_action(p_actor_id uuid, p_actor_email text, p_action text, p_object_type text, p_object_id text, p_payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO admin_audit (actor_id, actor_email, action, object_type, object_id, payload) VALUES (p_actor_id, p_actor_email, p_action, p_object_type, p_object_id, p_payload);
END;$$;

-- useful indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_city_services_city') THEN
    CREATE INDEX idx_city_services_city ON city_services (city_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_city_services_service') THEN
    CREATE INDEX idx_city_services_service ON city_services (service_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_updated_at') THEN
    ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
    CREATE INDEX idx_services_updated_at ON services (updated_at);
  END IF;
END$$;

-- trigger to update updated_at on services
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'services_touch_updated_at') THEN
    CREATE TRIGGER services_touch_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END$$;

-- End of migration
