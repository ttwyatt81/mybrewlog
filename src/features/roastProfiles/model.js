export function normalizeRoastProfileRow(row = {}) {
  const archivedValue = row.archived ?? row.is_archived;
  return {
    id: row.id,
    name: row.name || "",
    profile: row.name || "",
    machine: row.machine || "",
    description: row.description || "",
    lastUsed: row.last_used || row.lastUsed || "",
    archived: archivedValue === true || archivedValue === "true" || archivedValue === 1 || archivedValue === "1",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

export function roastProfilePayload(profile = {}) {
  return {
    name: (profile.name || profile.profile || "").trim(),
    machine: profile.machine ? profile.machine.trim() : null,
    description: profile.description ? profile.description.trim() : null,
    last_used: profile.lastUsed || null,
    archived: Boolean(profile.archived),
  };
}