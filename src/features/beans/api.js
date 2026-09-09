import { sbGet, sbInsert, sbUpdate, sbDelete } from "../../lib/supabase";
import { beanPayload } from "./model";

export async function loadBeans(token) {
  return sbGet("roasted_beans", token, "select=*&order=created_at.desc");
}

export async function saveBean(token, bean) {
  if (!token) return null;
  const payload = beanPayload(bean);
  return bean.id
    ? await sbUpdate("roasted_beans", token, bean.id, payload)
    : await sbInsert("roasted_beans", token, payload);
}

export async function deleteBean(token, id) {
  if (!token) return false;
  return sbDelete("roasted_beans", token, id);
}
