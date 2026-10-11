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
