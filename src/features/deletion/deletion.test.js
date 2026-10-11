// All tests in this file use mocked fetch responses. They verify the app's
// request shape and handling of server results, not real database behaviour.
import assert from "node:assert/strict";
import { env } from "node:process";
import { test } from "node:test";

env.VITE_SUPABASE_URL = "https://example.supabase.co";
env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
env.DEV = "";

const {
  DELETION_KINDS,
  describeDeletionFailure,
  findDeletionBlocker,
  getDeletionConfirmationDetail,
  getDeletionTable,
  performDeletion,
} = await import("./deletion.js");
const { sbDeleteRow } = await import("../../lib/supabase.js");
const { deleteGreenBean, deleteGreenBeanRoast } = await import("../greenBeans/api.js");
const { deleteRoastedBeanWithBrews } = await import("../beans/deleteRoastedBean.js");

const fkViolation = {
  code: "23503",
  message: 'update or delete on table "green_beans" violates foreign key constraint "roasts_green_bean_id_fkey" on table "roasts"',
};

function response(status, body) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(t, handler) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
    return handler(String(url), options);
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  return calls;
}

function silenceConsoleError(t) {
  const original = console.error;
  console.error = () => {};
  t.after(() => { console.error = original; });
}

test("each deletion kind maps to its own table", () => {
  assert.equal(getDeletionTable(DELETION_KINDS.GREEN_BEAN), "green_beans");
  assert.equal(getDeletionTable(DELETION_KINDS.ROASTED_BEAN), "roasted_beans");
  assert.equal(getDeletionTable(DELETION_KINDS.ROAST), "roasts");
  assert.equal(getDeletionTable(DELETION_KINDS.ROAST_PROFILE), "roast_profiles");
  assert.throws(() => getDeletionTable("unknown"));
});

test("green bean and roast deletes target their own tables with the given ID", async (t) => {
  const calls = mockFetch(t, () => response(204, null));

  assert.equal((await deleteGreenBean("token", "green-1")).ok, true);
  assert.equal((await deleteGreenBeanRoast("token", "roast-1")).ok, true);
  assert.equal((await sbDeleteRow(getDeletionTable(DELETION_KINDS.ROASTED_BEAN), "token", "roasted-1")).ok, true);

  assert.deepEqual(calls.map(({ url, method }) => [method, url]), [
    ["DELETE", "https://example.supabase.co/rest/v1/green_beans?id=eq.green-1"],
    ["DELETE", "https://example.supabase.co/rest/v1/roasts?id=eq.roast-1"],
    ["DELETE", "https://example.supabase.co/rest/v1/roasted_beans?id=eq.roasted-1"],
  ]);
});

