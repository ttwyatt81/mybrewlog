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
  price NUMERIC,
  weight_kg NUMERIC,
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
  roast_profile_id UUID REFERENCES roast_profiles(id) ON DELETE SET NULL,
  date DATE,
  roast_time TEXT,
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
  rating NUMERIC DEFAULT 0,
  tasting_notes TEXT,
  recipe_source TEXT DEFAULT 'Manual',
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
