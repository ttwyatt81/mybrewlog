import { sbGet, sbInsert, sbUpdate, sbDeleteRow } from "../../lib/supabase.js";
import { DELETION_KINDS, getDeletionTable } from "../deletion/deletion.js";
import { greenBeanPayload, greenBeanRoastPayload } from "./model.js";

export async function loadGreenBeans(token) {
  return sbGet("green_beans", token, "select=*&order=created_at.desc");
}

export async function loadGreenBeanRoasts(token) {
  return sbGet("roasts", token, "select=*,roast_profiles(name)&order=date.desc,created_at.desc");
}

export async function saveGreenBean(token, bean) {
  if (!token) return null;
  const payload = greenBeanPayload(bean);
  return bean.id
    ? await sbUpdate("green_beans", token, bean.id, payload)
    : await sbInsert("green_beans", token, payload);
}

export async function saveGreenBeanRoast(token, roast) {
  if (!token) return null;
  const payload = greenBeanRoastPayload(roast);
  return roast.id
    ? await sbUpdate("roasts", token, roast.id, payload)
    : await sbInsert("roasts", token, payload);
}

export async function deleteGreenBean(token, id) {
  if (!token) return { ok: false, skipped: true };
  return sbDeleteRow(getDeletionTable(DELETION_KINDS.GREEN_BEAN), token, id);
}

export async function deleteGreenBeanRoast(token, id) {
  if (!token) return { ok: false, skipped: true };
  return sbDeleteRow(getDeletionTable(DELETION_KINDS.ROAST), token, id);
}
