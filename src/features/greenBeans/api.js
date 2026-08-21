import { sbGet, sbInsert, sbUpdate, sbDelete } from "../../lib/supabase";
import { greenBeanPayload, greenBeanRoastPayload } from "./model";

export async function loadGreenBeans(token) {
  return sbGet("green_beans", token, "select=*&order=created_at.desc");
}

export async function loadGreenBeanRoasts(token) {
  return sbGet("green_bean_roasts", token, "select=*&order=date.desc,created_at.desc");
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
    ? await sbUpdate("green_bean_roasts", token, roast.id, payload)
    : await sbInsert("green_bean_roasts", token, payload);
}

export async function deleteGreenBean(token, id) {
  if (!token) return false;
  return sbDelete("green_beans", token, id);
}

export async function deleteGreenBeanRoast(token, id) {
  if (!token) return false;
  return sbDelete("green_bean_roasts", token, id);
}
