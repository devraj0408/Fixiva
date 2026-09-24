-- 2026-07-15: Pre-checks and conservative auto-cleanup for services and city_services
-- WARNING: Review and run on staging first. Back up DB before applying to production.

-- =========================
-- PART A: Diagnostic Queries (run and inspect results)
-- =========================

-- 1) Services with NULL or negative prices
SELECT id, name, base_price, platform_fee FROM services WHERE base_price IS NULL OR platform_fee IS NULL OR base_price < 0 OR platform_fee < 0;

-- 2) Services with missing or empty names
SELECT id, name FROM services WHERE name IS NULL OR trim(name) = '';

-- 3) Duplicate service names (case-insensitive)
SELECT lower(trim(name)) AS n, array_agg(id) AS ids, count(*) FROM services GROUP BY lower(trim(name)) HAVING count(*) > 1;

-- 4) city_services rows that reference a missing service or missing city
SELECT cs.* FROM city_services cs LEFT JOIN services s ON cs.service_id = s.id LEFT JOIN cities c ON cs.city_id = c.id WHERE s.id IS NULL OR c.id IS NULL;

-- 5) city_services with NULL enabled
SELECT * FROM city_services WHERE enabled IS NULL;

-- 6) Services without updated_at (if updated_at is expected)
SELECT id, name, updated_at FROM services WHERE updated_at IS NULL;

-- =========================
-- PART B: Conservative Auto-cleanup (Transactional)
-- Runs a set of safe fixes and records actions in admin_audit if present.
-- Review before executing. Each block is wrapped in a transaction.
-- =========================

-- 1) Normalize names (trim, collapse whitespace)
DO $$
BEGIN
  UPDATE services SET name = regexp_replace(trim(name), '\s+', ' ', 'g') WHERE name IS NOT NULL AND (name <> regexp_replace(trim(name), '\\s+', ' ', 'g'));
  IF FOUND THEN
    -- optionally log changes if admin_audit exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
      INSERT INTO admin_audit (actor_id, action, object_type, object_id, payload)
      SELECT NULL, 'normalize_name', 'service', id::text, jsonb_build_object('new_name', name)
      FROM services WHERE name IS NOT NULL;
    END IF;
  END IF;
END$$;

-- 2) Fix NULL prices -> set to 0, and record previous values
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, base_price, platform_fee FROM services WHERE base_price IS NULL OR platform_fee IS NULL LOOP
    UPDATE services SET base_price = COALESCE(r.base_price, 0), platform_fee = COALESCE(r.platform_fee, 0) WHERE id = r.id;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
      INSERT INTO admin_audit (actor_id, action, object_type, object_id, payload)
      VALUES (NULL, 'fix_null_prices', 'service', r.id::text, jsonb_build_object('before', jsonb_build_object('base_price', r.base_price, 'platform_fee', r.platform_fee)));
    END IF;
  END LOOP;
END$$;

-- 3) Fix negative prices -> ABS(value) (conservative) and record previous values
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, base_price, platform_fee FROM services WHERE base_price < 0 OR platform_fee < 0 LOOP
    UPDATE services SET base_price = GREATEST(0, abs(base_price)), platform_fee = GREATEST(0, abs(platform_fee)) WHERE id = r.id;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
      INSERT INTO admin_audit (actor_id, action, object_type, object_id, payload)
      VALUES (NULL, 'fix_negative_prices', 'service', r.id::text, jsonb_build_object('before', jsonb_build_object('base_price', r.base_price, 'platform_fee', r.platform_fee)));
    END IF;
  END LOOP;
END$$;

-- 4) Empty or NULL names -> set to 'Unnamed Service - <id>'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM services WHERE name IS NULL OR trim(name) = '' LOOP
    UPDATE services SET name = ('Unnamed Service - ' || r.id::text) WHERE id = r.id;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
      INSERT INTO admin_audit (actor_id, action, object_type, object_id, payload)
      VALUES (NULL, 'fix_empty_name', 'service', r.id::text, jsonb_build_object('new_name', ('Unnamed Service - ' || r.id::text)));
    END IF;
  END LOOP;
END$$;

-- 5) De-duplicate service names (case-insensitive): keep the lowest-id row, mark others inactive and append suffix
DO $$
DECLARE dup RECORD;
DECLARE keep_id uuid;
BEGIN
  FOR dup IN SELECT lower(trim(name)) AS norm_name, array_agg(id ORDER BY id) AS ids FROM services GROUP BY lower(trim(name)) HAVING count(*) > 1 LOOP
    keep_id := dup.ids[1];
    -- mark others inactive and append suffix to make name unique
    PERFORM (
      UPDATE services SET active = false, name = name || ' (duplicate ' || id::text || ')' WHERE id = ANY(dup.ids) AND id <> keep_id
    );
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
      INSERT INTO admin_audit (actor_id, action, object_type, object_id, payload)
      SELECT NULL, 'dedupe_service', 'service', id::text, jsonb_build_object('kept', keep_id::text) FROM services WHERE id = ANY(dup.ids) AND id <> keep_id;
    END IF;
  END LOOP;
END$$;

-- 6) Orphan city_services rows: delete rows referencing missing service or missing city
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT cs.id, cs.city_id, cs.service_id FROM city_services cs LEFT JOIN services s ON cs.service_id = s.id LEFT JOIN cities c ON cs.city_id = c.id WHERE s.id IS NULL OR c.id IS NULL LOOP
    DELETE FROM city_services WHERE id = r.id;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
      INSERT INTO admin_audit (actor_id, action, object_type, object_id, payload)
      VALUES (NULL, 'delete_orphan_city_service', 'city_service', r.id::text, jsonb_build_object('city_id', r.city_id, 'service_id', r.service_id));
    END IF;
  END LOOP;
END$$;

-- 7) city_services NULL enabled -> set to true
DO $$
BEGIN
  UPDATE city_services SET enabled = true WHERE enabled IS NULL;
  IF FOUND AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit') THEN
    INSERT INTO admin_audit(actor_id, action, object_type, object_id, payload)
    SELECT NULL, 'fix_null_enabled', 'city_service', id::text, jsonb_build_object('set_enabled', true) FROM city_services WHERE enabled = true;
  END IF;
END$$;

-- 8) Ensure services.updated_at timestamp exists and backfill with now() if null
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='updated_at') THEN
    ALTER TABLE services ADD COLUMN updated_at timestamptz DEFAULT now();
  ELSE
    UPDATE services SET updated_at = now() WHERE updated_at IS NULL;
  END IF;
END$$;

-- =========================
-- END
-- Inspect `admin_audit` for logs of changes made by this script.
-- Run these in staging and review before applying to production.
-- =========================
