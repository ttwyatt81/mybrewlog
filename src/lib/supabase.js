
export async function sbSendOtp(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, create_user: true })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) console.error("OTP error:", body);
  return { ok: res.ok, error: body.message || body.msg || null };
}

export async function sbVerifyOtp(email, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "email", email, token })
  });
  const data = await res.json().catch(() => ({}));
  return data.access_token ? data : null;
}

export async function sbSignOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
  });
}

export async function sbGet(table, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=updated_at.desc&limit=1`, {
    headers: authHeaders(token)
  });
  return res.ok ? res.json() : [];
}

export async function sbUpsert(table, token, rowId, data) {
  // Use cached row ID if we have one
  if (rowIdCache[table]) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${rowIdCache[table]}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ data: JSON.stringify(data), updated_at: new Date().toISOString() })
    });
    if (res.ok) return;
    // If patch failed, fall through to insert
    delete rowIdCache[table];
  }

  // Check if a row already exists for this user
  const existing = await sbGet(table, token);
  if (existing && existing.length > 0) {
    rowIdCache[table] = existing[0].id;
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ data: JSON.stringify(data), updated_at: new Date().toISOString() })
    });
  } else {
    // Get user_id from token for new insert
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) { console.error("No user ID found"); return; }
    const newId = rowId || crypto.randomUUID();
    rowIdCache[table] = newId;
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...authHeaders(token), Prefer: "return=minimal" },
      body: JSON.stringify({ id: newId, user_id: userId, data: JSON.stringify(data) })
    });
  }
}

