import { useCallback, useState } from "react";
import { loadGreenBeans, loadGreenBeanRoasts, saveGreenBean, saveGreenBeanRoast, deleteGreenBean, deleteGreenBeanRoast } from "./api";
import { normalizeGreenBeanRoast, normalizeGreenBeanRow, sortGreenBeanRoasts, sortGreenBeansByRecentActivity } from "./model";

export function useGreenBeans(initialBeans = []) {
  const [beans, setBeans] = useState(initialBeans);

  const load = useCallback(async (token) => {
    const [rows, roastRows] = await Promise.all([
      loadGreenBeans(token),
      loadGreenBeanRoasts(token),
    ]);

    const roastsByBeanId = (roastRows || []).reduce((acc, roastRow) => {
      const roast = normalizeGreenBeanRoast(roastRow);
      const key = roast.greenBeanId;
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(roast);
      return acc;
    }, {});

    const normalized = (rows || []).map((row) => {
      const bean = normalizeGreenBeanRow(row);
      const tableRoasts = roastsByBeanId[bean.id] || [];
      return {
        ...bean,
        roasts: sortGreenBeanRoasts(tableRoasts),
      };
    });

    setBeans(sortGreenBeansByRecentActivity(normalized));
    return rows;
  }, []);

  const save = useCallback(async (token, bean) => {
    const saved = await saveGreenBean(token, bean);
    if (!saved) return null;

    const normalized = normalizeGreenBeanRow(saved);
    setBeans((current) => sortGreenBeansByRecentActivity(
      current.some((existing) => existing.id === normalized.id)
        ? current.map((existing) => (existing.id === normalized.id ? { ...normalized, roasts: existing.roasts || [] } : existing))
        : [normalized, ...current]
    ));

    return normalized;
  }, []);

  const saveRoast = useCallback(async (token, roast) => {
    const saved = await saveGreenBeanRoast(token, roast);
    if (!saved) return null;

    const normalizedRoast = normalizeGreenBeanRoast(saved);
    if (!normalizedRoast.greenBeanId) return normalizedRoast;

    setBeans((current) => sortGreenBeansByRecentActivity(
      current.map((bean) => {
        if (bean.id !== normalizedRoast.greenBeanId) return bean;
        const nextRoasts = Array.isArray(bean.roasts) ? [...bean.roasts] : [];
        const existingIndex = nextRoasts.findIndex((item) => item.id === normalizedRoast.id);
        if (existingIndex >= 0) {
          nextRoasts[existingIndex] = normalizedRoast;
        } else {
          nextRoasts.unshift(normalizedRoast);
        }
        return { ...bean, roasts: sortGreenBeanRoasts(nextRoasts) };
      })
    ));

    return normalizedRoast;
  }, []);

  const remove = useCallback(async (token, id) => {
    const deleted = await deleteGreenBean(token, id);
    if (deleted) {
      setBeans((current) => current.filter((bean) => bean.id !== id));
    }
    return deleted;
  }, []);

  const removeRoast = useCallback(async (token, roastId, greenBeanId) => {
    const deleted = await deleteGreenBeanRoast(token, roastId);
    if (deleted && greenBeanId) {
      setBeans((current) => sortGreenBeansByRecentActivity(
        current.map((bean) => {
          if (bean.id !== greenBeanId) return bean;
          return { ...bean, roasts: (bean.roasts || []).filter((roast) => roast.id !== roastId) };
        })
      ));
    }
    return deleted;
  }, []);

  return { beans, setBeans, load, save, remove, saveRoast, removeRoast };
}
