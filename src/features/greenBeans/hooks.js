import { useCallback, useState } from "react";
import { loadGreenBeans, saveGreenBean, deleteGreenBean } from "./api";
import { normalizeGreenBeanRow, sortGreenBeansByRecentActivity } from "./model";

export function useGreenBeans(initialBeans = []) {
  const [beans, setBeans] = useState(initialBeans);

  const load = useCallback(async (token) => {
    const rows = await loadGreenBeans(token);
    const normalized = (rows || []).map((row) => normalizeGreenBeanRow(row));
    setBeans(sortGreenBeansByRecentActivity(normalized));
    return rows;
  }, []);

  const save = useCallback(async (token, bean) => {
    const saved = await saveGreenBean(token, bean);
    if (!saved) return null;

    const normalized = normalizeGreenBeanRow(saved);
    setBeans((current) => sortGreenBeansByRecentActivity(
      current.some((existing) => existing.id === normalized.id)
        ? current.map((existing) => (existing.id === normalized.id ? normalized : existing))
        : [normalized, ...current]
    ));

    return normalized;
  }, []);

  const remove = useCallback(async (token, id) => {
    const deleted = await deleteGreenBean(token, id);
    if (deleted) {
      setBeans((current) => current.filter((bean) => bean.id !== id));
    }
    return deleted;
  }, []);

  return { beans, setBeans, load, save, remove };
}
