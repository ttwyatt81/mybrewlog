const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    console.error(`Failed to fetch ${table}:`, res.status, res.data);
    return [];
  }
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
  const user = await sbGetUser(token);
  if (!user?.id) {
    console.error(`sbInsert failed: unable to resolve authenticated user for ${table}`);
    return null;
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetchJson(url, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, user_id: user.id })
  });
  if (!res.ok) {
    console.error(`Failed to insert into ${table}:`, res.status, res.data);
    return null;
  }
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

export async function sbUpsert(table, token, payload, conflictKeys = ["id"]) {
  ensureSupabaseConfig();
  const user = await sbGetUser(token);
  if (!user?.id) {
    console.error(`sbUpsert failed: unable to resolve authenticated user for ${table}`);
    return null;
  }
  const query = `?on_conflict=${encodeURIComponent(conflictKeys.join(","))}`;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetchJson(url, {
    method: "POST",
    headers: { ...authHeaders(token), Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ ...payload, user_id: user.id })
  });
  if (!res.ok) {
    console.error(`Failed to upsert into ${table}:`, res.status, res.data);
    return null;
  }
  return Array.isArray(res.data) ? res.data[0] : res.data;
}

export async function sbUpdate(table, token, rowId, payload) {
  if (!rowId) return null;
  ensureSupabaseConfig();
  const user = await sbGetUser(token);
  if (!user?.id) {
    console.error(`sbUpdate failed: unable to resolve authenticated user for ${table}`);
    return null;
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(rowId)}`;
  const res = await fetchJson(url, {
    method: "PATCH",
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify({ ...payload, user_id: user.id })
  });
  if (!res.ok) {
    console.error(`Failed to update ${table} row ${rowId}:`, res.status, res.data);
    return null;
  }
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
    console.error(`Failed to delete ${table} row ${rowId}:`, res.status, res.data);
    return false;
  }
  return true;
}

export async function sbDeleteAll(table, token) {
  const rows = await sbGet(table, token, "select=id");
  await Promise.all(rows.map(row => sbDelete(table, token, row.id)));
}

