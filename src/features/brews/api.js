import { sbGet, sbInsert, sbUpdate, sbDelete } from "../../lib/supabase";
import { brewPayload } from "./model";

export async function loadBrews(token) {
  return sbGet("brews", token, "select=*&order=date.desc");
}

export async function saveBrew(token, brew) {
  if (!token) return null;
  const payload = brewPayload(brew);
  return brew.id
    ? await sbUpdate("brews", token, brew.id, payload)
    : await sbInsert("brews", token, payload);
}

export async function deleteBrew(token, id) {
  if (!token) return false;
  return sbDelete("brews", token, id);
}
