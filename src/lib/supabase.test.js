import assert from "node:assert/strict";
import { env } from "node:process";
import { test } from "node:test";

env.VITE_SUPABASE_URL = "https://example.supabase.co";
env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
env.DEV = "";

const {
  registerUnauthorizedRefreshHandler,
  sbGet,
  sbUpsert,
  sbRefreshSession,
} = await import("./supabase.js");
const {
  createExpiredAccessTokenHandler,
  createSessionGeneration,
  restoreStoredSessionState,
} = await import("../features/auth/expiredAccessTokenHandler.js");

const expiredJwt = { code: "PGRST301", message: "JWT expired" };
const refreshToken = "test-refresh-token";

function response(status, body) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function withFetch(t, mockFetch) {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  globalThis.fetch = mockFetch;
  console.error = () => {};
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  });
}

function register(handler, t) {
  const unregister = registerUnauthorizedRefreshHandler({
    getGeneration: handler.getGeneration,
    getAccessToken: handler.getAccessToken,
    refresh: handler.refresh,
  });
  t.after(unregister);
}

test("refreshes and retries once while preserving the REST request", async (t) => {
  const calls = [];
  await withFetch(t, async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/rest/v1/")) {
      return calls.filter((call) => call.url.includes("/rest/v1/")).length === 1
        ? response(401, expiredJwt)
        : response(201, [{ id: "created" }]);
    }
    return response(200, {
      access_token: "replacement-access-token",
      refresh_token: "replacement-refresh-token",
      expires_in: 3600,
    });
  });
  let currentSession = { access_token: "expired-access-token", refresh_token: refreshToken };
  const generation = createSessionGeneration();
  const refreshSession = (current) => generation.refresh(
    current,
    sbRefreshSession,
    () => currentSession,
    (saved) => { currentSession = saved; }
  );
  const refresh = createExpiredAccessTokenHandler({
    generation,
    getSession: () => currentSession,
    refreshSession,
    clearSession: () => { currentSession = null; generation.advance(); },
  });
  register({ getGeneration: () => generation.current(), getAccessToken: () => currentSession?.access_token, refresh }, t);

  const payload = { label: "keep request body" };
  const result = await sbUpsert("beans", "expired-access-token", payload, ["id", "name"]);

  assert.deepEqual(result, { id: "created" });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, "https://example.supabase.co/rest/v1/beans?on_conflict=id%2Cname");
  assert.equal(calls[1].url, "https://example.supabase.co/auth/v1/token?grant_type=refresh_token");
  assert.equal(calls[2].url, calls[0].url);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[2].options.method, "POST");
  assert.equal(calls[0].options.body, JSON.stringify(payload));
  assert.equal(calls[2].options.body, calls[0].options.body);
  assert.equal(calls[0].options.headers.Prefer, "return=representation,resolution=merge-duplicates");
  assert.equal(calls[2].options.headers.get("Prefer"), "return=representation,resolution=merge-duplicates");
  assert.equal(calls[0].options.headers.Authorization, "Bearer expired-access-token");
  assert.equal(calls[2].options.headers.get("Authorization"), "Bearer replacement-access-token");
});

test("forces refresh for an expired JWT even when local expiry is in the future", async (t) => {
  await withFetch(t, async (url) => {
    assert.equal(String(url), "https://example.supabase.co/auth/v1/token?grant_type=refresh_token");
    return response(200, { access_token: "new-token", refresh_token: "new-refresh", expires_in: 3600 });
  });

  let savedSession = { access_token: "expired-token", refresh_token: refreshToken, expires_at: Date.now() + 86400000 };
  const generation = createSessionGeneration();
  let refreshCalls = 0;
  const handleExpiredToken = createExpiredAccessTokenHandler({
    generation,
    getSession: () => savedSession,
    refreshSession: (currentSession) => generation.refresh(
      currentSession,
      async (currentRefreshToken) => {
        refreshCalls += 1;
        return sbRefreshSession(currentRefreshToken);
      },
      () => savedSession,
      (nextSession) => { savedSession = nextSession; }
    ),
    clearSession: () => { savedSession = null; generation.advance(); },
  });

  assert.equal(await handleExpiredToken("expired-token", generation.current()), "new-token");
  assert.equal(refreshCalls, 1);
  assert.equal(savedSession.access_token, "new-token");
});

