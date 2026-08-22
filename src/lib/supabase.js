const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AUTH_DEBUG = import.meta.env.DEV;
let lastSupabaseErrorMessage = "";

const refreshInFlightByToken = new Map();

function maskToken(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (text.length <= 8) return `${text.slice(0, 2)}...${text.slice(-2)}`;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function logRefreshDebug(event, details = {}) {
  if (!AUTH_DEBUG) return;
  console.debug("[supabase refresh]", event, details);
}

function classifyRefreshError(status, body) {
  const error = String(body?.error || "").toLowerCase();
  const description = String(body?.error_description || body?.message || body?.msg || "").toLowerCase();
  const combined = `${error} ${description}`.trim();
  const mentionsRefreshToken = combined.includes("refresh token");
  const explicitlyInvalid = combined.includes("invalid") || combined.includes("expired") || combined.includes("revoked") || combined.includes("not found");

  if ((status === 400 || status === 401) && mentionsRefreshToken && explicitlyInvalid) {
    return "invalid_refresh_token";
  }

  return "request_failed";
}

function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");
  }
}

function authHeaders(token) {
  ensureSupabaseConfig();
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const body = await res.text().catch(() => "");
  let data;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    data = body;
  }
  return { ok: res.ok, status: res.status, data };
}

function extractSupabaseErrorMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data.trim();

  const fields = [
    data.message,
    data.msg,
    data.error_description,
    data.details,
    data.hint,
    data.error,
  ];

  const text = fields.find((value) => typeof value === "string" && value.trim());
  if (!text) return "";

  const code = typeof data.code === "string" && data.code.trim() ? data.code.trim() : "";
  return code ? `${text.trim()} (code: ${code})` : text.trim();
}

function setLastSupabaseError(status, data) {
  const detail = extractSupabaseErrorMessage(data);
  lastSupabaseErrorMessage = detail ? `${detail} [HTTP ${status}]` : `HTTP ${status}`;
}

function clearLastSupabaseError() {
  lastSupabaseErrorMessage = "";
}

export function getLastSupabaseErrorMessage() {
  return lastSupabaseErrorMessage;
}

export async function sbSendOtp(email) {
  if (!email?.trim()) return { ok: false, error: "Email is required." };
  ensureSupabaseConfig();

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), create_user: true })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) console.error("OTP error:", body);
    return { ok: res.ok, error: body.message || body.msg || null };
  } catch (error) {
    console.error("OTP request failed:", error);
    return { ok: false, error: error?.message || "Unable to send OTP." };
  }
}

export async function sbVerifyOtp(email, token) {
  if (!email?.trim() || !token?.trim()) return null;
  ensureSupabaseConfig();

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", email: email.trim(), token: token.trim() })
    });
    const data = await res.json().catch(() => ({}));
    return data.access_token ? data : null;
  } catch (error) {
    console.error("OTP verify request failed:", error);
    return null;
  }
}

export async function sbRefreshSession(refreshToken) {
  if (!refreshToken?.trim()) return { session: null, errorType: "missing_refresh_token" };
  ensureSupabaseConfig();

  const normalizedRefreshToken = refreshToken.trim();

  if (refreshInFlightByToken.has(normalizedRefreshToken)) {
    logRefreshDebug("reuse_in_flight", { refreshToken: maskToken(refreshToken), shared: true });
    return refreshInFlightByToken.get(normalizedRefreshToken);
  }

  const refreshPromise = (async () => {
    const refreshTokenId = maskToken(refreshToken);
    logRefreshDebug("request_start", {
      refreshToken: refreshTokenId,
      shared: false,
      endpoint: `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`
    });

    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: normalizedRefreshToken
        })
      });

      const data = await res.json().catch(() => ({}));
      const error = data?.error || null;
      const errorDescription = data?.error_description || data?.message || data?.msg || null;

      if (data?.access_token) {
        logRefreshDebug("request_success", {
          refreshToken: refreshTokenId,
          status: res.status,
          ok: res.ok,
          body: data,
          error,
          error_description: errorDescription,
          errorType: null,
          shared: false
        });
        return { session: data, errorType: null };
      }

      const errorType = res.ok ? "request_failed" : classifyRefreshError(res.status, data);
      logRefreshDebug("request_failure", {
        refreshToken: refreshTokenId,
        status: res.status,
        ok: res.ok,
        body: data,
        error,
        error_description: errorDescription,
        errorType,
        shared: false
      });
      return { session: null, errorType };
    } catch (error) {
      console.error("Refresh session request failed:", error);
      logRefreshDebug("request_network_error", {
        refreshToken: refreshTokenId,
        status: null,
        ok: false,
        body: null,
        error: error?.message || String(error),
        error_description: null,
        errorType: "network",
        shared: false
      });
      return { session: null, errorType: "network" };
    } finally {
      refreshInFlightByToken.delete(normalizedRefreshToken);
    }
  })();

  refreshInFlightByToken.set(normalizedRefreshToken, refreshPromise);

  return refreshPromise;
}

export async function sbSignOut(token) {
  if (!token) return;
  ensureSupabaseConfig();

  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}

export async function sbGet(table, token, query = "select=*") {
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetchJson(url, { headers: authHeaders(token) });
  if (!res.ok) {
    setLastSupabaseError(res.status, res.data);
    console.error(`Failed to fetch ${table}:`, res.status, res.data);
    return [];
  }
  clearLastSupabaseError();
  return Array.isArray(res.data) ? res.data : [];
}

export async function sbGetUser(token) {
  if (!token) return null;
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/auth/v1/user`;
  const res = await fetchJson(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
  });
  return res.ok ? res.data : null;
}

export async function sbInsert(table, token, payload) {
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetchJson(url, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    // Let the database set `user_id` via DEFAULT auth.uid() instead of
    // the frontend injecting it. This avoids mismatched ownership.
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    setLastSupabaseError(res.status, res.data);
    console.error(`Failed to insert into ${table}:`, res.status, res.data);
    return null;
  }
  clearLastSupabaseError();
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

export async function sbUpsert(table, token, payload, conflictKeys = ["id"]) {
  ensureSupabaseConfig();
  const query = `?on_conflict=${encodeURIComponent(conflictKeys.join(","))}`;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetchJson(url, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation,resolution=merge-duplicates" },
    // Do not include user_id; DB default auth.uid() will set ownership.
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    setLastSupabaseError(res.status, res.data);
    console.error(`Failed to upsert into ${table}:`, res.status, res.data);
    return null;
  }
  clearLastSupabaseError();
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

export async function sbUpdate(table, token, rowId, payload) {
  if (!rowId) return null;
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(rowId)}`;
  const res = await fetchJson(url, {
    method: "PATCH",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    // Avoid changing/setting user_id from the client. Let RLS/auth manage ownership.
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    setLastSupabaseError(res.status, res.data);
    console.error(`Failed to update ${table} row ${rowId}:`, res.status, res.data);
    return null;
  }
  clearLastSupabaseError();
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

export async function sbDelete(table, token, rowId) {
  if (!rowId) return false;
  ensureSupabaseConfig();
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(rowId)}`;
  const res = await fetchJson(url, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!res.ok) {
    setLastSupabaseError(res.status, res.data);
    console.error(`Failed to delete ${table} row ${rowId}:`, res.status, res.data);
    return false;
  }
  clearLastSupabaseError();
  return true;
}

export async function sbDeleteAll(table, token) {
  const rows = await sbGet(table, token, "select=id");
  await Promise.all(rows.map(row => sbDelete(table, token, row.id)));
}

