import { sbGet, sbInsert, sbUpdate, sbDelete } from "../../lib/supabase";
import { greenBeanPayload } from "./model";

export async function loadGreenBeans(token) {
  return sbGet("green_beans", token, "select=*&order=created_at.desc");
}

export async function saveGreenBean(token, bean) {
  if (!token) return null;
  const payload = greenBeanPayload(bean);
  return bean.id
    ? await sbUpdate("green_beans", token, bean.id, payload)
    : await sbInsert("green_beans", token, payload);
}

export async function deleteGreenBean(token, id) {
  if (!token) return false;
  return sbDelete("green_beans", token, id);
}