test("never retries the REST request more than once", async (t) => {
  let restCalls = 0;
  let refreshCalls = 0;
  await withFetch(t, async (url) => {
    if (String(url).includes("/rest/v1/")) {
      restCalls += 1;
      return response(401, expiredJwt);
    }
    return response(200, { access_token: "replacement-token", refresh_token: "next-refresh", expires_in: 3600 });
  });
  let currentSession = { access_token: "expired-token", refresh_token: refreshToken };
  const generation = createSessionGeneration();
  register({
    getGeneration: () => generation.current(),
    getAccessToken: () => currentSession?.access_token,
    refresh: async (token, requestGeneration) => {
      refreshCalls += 1;
      const handler = createExpiredAccessTokenHandler({
        generation,
        getSession: () => currentSession,
        refreshSession: async (current) => {
          const result = await sbRefreshSession(current.refresh_token);
          if (result.session) currentSession = { ...current, ...result.session };
          return result;
        },
        clearSession: () => { currentSession = null; generation.advance(); },
      });
      return handler(token, requestGeneration);
    },
  }, t);

  assert.deepEqual(await sbGet("beans", "expired-token"), []);
  assert.equal(restCalls, 2);
  assert.equal(refreshCalls, 1);
});

test("does not refresh or retry on network failures or 403 responses", async (t) => {
  let refreshCalls = 0;
  register({
    getGeneration: () => 0,
    getAccessToken: () => "expired-token",
    refresh: async () => {
      refreshCalls += 1;
      return "replacement-token";
    },
  }, t);

  await withFetch(t, async () => { throw new TypeError("network unavailable"); });
  await assert.rejects(sbGet("beans", "expired-token"), /network unavailable/);
  assert.equal(refreshCalls, 0);

  let requestCalls = 0;
  await withFetch(t, async () => {
    requestCalls += 1;
    return response(403, { message: "permission denied" });
  });
  assert.deepEqual(await sbGet("beans", "expired-token"), []);
  assert.equal(requestCalls, 1);
  assert.equal(refreshCalls, 0);
});

test("clears session only for confirmed invalid refresh tokens", async () => {
  let currentSession = { access_token: "expired-token", refresh_token: refreshToken };
  let clearCalls = 0;
  let refreshErrorType = "invalid_refresh_token";
  const generation = createSessionGeneration();
  const handler = createExpiredAccessTokenHandler({
    generation,
    getSession: () => currentSession,
    refreshSession: async () => ({ session: null, errorType: refreshErrorType }),
    clearSession: () => {
      clearCalls += 1;
      currentSession = null;
      generation.advance();
    },
  });

  assert.equal(await handler("expired-token", generation.current()), null);
  assert.equal(clearCalls, 1);
  assert.equal(currentSession, null);

  currentSession = { access_token: "expired-token", refresh_token: refreshToken };
  refreshErrorType = "network";
  assert.equal(await handler("expired-token", generation.current()), null);
  assert.equal(clearCalls, 1);
  assert.equal(currentSession.access_token, "expired-token");
});

test("logout during refresh cannot restore the session", async () => {
  const generation = createSessionGeneration();
  const refreshResponse = deferred();
  let currentSession = { access_token: "old-token", refresh_token: refreshToken };
  const savedSessions = [];
  const pendingRefresh = generation.refresh(
    currentSession,
    () => refreshResponse.promise,
    () => currentSession,
    (nextSession) => {
      savedSessions.push(nextSession);
      currentSession = nextSession;
    }
  );

  generation.advance();
  currentSession = null;
  refreshResponse.resolve({ session: { access_token: "late-token", refresh_token: "late-refresh" } });

  assert.deepEqual(await pendingRefresh, { session: null, errorType: "stale_session" });
  assert.equal(currentSession, null);
  assert.equal(savedSessions.length, 0);
});

