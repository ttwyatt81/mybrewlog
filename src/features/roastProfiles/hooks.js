import { useCallback, useState } from "react";
import { deleteRoastProfile, loadRoastProfiles, saveRoastProfile } from "./api";
import { normalizeRoastProfileRow } from "./model";

export function useRoastProfiles(initialProfiles = []) {
  const [roastProfiles, setRoastProfiles] = useState(initialProfiles);

  const load = useCallback(async (token) => {
    const rows = await loadRoastProfiles(token);
    const normalized = (rows || []).map((row) => normalizeRoastProfileRow(row));
    setRoastProfiles(normalized);
    return rows;
  }, []);

  const save = useCallback(async (token, profile) => {
    const saved = await saveRoastProfile(token, profile);
    if (!saved) return null;

    const normalized = normalizeRoastProfileRow(saved);
    setRoastProfiles((current) => {
      const exists = current.some((existing) => existing.id === normalized.id);
      return exists
        ? current.map((existing) => (existing.id === normalized.id ? normalized : existing))
        : [normalized, ...current];
    });

    return normalized;
  }, []);

  const remove = useCallback(async (token, id) => {
    const deleted = await deleteRoastProfile(token, id);
    if (deleted) {
      setRoastProfiles((current) => current.filter((profile) => profile.id !== id));
    }
    return deleted;
  }, []);

  return { roastProfiles, setRoastProfiles, load, save, remove };
}