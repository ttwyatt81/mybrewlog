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

test("rejected 400 requests are not retried, keep the session and record only the allowlisted code", async () => {
  const storage = memoryStorage();
  const generation = createSessionGeneration();
  const startedInGeneration = generation.current();
  let calls = 0;
  const outcome = await runRestoreAttempts({
    refresh: async () => {
      calls += 1;
      return { session: null, errorType: "request_rejected", status: 400, errorCode: "bad_json" };
    },
    isCurrent: () => true,
    record: (entry) => recordRestoreEvent({ ...entry, errorCode: entry.errorCode, body: "secret-body" }, storage),
    sleep: async () => assert.fail("must not retry a rejected request"),
  });
  let authState = "restoring";
  let cleared = false;
  restoreStoredSessionState({
    generation, startedInGeneration, storedSession: stored, refreshed: outcome.result,
    getSession: () => stored, setAuthState: (s) => { authState = s; }, loadData: () => {},
    clearSession: () => { cleared = true; }, setAuthCode: () => {},
  });

  assert.equal(calls, 1);
  assert.equal(outcome.status, "failed");
  assert.equal(authState, "restore_failed");
  assert.equal(cleared, false);
  const [entry] = readRestoreDiagnostics(storage);
  assert.deepEqual([entry.category, entry.status, entry.errorCode], ["request_rejected", 400, "bad_json"]);
  assert.ok(!JSON.stringify(entry).includes("secret"));
  assert.ok(recordRestoreEvent({ category: "server_error", errorCode: "me@example.test" }, storage).every((e) => e.errorCode !== "me@example.test"));
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

test("refresh success is not discarded as stale when the session ref holds the stored session", async () => {
  const generation = createSessionGeneration();
  const refreshed = { session: { access_token: "new-a", refresh_token: "new-r", expires_in: 3600 } };
  const run = (getSession) => {
    const saved = [];
    return generation
      .refresh(stored, async () => refreshed, getSession, (s) => saved.push(s), () => true)
      .then((result) => ({ result, saved }));
  };

  // A render resetting sessionRef to null state used to trigger the stale_session guard.
  const nulled = await run(() => null);
  assert.equal(nulled.result.errorType, "stale_session");

  const kept = await run(() => stored);
  assert.equal(kept.result.errorType, null);
  assert.equal(kept.saved.length, 1);
});

test("stale_session refresh results use a distinct diagnostic category and stop retrying", async () => {
  const storage = memoryStorage();
  let calls = 0;
  const outcome = await runRestoreAttempts({
    refresh: async () => { calls += 1; return { session: null, errorType: "stale_session" }; },
    isCurrent: () => true,
    record: (entry) => recordRestoreEvent(entry, storage),
    sleep: async () => {},
  });
  assert.equal(outcome.status, "stale");
  assert.equal(calls, 1);
  assert.equal(readRestoreDiagnostics(storage)[0].category, "stale_guard");
});