test("account switching during refresh cannot overwrite the new session", async () => {
  const generation = createSessionGeneration();
  const refreshResponse = deferred();
  const oldSession = { access_token: "old-token", refresh_token: "old-refresh" };
  let currentSession = oldSession;
  let savedSession = null;
  const pendingRefresh = generation.refresh(
    oldSession,
    () => refreshResponse.promise,
    () => currentSession,
    (nextSession) => {
      savedSession = nextSession;
      currentSession = nextSession;
    }
  );

  generation.advance();
  currentSession = { access_token: "account-b-token", refresh_token: "account-b-refresh" };
  refreshResponse.resolve({ session: { access_token: "late-account-a-token", refresh_token: "late-account-a-refresh" } });

  assert.deepEqual(await pendingRefresh, { session: null, errorType: "stale_session" });
  assert.equal(currentSession.access_token, "account-b-token");
  assert.equal(savedSession, null);
});

test("concurrent same-session refresh handlers share the rotated session and persist once", async (t) => {
  const refreshResponse = deferred();
  let refreshRequestCount = 0;
  let signalRefreshStarted;
  const refreshStarted = new Promise((resolve) => { signalRefreshStarted = resolve; });
  await withFetch(t, async (url) => {
    assert.equal(String(url), "https://example.supabase.co/auth/v1/token?grant_type=refresh_token");
    refreshRequestCount += 1;
    signalRefreshStarted();
    return refreshResponse.promise;
  });

  const generation = createSessionGeneration();
  let currentSession = { access_token: "expired-token", refresh_token: refreshToken };
  let persistenceCount = 0;
  const refreshSession = (session) => generation.refresh(
    session,
    sbRefreshSession,
    () => currentSession,
    (nextSession) => {
      persistenceCount += 1;
      currentSession = nextSession;
    }
  );
  const createHandler = () => createExpiredAccessTokenHandler({
    generation,
    getSession: () => currentSession,
    refreshSession,
    clearSession: () => { currentSession = null; generation.advance(); },
  });
  const requestGeneration = generation.current();
  const firstRefresh = createHandler()("expired-token", requestGeneration);
  const secondRefresh = createHandler()("expired-token", requestGeneration);
  await refreshStarted;
  refreshResponse.resolve(response(200, {
    access_token: "replacement-access-token",
    refresh_token: "replacement-refresh-token",
    expires_in: 3600,
  }));

  assert.deepEqual(await Promise.all([firstRefresh, secondRefresh]), [
    "replacement-access-token",
    "replacement-access-token",
  ]);
  assert.equal(refreshRequestCount, 1);
  assert.equal(persistenceCount, 1);
});

test("an old REST request cannot retry with another account's token", async (t) => {
  const firstResponse = deferred();
  let requestCount = 0;
  await withFetch(t, async (url) => {
    assert.match(String(url), /\/rest\/v1\/beans/);
    requestCount += 1;
    return requestCount === 1 ? firstResponse.promise : response(200, []);
  });

  const generation = createSessionGeneration();
  let currentSession = { access_token: "account-a-token", refresh_token: "account-a-refresh" };
  const refresh = createExpiredAccessTokenHandler({
    generation,
    getSession: () => currentSession,
    refreshSession: async () => ({ session: { access_token: "unexpected-token" } }),
    clearSession: () => { currentSession = null; generation.advance(); },
  });
  register({
    getGeneration: () => generation.current(),
    getAccessToken: () => currentSession?.access_token,
    refresh,
  }, t);

  const pendingRequest = sbGet("beans", "account-a-token");
  generation.advance();
  currentSession = { access_token: "account-b-token", refresh_token: "account-b-refresh" };
  firstResponse.resolve(response(401, expiredJwt));

  assert.deepEqual(await pendingRequest, []);
  assert.equal(requestCount, 1);
  assert.equal(currentSession.access_token, "account-b-token");
});

test("ordinary access-token rotation in the same generation permits retry", async (t) => {
  const firstResponse = deferred();
  let requestCount = 0;
  await withFetch(t, async () => {
    requestCount += 1;
    return requestCount === 1 ? firstResponse.promise : response(200, [{ id: "ok" }]);
  });

  const generation = createSessionGeneration();
  let currentSession = { access_token: "old-token", refresh_token: "same-session-refresh" };
  const refresh = createExpiredAccessTokenHandler({
    generation,
    getSession: () => currentSession,
    refreshSession: async () => ({ session: null, errorType: "stale_session" }),
    clearSession: () => { currentSession = null; generation.advance(); },
  });
  register({
    getGeneration: () => generation.current(),
    getAccessToken: () => currentSession?.access_token,
    refresh,
  }, t);

  const pendingRequest = sbGet("beans", "old-token");
  currentSession = { access_token: "rotated-token", refresh_token: "rotated-refresh" };
  firstResponse.resolve(response(401, expiredJwt));

  assert.deepEqual(await pendingRequest, [{ id: "ok" }]);
  assert.equal(requestCount, 2);
});

