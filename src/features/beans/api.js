import { sbGet, sbInsert, sbUpdate } from "../../lib/supabase.js";
import { deleteRoastedBeanWithBrews } from "./deleteRoastedBean.js";
import { beanPayload } from "./model.js";

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
  return deleteRoastedBeanWithBrews(token, id);
}
