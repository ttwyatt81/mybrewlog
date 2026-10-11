import { sbRpc } from "../../lib/supabase.js";

export const DELETE_ROASTED_BEAN_RPC = "delete_roasted_bean_with_brews";

// One RPC call deletes the bean and its brews in a single database transaction.
export async function deleteRoastedBeanWithBrews(token, id) {
  if (!token || !id) return { ok: false, skipped: true };
  const result = await sbRpc(DELETE_ROASTED_BEAN_RPC, token, { p_bean_id: id });
  if (!result.ok) return result;
  return { ...result, deletedBrewCount: typeof result.data === "number" ? result.data : null };
}
