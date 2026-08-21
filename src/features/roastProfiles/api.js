import { sbDelete, sbGet, sbInsert, sbUpdate } from "../../lib/supabase";
import { roastProfilePayload } from "./model";

export async function loadRoastProfiles(token) {
  return sbGet("roast_profiles", token, "select=*&order=updated_at.desc");
}

export async function saveRoastProfile(token, profile) {
  if (!token) return null;
  const payload = roastProfilePayload(profile);
  return profile.id
    ? await sbUpdate("roast_profiles", token, profile.id, payload)
    : await sbInsert("roast_profiles", token, payload);
}

export async function deleteRoastProfile(token, id) {
  if (!token) return false;
  return sbDelete("roast_profiles", token, id);
}