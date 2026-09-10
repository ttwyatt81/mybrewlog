-- Existing-database migration for MyBrewLog.
-- Run this against an existing database. For a fresh database, use schema.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Rename legacy tables and indexes.
ALTER TABLE IF EXISTS green_bean_roasts RENAME TO roasts;
ALTER INDEX IF EXISTS green_bean_roasts_user_id_idx RENAME TO roasts_user_id_idx;
ALTER INDEX IF EXISTS green_bean_roasts_green_bean_id_idx RENAME TO roasts_green_bean_id_idx;
ALTER INDEX IF EXISTS green_bean_roasts_date_idx RENAME TO roasts_date_idx;

ALTER TABLE IF EXISTS beans RENAME TO roasted_beans;
ALTER INDEX IF EXISTS beans_user_id_idx RENAME TO roasted_beans_user_id_idx;
ALTER INDEX IF EXISTS beans_name_idx RENAME TO roasted_beans_name_idx;
ALTER INDEX IF EXISTS beans_source_roast_id_idx RENAME TO roasted_beans_source_roast_id_idx;

-- Create the profile table before roasts reference it. This is safe when the
-- table already exists and supports databases from before roast profiles were added.
CREATE TABLE IF NOT EXISTS roast_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  machine TEXT,
  description TEXT,
  last_used DATE,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Protect the table immediately; the final RLS block below normalizes all policies.
ALTER TABLE roast_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE roast_profiles ADD COLUMN IF NOT EXISTS machine TEXT;
ALTER TABLE roast_profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE roast_profiles ADD COLUMN IF NOT EXISTS last_used DATE;
ALTER TABLE roast_profiles ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE roast_profiles DROP COLUMN IF EXISTS rating;
ALTER TABLE roast_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE roast_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE roast_profiles SET created_at = COALESCE(created_at, updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE roast_profiles ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure columns introduced by later application versions exist.
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS producer TEXT;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS importer TEXT;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS cupping_score NUMERIC;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS bean_density NUMERIC;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'green_beans' AND column_name = 'bean_density'
      AND data_type NOT IN ('numeric', 'decimal')
  ) THEN
    ALTER TABLE green_beans
      ALTER COLUMN bean_density TYPE NUMERIC
      USING CASE
        WHEN NULLIF(TRIM(bean_density::text), '') ~ '^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)$'
          THEN NULLIF(TRIM(bean_density::text), '')::NUMERIC
        ELSE NULL
      END;
  END IF;
END $$;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE green_beans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE green_beans SET created_at = COALESCE(created_at, updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE green_beans ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE roasted_beans ADD COLUMN IF NOT EXISTS producer TEXT;
ALTER TABLE roasted_beans ADD COLUMN IF NOT EXISTS source_roast_id UUID;
ALTER TABLE roasted_beans ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE roasted_beans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE roasted_beans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE roasted_beans SET created_at = COALESCE(created_at, updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE roasted_beans ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE roasts ADD COLUMN IF NOT EXISTS roast_profile_id UUID;
ALTER TABLE roasts ADD COLUMN IF NOT EXISTS profile TEXT;
ALTER TABLE roasts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE roasts SET created_at = COALESCE(created_at, updated_at, NOW()) WHERE created_at IS NULL;
ALTER TABLE roasts ALTER COLUMN created_at SET DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brews' AND column_name = 'bean_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brews' AND column_name = 'roasted_bean_id'
  ) THEN
    ALTER TABLE brews RENAME COLUMN bean_id TO roasted_bean_id;
  END IF;
END $$;

ALTER TABLE brews ADD COLUMN IF NOT EXISTS roasted_bean_id UUID;
ALTER TABLE brews ADD COLUMN IF NOT EXISTS pours JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE brews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brews_roasted_bean_id_fkey'
  ) THEN
    ALTER TABLE brews
      ADD CONSTRAINT brews_roasted_bean_id_fkey
      FOREIGN KEY (roasted_bean_id) REFERENCES roasted_beans(id) ON DELETE RESTRICT;
  END IF;