test("performDeletion removes using the explicit kind and record ID", async () => {
  const removed = [];
  const result = await performDeletion({
    kind: DELETION_KINDS.ROASTED_BEAN,
    record: { id: "roasted-1", sourceRoastId: "roast-1", brews: [] },
    confirm: async () => true,
    remove: async (kind, id) => { removed.push([kind, id]); return { ok: true }; },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(removed, [[DELETION_KINDS.ROASTED_BEAN, "roasted-1"]]);
});

test("sbDeleteRow exposes the server code for foreign key violations", async (t) => {
  silenceConsoleError(t);
  mockFetch(t, () => response(409, fkViolation));

  const result = await sbDeleteRow("green_beans", "token", "green-1");

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.equal(result.code, "23503");
});

test("23503 failures describe dependencies instead of connection problems", () => {
  const greenMessage = describeDeletionFailure(DELETION_KINDS.GREEN_BEAN, { ok: false, status: 409, code: "23503" });
  assert.match(greenMessage, /has roast logs/);
  assert.match(greenMessage, /Archive it instead/);
  assert.doesNotMatch(greenMessage, /connection/i);

  const roastMessage = describeDeletionFailure(DELETION_KINDS.ROAST, { code: "23503" });
  assert.match(roastMessage, /roasted bean was created from it/);
  assert.doesNotMatch(roastMessage, /Archive/);

  assert.match(describeDeletionFailure(DELETION_KINDS.ROAST, { networkError: true }), /connection/);
  assert.match(describeDeletionFailure(DELETION_KINDS.GREEN_BEAN, { code: "23001" }), /has roast logs/);
});

test("loaded relationships block deletion before confirmation", async () => {
  assert.match(
    findDeletionBlocker(DELETION_KINDS.GREEN_BEAN, { id: "g", roasts: [{ id: "r" }] }),
    /1 roast log\b/,
  );
  assert.match(
    findDeletionBlocker(DELETION_KINDS.ROAST, { id: "r" }, { roastedBeans: [{ id: "b", sourceRoastId: "r" }] }),
    /roasted bean was created from it/,
  );
  assert.equal(findDeletionBlocker(DELETION_KINDS.ROASTED_BEAN, { id: "b", brews: [{}, {}] }), null);

  let confirmed = false;
  let removed = false;
  const errors = [];
  const blockers = [];
  const result = await performDeletion({
    kind: DELETION_KINDS.GREEN_BEAN,
    record: { id: "g", roasts: [{ id: "r" }] },
    confirm: async () => { confirmed = true; return true; },
    remove: async () => { removed = true; return { ok: true }; },
    onError: (message) => errors.push(message),
    onBlocked: (message) => blockers.push(message),
  });

  assert.equal(result.blocked, true);
  assert.equal(confirmed, false);
  assert.equal(removed, false);
  assert.deepEqual(errors, []);
  assert.deepEqual(blockers, ["Can't delete this green bean: it has 1 roast log. Archive it instead to keep its roast history, or delete its roast logs first."]);
});

test("roast logs with dependent roasted beans use the blocked-deletion callback", async () => {
  const blockers = [];
  const errors = [];
  const result = await performDeletion({
    kind: DELETION_KINDS.ROAST,
    record: { id: "roast-1" },
    related: { roastedBeans: [{ id: "bean-1", sourceRoastId: "roast-1" }] },
    confirm: async () => assert.fail("blocked deletion should not ask for confirmation"),
    remove: async () => assert.fail("blocked deletion should not call remove"),
    onBlocked: (message) => blockers.push(message),
    onError: (message) => errors.push(message),
  });

  assert.equal(result.blocked, true);
  assert.deepEqual(blockers, [
    "Can't delete this roast log: a roasted bean was created from it. That roasted bean and its brew history depend on this roast. Delete the roasted bean first if you no longer need it.",
  ]);
  assert.deepEqual(errors, []);
});

test("roast profiles used by logs under archived green beans are blocked with the exact reason", async () => {
    const profile = { id: "profile-1" };
    const archivedGreenBeans = [{
      archived: true,
      roasts: [{ id: "roast-1", roastProfileId: profile.id }],
    }];
    const prompts = [];
    const blockers = [];
    let removed = false;
    const result = await performDeletion({
      kind: DELETION_KINDS.ROAST_PROFILE,
      record: profile,
      related: { roasts: archivedGreenBeans.flatMap((bean) => bean.roasts) },
      confirm: async (...args) => { prompts.push(args); return true; },
      remove: async () => { removed = true; return { ok: true }; },
      onBlocked: (message) => blockers.push(message),
    });

    assert.equal(result.blocked, true);
    assert.deepEqual(prompts, []);
    assert.equal(removed, false);
    assert.deepEqual(blockers, [
      "Cannot delete this roast profile because it is used by existing roast logs. Archive it instead to keep your roast history.",
    ]);
  });

  test("unused roast profiles can still be deleted after confirmation", async () => {
    let confirmed = false;
    let removed = false;
    const result = await performDeletion({
      kind: DELETION_KINDS.ROAST_PROFILE,
      record: { id: "profile-1" },
      related: { roasts: [] },
      confirm: async (label, detail) => {
        confirmed = true;
        assert.equal(label, "roast profile");
        assert.equal(detail, "");
        return true;
      },
      remove: async () => { removed = true; return { ok: true }; },
    });

    assert.equal(result.ok, true);
    assert.equal(confirmed, true);
    assert.equal(removed, true);
  });

  test("database foreign-key protection shows the same roast-profile blocker", async () => {
    const blockers = [];
    const errors = [];
    const result = await performDeletion({
      kind: DELETION_KINDS.ROAST_PROFILE,
      record: { id: "profile-1" },
      related: { roasts: [] },
      confirm: async () => true,
      remove: async () => ({ ok: false, code: "23503" }),
      onBlocked: (message) => blockers.push(message),
      onError: (message) => errors.push(message),
    });

    assert.equal(result.ok, false);
    assert.deepEqual(blockers, [
      "Cannot delete this roast profile because it is used by existing roast logs. Archive it instead to keep your roast history.",
    ]);
    assert.deepEqual(errors, []);
  });

test("database constraint is authoritative when local relationships are stale", async (t) => {
  silenceConsoleError(t);
  mockFetch(t, () => response(409, fkViolation));

  const errors = [];
  const blockers = [];
  let succeeded = false;
  const result = await performDeletion({
    kind: DELETION_KINDS.GREEN_BEAN,
    record: { id: "green-1", roasts: [] },
    confirm: async () => true,
    remove: (_kind, id) => deleteGreenBean("token", id),
    onError: (message) => errors.push(message),
    onBlocked: (message) => blockers.push(message),
    onSuccess: () => { succeeded = true; },
  });

  assert.equal(result.ok, false);
  assert.equal(succeeded, false);
  assert.deepEqual(errors, []);
  assert.equal(blockers.length, 1);
  assert.match(blockers[0], /has roast logs/);
  assert.doesNotMatch(blockers[0], /connection/i);
});

test("database dependency violations for every delete kind use the blocked callback", async () => {
  for (const kind of Object.values(DELETION_KINDS)) {
    const blockers = [];
    const errors = [];
    const result = await performDeletion({
      kind,
      record: { id: "record-1", brews: [] },
      confirm: async () => true,
      remove: async () => ({ ok: false, code: "23503" }),
      onBlocked: (message) => blockers.push(message),
      onError: (message) => errors.push(message),
    });

    assert.equal(result.ok, false, kind);
    assert.equal(blockers.length, 1, kind);
    assert.deepEqual(errors, [], kind);
  }
});

test("failed roasted-bean deletion reports an error and preserves local records", async () => {
  let localBeans = [{ id: "roasted-1", brews: [] }, { id: "roasted-2", brews: [] }];
  const errors = [];

  const result = await performDeletion({
    kind: DELETION_KINDS.ROASTED_BEAN,
    record: localBeans[0],
    confirm: async () => true,
    remove: async () => ({ ok: false, status: 500, code: "XX000", message: "boom [HTTP 500]" }),
    onError: (message) => errors.push(message),
    onSuccess: () => { localBeans = localBeans.filter((bean) => bean.id !== "roasted-1"); },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(localBeans.map((bean) => bean.id), ["roasted-1", "roasted-2"]);
  assert.deepEqual(errors, ["Failed to delete bean. boom [HTTP 500]"]);
});

test("starting a deletion clears stale feedback; cancelling does not delete", async () => {
  const events = [];
  const result = await performDeletion({
    kind: DELETION_KINDS.ROASTED_BEAN,
    record: { id: "roasted-1", brews: [] },
    clearFeedback: () => events.push("clear"),
    confirm: async (label) => { events.push(`confirm:${label}`); return false; },
    remove: async () => { events.push("remove"); return { ok: true }; },
  });

  assert.equal(result.cancelled, true);
  assert.deepEqual(events, ["clear", "confirm:bean"]);
});

test("roasted bean with brews asks for confirmation naming the brews instead of blocking", async () => {
  const prompts = [];
  const removed = [];
  const result = await performDeletion({
    kind: DELETION_KINDS.ROASTED_BEAN,
    record: { id: "roasted-1", brews: [{ id: "brew-1" }] },
    confirm: async (label, detail) => { prompts.push([label, detail]); return true; },
    remove: async (kind, id) => { removed.push([kind, id]); return { ok: true }; },
  });

  assert.equal(result.ok, true);
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0][0], "bean");
  assert.match(prompts[0][1], /permanently delete this bean and its 1 brew\b/);
  assert.deepEqual(removed, [[DELETION_KINDS.ROASTED_BEAN, "roasted-1"]]);
  assert.equal(getDeletionConfirmationDetail(DELETION_KINDS.ROASTED_BEAN, { brews: [] }), "");
  assert.equal(getDeletionConfirmationDetail(DELETION_KINDS.GREEN_BEAN, { roasts: [] }), "");
});

test("cancelling the roasted bean confirmation deletes nothing", async () => {
  let removed = false;
  const result = await performDeletion({
    kind: DELETION_KINDS.ROASTED_BEAN,
    record: { id: "roasted-1", brews: [{ id: "brew-1" }] },
    confirm: async () => false,
    remove: async () => { removed = true; return { ok: true }; },
  });
  assert.equal(result.cancelled, true);
  assert.equal(removed, false);
});

const RPC_URL = "https://example.supabase.co/rest/v1/rpc/delete_roasted_bean_with_brews";

// Simulates performDeletion wired to the real RPC client with local bean state.
async function deleteRoastedBeanFlow({ confirmResult = true, record }) {
  let localBeans = [record, { id: "other-bean", brews: [{ id: "other-brew" }] }];
  const errors = [];
  const blockers = [];
  const prompts = [];
  const result = await performDeletion({
    kind: DELETION_KINDS.ROASTED_BEAN,
    record,
    confirm: async (label, detail) => { prompts.push([label, detail]); return confirmResult; },
    remove: async (_kind, id) => {
      const rpcResult = await deleteRoastedBeanWithBrews("token", id);
      if (rpcResult.ok) localBeans = localBeans.filter((bean) => bean.id !== id);
      return rpcResult;
    },
    onError: (message) => errors.push(message),
    onBlocked: (message) => blockers.push(message),
  });
  return { result, errors, blockers, prompts, localBeanIds: localBeans.map((bean) => bean.id) };
}

const beanWithBrews = { id: "roasted-1", brews: [{ id: "brew-1" }, { id: "brew-2" }] };

test("success: one RPC call deletes the bean, then local state updates", async (t) => {
  const calls = mockFetch(t, () => response(200, 2));

  const { result, errors, prompts, localBeanIds } = await deleteRoastedBeanFlow({ record: beanWithBrews });

  assert.equal(result.ok, true);
  assert.deepEqual(errors, []);
  assert.match(prompts[0][1], /its 2 brews/);
  assert.deepEqual(calls, [{ url: RPC_URL, method: "POST", body: { p_bean_id: "roasted-1" } }]);
  assert.deepEqual(localBeanIds, ["other-bean"]);
});

test("cancellation: no request is sent and local state is unchanged", async (t) => {
  const calls = mockFetch(t, () => response(200, 2));

  const { result, localBeanIds } = await deleteRoastedBeanFlow({ record: beanWithBrews, confirmResult: false });

  assert.equal(result.cancelled, true);
  assert.equal(calls.length, 0);
  assert.deepEqual(localBeanIds, ["roasted-1", "other-bean"]);
});

test("dependency rejection: popup reports blocked roasted-bean deletion without inline error", async (t) => {
  silenceConsoleError(t);
  mockFetch(t, () => response(409, { code: "23001", message: "violates RESTRICT setting of foreign key constraint" }));

  const { result, errors, blockers, localBeanIds } = await deleteRoastedBeanFlow({ record: beanWithBrews });

  assert.equal(result.ok, false);
  assert.deepEqual(localBeanIds, ["roasted-1", "other-bean"]);
  assert.deepEqual(errors, []);
  assert.equal(blockers.length, 1);
  assert.match(blockers[0], /still referenced/);
  assert.match(blockers[0], /Nothing was deleted/);
  assert.doesNotMatch(blockers[0], /brews were deleted/);
});

test("failure: network error keeps local records and suggests checking the connection", async (t) => {
  silenceConsoleError(t);
  mockFetch(t, () => { throw new TypeError("fetch failed"); });

  const { result, errors, blockers, localBeanIds } = await deleteRoastedBeanFlow({ record: beanWithBrews });

  assert.equal(result.ok, false);
  assert.deepEqual(localBeanIds, ["roasted-1", "other-bean"]);
  assert.deepEqual(blockers, []);
  assert.match(errors[0], /Check your connection/);
});

test("ownership rejection: P0002 keeps local records and explains nothing was deleted", async (t) => {
  silenceConsoleError(t);
  mockFetch(t, () => response(400, { code: "P0002", message: "Roasted bean not found" }));

  const { result, errors, localBeanIds } = await deleteRoastedBeanFlow({ record: beanWithBrews });

  assert.equal(result.ok, false);
  assert.equal(result.result.code, "P0002");
  assert.deepEqual(localBeanIds, ["roasted-1", "other-bean"]);
  assert.match(errors[0], /doesn't belong to your account/);
  assert.match(errors[0], /Nothing was deleted/);
});

test("missing RPC (migration not applied) gives an actionable message", async (t) => {
  silenceConsoleError(t);
  mockFetch(t, () => response(404, { code: "PGRST202", message: "Could not find the function" }));

  const { errors, localBeanIds } = await deleteRoastedBeanFlow({ record: beanWithBrews });

  assert.match(errors[0], /Apply the latest Supabase migration/);
  assert.deepEqual(localBeanIds, ["roasted-1", "other-bean"]);
});
