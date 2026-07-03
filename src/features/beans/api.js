import { sbGet, sbInsert, sbUpdate, sbDelete } from "../../lib/supabase";
import { beanPayload } from "./model";

export async function loadBeans(token) {
  return sbGet("beans", token, "select=*&order=name.asc");
}

export async function saveBean(token, bean) {
  if (!token) return null;
  const payload = beanPayload(bean);
  return bean.id
    ? await sbUpdate("beans", token, bean.id, payload)
    : await sbInsert("beans", token, payload);
}

export async function deleteBean(token, id) {
  if (!token) return false;
  return sbDelete("beans", token, id);
}
