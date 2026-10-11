export const DELETION_KINDS = {
  GREEN_BEAN: "greenBean",
  ROASTED_BEAN: "roastedBean",
  ROAST: "roast",
  ROAST_PROFILE: "roastProfile",
};

// 23503 = foreign_key_violation (NO ACTION); 23001 = restrict_violation (ON DELETE RESTRICT).
const DEPENDENCY_VIOLATIONS = new Set(["23503", "23001"]);
const NOT_FOUND = "P0002";
const NOT_AUTHENTICATED = "42501";
// PostgREST reports an unknown RPC as PGRST202; Postgres itself uses 42883.
const UNDEFINED_FUNCTION = "PGRST202";

function isDependencyViolation(result) {
  return DEPENDENCY_VIOLATIONS.has(result?.code);
}

const DELETION_CONFIG = {
  [DELETION_KINDS.GREEN_BEAN]: {
    table: "green_beans",
    label: "green bean",
    dependency: "it has roast logs",
    remedy: "Archive it instead to keep its roast history, or delete its roast logs first.",
  },
  [DELETION_KINDS.ROASTED_BEAN]: {
    table: "roasted_beans",
    label: "bean",
    dependency: "it is still referenced by other records",
    remedy: "Nothing was deleted. Refresh and try again.",
  },
  [DELETION_KINDS.ROAST]: {
    table: "roasts",
    label: "roast log",
    dependency: "a roasted bean was created from it",
    remedy: "That roasted bean and its brew history depend on this roast. Delete the roasted bean first if you no longer need it.",
  },
  [DELETION_KINDS.ROAST_PROFILE]: {
    table: "roast_profiles",
    label: "roast profile",
    blockedMessage: "Cannot delete this roast profile because it is used by existing roast logs. Archive it instead to keep your roast history.",
  },
};

export function getDeletionConfig(kind) {
  const config = DELETION_CONFIG[kind];
  if (!config) throw new Error(`Unknown deletion kind: ${kind}`);
  return config;
}

export function getDeletionTable(kind) {
  return getDeletionConfig(kind).table;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function findDeletionBlocker(kind, record, { roastedBeans = [], roasts = [] } = {}) {
  if (!record) return null;
  const { label, remedy } = getDeletionConfig(kind);

  if (kind === DELETION_KINDS.GREEN_BEAN) {
    const count = (record.roasts || []).length;
    return count ? `Can't delete this ${label}: it has ${plural(count, "roast log")}. ${remedy}` : null;
  }
  if (kind === DELETION_KINDS.ROAST) {
    const linked = roastedBeans.some((bean) => bean.sourceRoastId === record.id);
    return linked ? `Can't delete this ${label}: ${DELETION_CONFIG[kind].dependency}. ${remedy}` : null;
  }
  if (kind === DELETION_KINDS.ROAST_PROFILE) {
    const linked = roasts.some((roast) => roast.roastProfileId === record.id);
    return linked ? DELETION_CONFIG[kind].blockedMessage : null;
  }
  return null;
}

// Extra confirmation copy for deletions that also remove dependent records.
export function getDeletionConfirmationDetail(kind, record) {
  if (kind !== DELETION_KINDS.ROASTED_BEAN) return "";
  const count = (record?.brews || []).length;
  return count
    ? `This will permanently delete this bean and its ${plural(count, "brew")}, including tasting notes and ratings. This action cannot be undone.`
    : "";
}

export function describeDeletionFailure(kind, result = {}) {
  if (kind === DELETION_KINDS.ROAST_PROFILE && isDependencyViolation(result)) {
    return DELETION_CONFIG[kind].blockedMessage;
  }
  const { label, dependency, remedy } = getDeletionConfig(kind);
  if (kind === DELETION_KINDS.ROASTED_BEAN) {
    if (result.code === NOT_FOUND) {
      return "Couldn't delete this bean: it no longer exists or doesn't belong to your account. Nothing was deleted. Refresh to update the list.";
    }
    if (result.code === NOT_AUTHENTICATED) {
      return "Couldn't delete this bean: your session has expired. Sign in again and retry. Nothing was deleted.";
    }
    if (result.code === UNDEFINED_FUNCTION) {
      return "Couldn't delete this bean: the database is missing the delete_roasted_bean_with_brews function. Apply the latest Supabase migration. Nothing was deleted.";
    }
  }
  if (isDependencyViolation(result)) {
    return `Can't delete this ${label}: ${dependency}. ${remedy}`;
  }
  if (result.networkError) {
    return `Failed to delete ${label}. Check your connection and try again.`;
  }
  const detail = result.message ? ` ${result.message}` : "";
  return `Failed to delete ${label}.${detail}`;
}

// Local state must only change in onSuccess, after the server confirms the delete.
export async function performDeletion({
  kind,
  record,
  related,
  clearFeedback,
  confirm,
  remove,
  onSuccess,
  onError,
  onBlocked,
}) {
  clearFeedback?.();
  if (!record?.id) return { ok: false, skipped: true };

  const blocker = findDeletionBlocker(kind, record, related);
  if (blocker) {
    if (onBlocked) onBlocked(blocker);
    else onError?.(blocker);
    return { ok: false, blocked: true };
  }

  const detail = getDeletionConfirmationDetail(kind, record);
  if (!await confirm(getDeletionConfig(kind).label, detail)) return { ok: false, cancelled: true };

  const result = await remove(kind, record.id);
  if (!result?.ok) {
    if (result?.skipped) return { ok: false, skipped: true };
    const message = describeDeletionFailure(kind, result || {});
    if (isDependencyViolation(result) && onBlocked) {
      onBlocked(message);
    } else {
      onError?.(message);
    }
    return { ok: false, result };
  }

  onSuccess?.();
  return { ok: true };
}
