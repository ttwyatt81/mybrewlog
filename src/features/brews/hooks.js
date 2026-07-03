import { useCallback, useState } from "react";
import { loadBrews, saveBrew, deleteBrew } from "./api";
import { normalizeBrewRow } from "./model";

export function useBrews(initialBrews = []) {
  const [brews, setBrews] = useState(initialBrews);

  const load = useCallback(async (token) => {
    const brewRows = await loadBrews(token);
    const normalizedBrews = (brewRows || []).map((row) => normalizeBrewRow(row));
    setBrews(normalizedBrews);
    return brewRows;
  }, []);

  const save = useCallback(async (token, brew) => {
    const saved = await saveBrew(token, brew);
    if (!saved) return null;

    const normalized = normalizeBrewRow(saved);
    setBrews((current) => {
      const exists = current.some((existing) => existing.id === normalized.id);
      return exists
        ? current.map((existing) => (existing.id === normalized.id ? normalized : existing))
        : [normalized, ...current];
    });

    return normalized;
  }, []);

  const remove = useCallback(async (token, id) => {
    const deleted = await deleteBrew(token, id);
    if (deleted) {
      setBrews((current) => current.filter((brew) => brew.id !== id));
    }
    return deleted;
  }, []);

  return { brews, setBrews, load, save, remove };
}
