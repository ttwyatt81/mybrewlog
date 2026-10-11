-- Keep roast-profile references intact by rejecting deletes while any roast uses the profile.
ALTER TABLE public.roasts
  DROP CONSTRAINT IF EXISTS roasts_roast_profile_id_fkey;

ALTER TABLE public.roasts
  ADD CONSTRAINT roasts_roast_profile_id_fkey
  FOREIGN KEY (roast_profile_id)
  REFERENCES public.roast_profiles(id)
  ON DELETE RESTRICT;