END $$;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Normalize relationship delete behavior to RESTRICT.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint AS con
    JOIN pg_attribute AS att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND con.conrelid = 'roasts'::regclass
      AND att.attname = 'green_bean_id'
  LOOP
    EXECUTE format('ALTER TABLE roasts DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint AS con
    JOIN pg_attribute AS att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND con.conrelid = 'roasted_beans'::regclass
      AND att.attname = 'source_roast_id'
  LOOP
    EXECUTE format('ALTER TABLE roasted_beans DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint AS con
    JOIN pg_attribute AS att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND con.conrelid = 'brews'::regclass
      AND att.attname = 'roasted_bean_id'
  LOOP
    EXECUTE format('ALTER TABLE brews DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  ALTER TABLE roasts
    ADD CONSTRAINT roasts_green_bean_id_fkey
    FOREIGN KEY (green_bean_id) REFERENCES green_beans(id) ON DELETE RESTRICT;
  ALTER TABLE roasted_beans
    ADD CONSTRAINT roasted_beans_source_roast_id_fkey
    FOREIGN KEY (source_roast_id) REFERENCES roasts(id) ON DELETE RESTRICT;
  ALTER TABLE brews
    ADD CONSTRAINT brews_roasted_bean_id_fkey
    FOREIGN KEY (roasted_bean_id) REFERENCES roasted_beans(id) ON DELETE RESTRICT;
END $$;

-- Move legacy JSON roast records into the relational table, then remove the duplicate column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'green_beans' AND column_name = 'roasts'
  ) THEN
    INSERT INTO roasts (
      id, user_id, green_bean_id, date, roast_time, profile, roast_level,
      resting_from_days, resting_to_days, first_crack, total_roast,
      start_weight, end_weight, reduction_percent, notes, created_at, updated_at
    )
    SELECT
      CASE
        WHEN item->>'id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
          THEN (item->>'id')::uuid
        ELSE gen_random_uuid()
      END,
      bean.user_id,
      bean.id,
      NULLIF(item->>'date', '')::date,
      NULLIF(item->>'roast_time', ''),
      NULLIF(item->>'profile', ''),
      NULLIF(COALESCE(item->>'roast_level', item->>'roastLevel'), ''),
      NULLIF(COALESCE(item->>'resting_from_days', item->>'restingFromDays'), '')::numeric,
      NULLIF(COALESCE(item->>'resting_to_days', item->>'restingToDays'), '')::numeric,
      NULLIF(COALESCE(item->>'first_crack', item->>'firstCrack'), ''),
      NULLIF(COALESCE(item->>'total_roast', item->>'totalRoast'), ''),
      NULLIF(COALESCE(item->>'start_weight', item->>'startWeight'), '')::numeric,
      NULLIF(COALESCE(item->>'end_weight', item->>'endWeight'), '')::numeric,
      NULLIF(COALESCE(item->>'reduction_percent', item->>'reductionPercent'), '')::numeric,
      NULLIF(item->>'notes', ''), NOW(), NOW()
    FROM green_beans AS bean
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(bean.roasts, '[]'::jsonb)) AS item
    ON CONFLICT (id) DO NOTHING;

    ALTER TABLE green_beans DROP COLUMN roasts;
  END IF;
END $$;

-- Link legacy free-text profile names to profile rows owned by the same user.
INSERT INTO roast_profiles (user_id, name)
SELECT DISTINCT roast.user_id, TRIM(roast.profile)
FROM roasts AS roast
WHERE NULLIF(TRIM(roast.profile), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM roast_profiles AS profile
    WHERE profile.user_id = roast.user_id
      AND LOWER(TRIM(profile.name)) = LOWER(TRIM(roast.profile))
  );

UPDATE roasts AS roast
SET roast_profile_id = profile.id
FROM roast_profiles AS profile
WHERE roast.roast_profile_id IS NULL
  AND roast.profile IS NOT NULL
  AND LOWER(TRIM(roast.profile)) = LOWER(TRIM(profile.name))
  AND roast.user_id = profile.user_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roasts_roast_profile_id_fkey'
  ) THEN
    ALTER TABLE roasts
      ADD CONSTRAINT roasts_roast_profile_id_fkey
      FOREIGN KEY (roast_profile_id) REFERENCES roast_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- The relational profile ID is now the sole source of truth.
