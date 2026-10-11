-- Clean fresh-database schema for MyBrewLog.
-- Use migration.sql instead when upgrading an existing database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- GREEN BEANS
-- ============================================================================
CREATE TABLE green_beans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin TEXT,
  producer TEXT,
  importer TEXT,
  cupping_score NUMERIC,
  region TEXT,
  process TEXT,
  varietal TEXT,
  altitude TEXT,
  bean_density NUMERIC,
  purchase_price NUMERIC,
  purchase_weight_kg NUMERIC,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROAST PROFILES
-- ============================================================================
CREATE TABLE roast_profiles (
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

-- ============================================================================
-- ROASTS
-- ============================================================================
CREATE TABLE roasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  green_bean_id UUID NOT NULL REFERENCES green_beans(id) ON DELETE RESTRICT,
  roast_profile_id UUID REFERENCES roast_profiles(id) ON DELETE RESTRICT,
  date DATE,
  roast_time TIME,
  roast_level TEXT,
  resting_from_days NUMERIC,
  resting_to_days NUMERIC,
  first_crack TEXT,
  total_roast TEXT,
  start_weight NUMERIC,
  end_weight NUMERIC,
  reduction_percent NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROASTED BEANS
-- ============================================================================
CREATE TABLE roasted_beans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roaster TEXT,
  origin TEXT,
  producer TEXT,
  region TEXT,
  roast_level TEXT,
  process TEXT,
  varietal TEXT,
  altitude TEXT,
  type TEXT,
  roast_date DATE,
  source_roast_id UUID REFERENCES roasts(id) ON DELETE RESTRICT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RECIPES
-- ============================================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  brewer TEXT,
  filter_paper TEXT,
  dose NUMERIC,
  water NUMERIC,
  temperature NUMERIC,
  grind_size TEXT,
  bloom_water NUMERIC,
  bloom_time NUMERIC,
  num_pours NUMERIC,
  total_time TEXT,
  pour_structure TEXT,
  pours JSONB NOT NULL DEFAULT '[]'::jsonb,
  machine TEXT,
  grinder TEXT,
  pre_heat TEXT,
  pre_infusion_time NUMERIC,
  pre_infusion_bar NUMERIC,
  max_pressure_bar NUMERIC,
  max_pressure_until_g NUMERIC,
  finish_pressure_bar NUMERIC,
  shot_yield NUMERIC,
  brew_time NUMERIC,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BREWS
-- ============================================================================
CREATE TABLE brews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  roasted_bean_id UUID NOT NULL REFERENCES roasted_beans(id) ON DELETE RESTRICT,
  date DATE,
  method TEXT NOT NULL,
  brewer TEXT,
  filter_paper TEXT,
  dose NUMERIC,
  water NUMERIC,
  temperature NUMERIC,
  grind_size TEXT,
  bloom_water NUMERIC,
  bloom_time NUMERIC,
  num_pours NUMERIC,
  total_time TEXT,
  pour_structure TEXT,
  pours JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  tasting_notes TEXT,
  recipe_source TEXT DEFAULT 'Manual',
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_name TEXT,
  machine TEXT,
  grinder TEXT,
  pre_heat TEXT,
  pre_infusion_time NUMERIC,
  pre_infusion_bar NUMERIC,
  max_pressure_bar NUMERIC,
  max_pressure_until_g NUMERIC,
  finish_pressure_bar NUMERIC,
  shot_yield NUMERIC,
  brew_time NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX green_beans_user_id_idx ON green_beans(user_id);
CREATE INDEX green_beans_name_idx ON green_beans(name);
CREATE INDEX roast_profiles_user_id_idx ON roast_profiles(user_id);
CREATE INDEX roast_profiles_name_idx ON roast_profiles(name);
CREATE INDEX roast_profiles_last_used_idx ON roast_profiles(last_used DESC);
CREATE INDEX roasts_user_id_idx ON roasts(user_id);
CREATE INDEX roasts_green_bean_id_idx ON roasts(green_bean_id);
CREATE INDEX roasts_roast_profile_id_idx ON roasts(roast_profile_id);
CREATE INDEX roasts_date_idx ON roasts(date DESC);
CREATE INDEX roasted_beans_user_id_idx ON roasted_beans(user_id);
CREATE INDEX roasted_beans_name_idx ON roasted_beans(name);
CREATE INDEX roasted_beans_source_roast_id_idx ON roasted_beans(source_roast_id);
CREATE INDEX brews_user_id_idx ON brews(user_id);
CREATE INDEX brews_roasted_bean_id_idx ON brews(roasted_bean_id);
CREATE INDEX brews_date_idx ON brews(date DESC);
CREATE INDEX brews_recipe_id_idx ON brews(recipe_id);
CREATE INDEX recipes_user_id_idx ON recipes(user_id);
CREATE INDEX recipes_name_idx ON recipes(name);

-- Row-level security
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['green_beans', 'roast_profiles', 'roasts', 'roasted_beans', 'brews', 'recipes'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', table_name || '_owner_policy', table_name);
  END LOOP;
END $$;

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_green_beans_updated_at
BEFORE UPDATE ON green_beans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roast_profiles_updated_at
BEFORE UPDATE ON roast_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roasts_updated_at
BEFORE UPDATE ON roasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roasted_beans_updated_at
BEFORE UPDATE ON roasted_beans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brews_updated_at
BEFORE UPDATE ON brews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPC: atomic roasted bean + brews deletion
-- (Same as supabase/migrations/20261010120000_delete_roasted_bean_with_brews.sql)
-- ============================================================================
-- Atomically delete one roasted bean and all of its brews.
--
-- SECURITY INVOKER: runs as the calling user, so the existing owner RLS policies
-- on roasted_beans and brews still apply. The function body runs in a single
-- transaction; any error rolls back both deletions.
--
-- Errors (SQLSTATE):
--   42501  not authenticated
--   22004  missing bean id
--   P0002  bean not found or not owned by the caller (nothing deleted)
--   23001/23503  bean still referenced by rows the caller cannot delete (rolled back)
--
-- Returns the number of brews deleted.

CREATE OR REPLACE FUNCTION public.delete_roasted_bean_with_brews(p_bean_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_brew_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_bean_id IS NULL THEN
    RAISE EXCEPTION 'Missing roasted bean id' USING ERRCODE = '22004';
  END IF;

  -- Lock the bean so concurrent brew inserts for it wait until this transaction ends.
  PERFORM 1
  FROM public.roasted_beans
  WHERE id = p_bean_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Roasted bean not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.brews
  WHERE roasted_bean_id = p_bean_id AND user_id = v_user_id;
  GET DIAGNOSTICS v_brew_count = ROW_COUNT;

  DELETE FROM public.roasted_beans
  WHERE id = p_bean_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Roasted bean not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_brew_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_roasted_bean_with_brews(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_roasted_bean_with_brews(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_roasted_bean_with_brews(uuid) TO authenticated;
