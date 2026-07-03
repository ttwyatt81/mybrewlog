import { useCallback, useState } from "react";
import { loadBeans, saveBean, deleteBean } from "./api";
import { combineBeansAndBrews, normalizeBeanRow } from "./model";

export function useBeans(initialBeans = []) {
  const [beans, setBeans] = useState(initialBeans);

  const load = useCallback(async (token, brewRows = []) => {
    const beanRows = await loadBeans(token);
    setBeans((current) => combineBeansAndBrews(beanRows, brewRows, current));
    return beanRows;
  }, []);

  const save = useCallback(async (token, bean) => {
    const saved = await saveBean(token, bean);
    if (!saved) return null;

    const normalized = { ...normalizeBeanRow(saved), brews: bean.brews || [] };
    setBeans((current) => {
      const exists = current.some((existing) => existing.id === normalized.id);
      return exists
        ? current.map((existing) => (existing.id === normalized.id ? normalized : existing))
        : [{ ...normalized, brews: bean.brews || [] }, ...current];
    });

    return normalized;
  }, []);

  const remove = useCallback(async (token, id) => {
    const deleted = await deleteBean(token, id);
    if (deleted) {
      setBeans((current) => current.filter((bean) => bean.id !== id));
    }
    return deleted;
  }, []);

  return { beans, setBeans, load, save, remove };
}
