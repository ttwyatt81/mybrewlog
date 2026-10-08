export const SESSION_KEY = "sb_session";
export const DIAGNOSTICS_KEY = "sb_restore_diagnostics";
export const MAX_DIAGNOSTIC_ENTRIES = 20;
export const RESTORE_RETRY_DELAYS_MS = [1000, 3000, 8000];

const PHASES = new Set(["startup", "resume", "online", "manual"]);
const CATEGORIES = new Set([
  "restored",
  "missing_session",
  "malformed_session",
  "network",
  "timeout",
  "server_error",
  "invalid_refresh_token",
  "stale",
]);

export function inspectStoredSession(storage = globalThis.localStorage) {
  let raw;
  try {
    raw = storage.getItem(SESSION_KEY);
  } catch {
    return { kind: "missing", session: null };
  }
  if (!raw) return { kind: "missing", session: null };

  try {
    const session = JSON.parse(raw);
    const hasAccess = typeof session?.access_token === "string" && session.access_token;
    const hasRefresh = typeof session?.refresh_token === "string" && session.refresh_token;
    if (!hasAccess && !hasRefresh) return { kind: "malformed", session: null };
    return { kind: "ok", session };
  } catch {
    return { kind: "malformed", session: null };
  }
}

export function restoreFailureCategory(errorType) {
  if (errorType === "invalid_refresh_token") return "invalid_refresh_token";
  if (errorType === "stale_session") return "stale";
  if (errorType === "timeout") return "timeout";
  if (errorType === "network") return "network";
  return "server_error";
}

function sanitizeEntry(entry) {
  const status = Number.isInteger(entry?.status) ? entry.status : null;
  const retries = Number.isInteger(entry?.retries) ? Math.max(0, Math.min(entry.retries, 99)) : 0;
  return {
    ts: Number.isFinite(entry?.ts) ? entry.ts : Date.now(),
    phase: PHASES.has(entry?.phase) ? entry.phase : "startup",
    category: CATEGORIES.has(entry?.category) ? entry.category : "server_error",
    status,
    retries,
    hadTokens: Boolean(entry?.hadTokens),
  };
}

export function readRestoreDiagnostics(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(DIAGNOSTICS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(-MAX_DIAGNOSTIC_ENTRIES).map(sanitizeEntry) : [];
  } catch {
    return [];
  }
}

export function recordRestoreEvent(entry, storage = globalThis.localStorage) {
  const next = [...readRestoreDiagnostics(storage), sanitizeEntry({ ts: Date.now(), ...entry })]
    .slice(-MAX_DIAGNOSTIC_ENTRIES);
  try {
    storage.setItem(DIAGNOSTICS_KEY, JSON.stringify(next));
  } catch {
    // Diagnostics are best-effort.
  }
  return next;
}

export function clearRestoreDiagnostics(storage = globalThis.localStorage) {
  try {
    storage.removeItem(DIAGNOSTICS_KEY);
  } catch {
    // Diagnostics are best-effort.
  }
  return [];
}

export function formatRestoreDiagnostics(entries) {
  const lines = entries.map((e) => [
    new Date(e.ts).toISOString(),
    e.phase,
    e.category,
    `http=${e.status ?? "-"}`,
    `retries=${e.retries}`,
    `saved_tokens=${e.hadTokens ? "yes" : "no"}`,
  ].join(" "));
  return ["MyBrewLog session restore log (no tokens or emails)", ...lines].join("\n");
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only temporary failures; returns the final refresh result with a status.
export async function runRestoreAttempts({
  refresh,
  isCurrent,
  phase = "startup",
  record = () => {},
  sleep = defaultSleep,
  delays = RESTORE_RETRY_DELAYS_MS,
  onRetry = () => {},
}) {
  for (let attempt = 0; ; attempt += 1) {
    const result = await refresh();
    const base = { phase, retries: attempt, hadTokens: true };

    if (!isCurrent()) {
      record({ ...base, category: "stale" });
      return { status: "stale", result };
    }
    if (result?.session) {
      record({ ...base, category: "restored" });
      return { status: "restored", result };
    }

    const category = restoreFailureCategory(result?.errorType);
    record({ ...base, category, status: result?.status ?? null });
    if (category === "invalid_refresh_token") return { status: "invalid", result };
    if (category === "stale") return { status: "stale", result };
    if (attempt >= delays.length) return { status: "failed", result };

    onRetry(attempt + 1);
    await sleep(delays[attempt]);
    if (!isCurrent()) {
      record({ ...base, retries: attempt + 1, category: "stale" });
      return { status: "stale", result };
    }
  }
}