ALTER TABLE roasts DROP COLUMN IF EXISTS profile;

CREATE INDEX IF NOT EXISTS green_beans_user_id_idx ON green_beans(user_id);
CREATE INDEX IF NOT EXISTS green_beans_name_idx ON green_beans(name);
CREATE INDEX IF NOT EXISTS roast_profiles_user_id_idx ON roast_profiles(user_id);
CREATE INDEX IF NOT EXISTS roast_profiles_name_idx ON roast_profiles(name);
CREATE INDEX IF NOT EXISTS roast_profiles_last_used_idx ON roast_profiles(last_used DESC);
CREATE INDEX IF NOT EXISTS roasts_user_id_idx ON roasts(user_id);
CREATE INDEX IF NOT EXISTS roasts_green_bean_id_idx ON roasts(green_bean_id);
CREATE INDEX IF NOT EXISTS roasts_roast_profile_id_idx ON roasts(roast_profile_id);
CREATE INDEX IF NOT EXISTS roasts_date_idx ON roasts(date DESC);
CREATE INDEX IF NOT EXISTS roasted_beans_user_id_idx ON roasted_beans(user_id);
CREATE INDEX IF NOT EXISTS roasted_beans_name_idx ON roasted_beans(name);
CREATE INDEX IF NOT EXISTS roasted_beans_source_roast_id_idx ON roasted_beans(source_roast_id);
CREATE INDEX IF NOT EXISTS brews_user_id_idx ON brews(user_id);
ALTER INDEX IF EXISTS brews_bean_id_idx RENAME TO brews_roasted_bean_id_idx;
CREATE INDEX IF NOT EXISTS brews_roasted_bean_id_idx ON brews(roasted_bean_id);
CREATE INDEX IF NOT EXISTS brews_date_idx ON brews(date DESC);
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON recipes(user_id);
CREATE INDEX IF NOT EXISTS recipes_name_idx ON recipes(name);

-- Apply ownership defaults and RLS to the existing tables.
ALTER TABLE green_beans ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE roast_profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE roasts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE roasted_beans ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE brews ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE recipes ALTER COLUMN user_id SET DEFAULT auth.uid();

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['green_beans', 'roast_profiles', 'roasts', 'roasted_beans', 'brews', 'recipes'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- Normalize policies so the migration does not depend on policies from an older schema.
-- Dropping all policies first also prevents stale permissive policies from widening access.
DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['green_beans', 'roast_profiles', 'roasts', 'roasted_beans', 'brews', 'recipes'] LOOP
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', policy_name, table_name);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY green_beans_owner_policy ON green_beans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY roast_profiles_owner_policy ON roast_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY roasts_owner_policy ON roasts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY roasted_beans_owner_policy ON roasted_beans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY brews_owner_policy ON brews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipes_owner_policy ON recipes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Normalize updated_at triggers to match the fresh schema.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_green_beans_updated_at ON green_beans;
CREATE TRIGGER update_green_beans_updated_at
BEFORE UPDATE ON green_beans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roast_profiles_updated_at ON roast_profiles;
CREATE TRIGGER update_roast_profiles_updated_at
BEFORE UPDATE ON roast_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roasts_updated_at ON roasts;
DROP TRIGGER IF EXISTS update_green_bean_roasts_updated_at ON roasts;
CREATE TRIGGER update_roasts_updated_at
BEFORE UPDATE ON roasts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roasted_beans_updated_at ON roasted_beans;
DROP TRIGGER IF EXISTS update_beans_updated_at ON roasted_beans;
CREATE TRIGGER update_roasted_beans_updated_at
BEFORE UPDATE ON roasted_beans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brews_updated_at ON brews;
CREATE TRIGGER update_brews_updated_at
BEFORE UPDATE ON brews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
