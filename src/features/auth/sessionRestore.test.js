import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionGeneration, restoreStoredSessionState } from "./expiredAccessTokenHandler.js";
import {
  MAX_DIAGNOSTIC_ENTRIES,
  SESSION_KEY,
  inspectStoredSession,
  readRestoreDiagnostics,
  recordRestoreEvent,
  runRestoreAttempts,
} from "./sessionRestore.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

const stored = { access_token: "secret-access-token", refresh_token: "secret-refresh-token", email: "me@example.test" };

test("temporary refresh failures retry with backoff and recover", async () => {
  const storage = memoryStorage();
  const results = [
    { session: null, errorType: "network" },
    { session: null, errorType: "request_failed", status: 503 },
    { session: { access_token: "new", refresh_token: "new-r" } },
  ];
  const sleeps = [];
  const outcome = await runRestoreAttempts({
    refresh: async () => results.shift(),
    isCurrent: () => true,
    record: (entry) => recordRestoreEvent(entry, storage),
    sleep: async (ms) => { sleeps.push(ms); },
    delays: [10, 20, 30],
  });

  assert.equal(outcome.status, "restored");
  assert.deepEqual(sleeps, [10, 20]);
  assert.deepEqual(
    readRestoreDiagnostics(storage).map((e) => [e.category, e.status, e.retries]),
    [["network", null, 0], ["server_error", 503, 1], ["restored", null, 2]]
  );
});

test("exhausted temporary failures keep the saved session and show retry state", async () => {
  const generation = createSessionGeneration();
  const startedInGeneration = generation.current();
  const outcome = await runRestoreAttempts({
    refresh: async () => ({ session: null, errorType: "timeout" }),
    isCurrent: () => true,
    sleep: async () => {},
    delays: [1, 1],
  });
  let authState = "restoring";
  let cleared = false;
  restoreStoredSessionState({
    generation, startedInGeneration, storedSession: stored, refreshed: outcome.result,
    getSession: () => stored, setAuthState: (s) => { authState = s; }, loadData: () => {},
    clearSession: () => { cleared = true; }, setAuthCode: () => {},
  });

  assert.equal(outcome.status, "failed");
  assert.equal(authState, "restore_failed");
  assert.equal(cleared, false);
});

test("confirmed invalid refresh token logs out without retrying and records no secrets", async () => {
  const storage = memoryStorage();
  const generation = createSessionGeneration();
  const startedInGeneration = generation.current();
  let calls = 0;
  const outcome = await runRestoreAttempts({
    refresh: async () => { calls += 1; return { session: null, errorType: "invalid_refresh_token", status: 400 }; },
    isCurrent: () => true,
    record: (entry) => recordRestoreEvent({ ...entry, token: stored.refresh_token, email: stored.email }, storage),
    sleep: async () => assert.fail("must not back off on invalid token"),
  });
  let cleared = false;
  restoreStoredSessionState({
    generation, startedInGeneration, storedSession: stored, refreshed: outcome.result,
    getSession: () => stored, setAuthState: () => {}, loadData: () => {},
    clearSession: () => { cleared = true; }, setAuthCode: () => {},
  });

  assert.equal(calls, 1);
  assert.equal(outcome.status, "invalid");
  assert.equal(cleared, true);
  const raw = JSON.stringify(readRestoreDiagnostics(storage));
  assert.ok(!raw.includes("secret") && !raw.includes("example.test"));
  assert.equal(readRestoreDiagnostics(storage)[0].category, "invalid_refresh_token");
});

test("logout or account switch during pending restoration cancels the retry", async () => {
  for (const interrupt of ["logout", "account-switch"]) {
    const generation = createSessionGeneration();
    const startedInGeneration = generation.current();
    let loaded = 0;
    const outcome = await runRestoreAttempts({
      refresh: async () => {
        generation.advance();
        return { session: { access_token: "late", refresh_token: "late-r" } };
      },
      isCurrent: () => generation.isCurrent(startedInGeneration),
      sleep: async () => assert.fail(`${interrupt} must stop retries`),
    });
    assert.equal(outcome.status, "stale");
    assert.equal(loaded, 0);
  }
});

test("cancellation while waiting to retry does not restore", async () => {
  let current = true;
  let calls = 0;
  const outcome = await runRestoreAttempts({
    refresh: async () => { calls += 1; return { session: null, errorType: "network" }; },
    isCurrent: () => current,
    sleep: async () => { current = false; },
    delays: [1, 1],
  });
  assert.equal(outcome.status, "stale");
  assert.equal(calls, 1);
});

test("stored session inspection and bounded diagnostics", () => {
  assert.equal(inspectStoredSession(memoryStorage()).kind, "missing");
  assert.equal(inspectStoredSession(memoryStorage({ [SESSION_KEY]: "{oops" })).kind, "malformed");
  assert.equal(inspectStoredSession(memoryStorage({ [SESSION_KEY]: "{}" })).kind, "malformed");
  assert.equal(inspectStoredSession(memoryStorage({ [SESSION_KEY]: JSON.stringify(stored) })).kind, "ok");

  const storage = memoryStorage();
  for (let i = 0; i < MAX_DIAGNOSTIC_ENTRIES + 5; i += 1) {
    recordRestoreEvent({ phase: "startup", category: "network", retries: i }, storage);
  }
  assert.equal(readRestoreDiagnostics(storage).length, MAX_DIAGNOSTIC_ENTRIES);
});