test("stale invalid-refresh failure cannot clear a newer session", async () => {
  const generation = createSessionGeneration();
  const refreshResponse = deferred();
  let currentSession = { access_token: "account-a-token", refresh_token: "account-a-refresh" };
  let clearCalls = 0;
  const handler = createExpiredAccessTokenHandler({
    generation,
    getSession: () => currentSession,
    refreshSession: () => refreshResponse.promise,
    clearSession: () => {
      clearCalls += 1;
      currentSession = null;
      generation.advance();
    },
  });

  const requestGeneration = generation.current();
  const pending = handler("account-a-token", requestGeneration);
  generation.advance();
  currentSession = { access_token: "account-b-token", refresh_token: "account-b-refresh" };
  refreshResponse.resolve({ session: null, errorType: "invalid_refresh_token" });

  assert.equal(await pending, null);
  assert.equal(clearCalls, 0);
  assert.equal(currentSession.access_token, "account-b-token");
});

test("stored-session restoration enters the app after refresh rotates both tokens", async () => {
  const generation = createSessionGeneration();
  const storedSession = { access_token: "expired-token", refresh_token: "old-refresh-token" };
  let currentSession = storedSession;
  let authState = "login";
  const loadedTokens = [];
  const refreshed = await generation.refresh(
    storedSession,
    async () => ({
      session: {
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        expires_in: 3600,
      },
    }),
    () => currentSession,
    (nextSession) => { currentSession = nextSession; }
  );

  const applied = restoreStoredSessionState({
    generation,
    startedInGeneration: generation.current(),
    storedSession,
    refreshed,
    getSession: () => currentSession,
    setAuthState: (nextState) => { authState = nextState; },
    loadData: (token) => { loadedTokens.push(token); },
    clearSession: () => { currentSession = null; },
    setAuthCode: () => {},
  });

  assert.equal(applied, true);
  assert.equal(authState, "app");
  assert.deepEqual(loadedTokens, ["new-access-token"]);
  assert.equal(currentSession.refresh_token, "new-refresh-token");
});

test("stored-session restoration ignores results after logout or account switching", () => {
  for (const nextSession of [
    null,
    { access_token: "account-b-token", refresh_token: "account-b-refresh" },
  ]) {
    const generation = createSessionGeneration();
    const storedSession = { access_token: "account-a-old-token", refresh_token: "account-a-old-refresh" };
    const startedInGeneration = generation.current();
    generation.advance();
    let authState = "login";
    let loadCalls = 0;
    let clearCalls = 0;

    const applied = restoreStoredSessionState({
      generation,
      startedInGeneration,
      storedSession,
      refreshed: { session: { access_token: "late-access-token", refresh_token: "late-refresh-token" } },
      getSession: () => nextSession,
      setAuthState: (nextState) => { authState = nextState; },
      loadData: () => { loadCalls += 1; },
      clearSession: () => { clearCalls += 1; },
      setAuthCode: () => {},
    });

    assert.equal(applied, false);
    assert.equal(authState, "login");
    assert.equal(loadCalls, 0);
    assert.equal(clearCalls, 0);
  }
});

test("stale invalid stored-session refresh does not clear or change a newer account", () => {
  const generation = createSessionGeneration();
  const storedSession = { access_token: "account-a-token", refresh_token: "account-a-refresh" };
  const startedInGeneration = generation.current();
  generation.advance();
  const currentSession = { access_token: "account-b-token", refresh_token: "account-b-refresh" };
  let authState = "app";
  let clearCalls = 0;

  const applied = restoreStoredSessionState({
    generation,
    startedInGeneration,
    storedSession,
    refreshed: { session: null, errorType: "invalid_refresh_token" },
    getSession: () => currentSession,
    setAuthState: (nextState) => { authState = nextState; },
    loadData: () => {},
    clearSession: () => { clearCalls += 1; },
    setAuthCode: () => {},
  });

  assert.equal(applied, false);
  assert.equal(authState, "app");
  assert.equal(clearCalls, 0);
});