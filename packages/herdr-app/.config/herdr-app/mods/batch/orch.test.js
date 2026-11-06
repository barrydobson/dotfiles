// node --test orch.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { activeHead, questionsOf, groupWorkers, newEvents } from "./orch.js";

const head = { address: "t1", labels: { "orch.role": "head" }, state: "live" };
const w = (address, name, cwd, labels = {}, extra = {}) => ({ address, name, cwd, parent: "t1", state: "live", status: "working", labels, ...extra });

test("activeHead walks up from a worker or its reviewer, then falls back", () => {
  const worker = w("t4", "tx-pi2046", "/r/tx"), reviewer = { address: "t9", parent: "t4", labels: {} };
  const terms = [head, worker, reviewer, { address: "t2", labels: {} }];
  assert.equal(activeHead(terms, "t9", null), "t1");
  assert.equal(activeHead(terms, "t2", "t1"), "t1");          // focus elsewhere keeps the last head
  assert.equal(activeHead(terms, "t2", null), "t1");          // the only head
  assert.equal(activeHead([...terms, { address: "t7", labels: { "orch.role": "head" } }], "t2", null), null);
});

test("groupWorkers groups by repo and works out each state", () => {
  const terms = [
    head,
    w("t4", "tx-pi2046", "/r/tx"),
    w("t5", "tx-pi2051", "/r/tx/", { "orch.status": "Writing tests" }),
    w("t6", "dv-plat388", "/r/dv", { "orch.phase": "checking", "orch.pr": "644" }),
    w("t7", "wal-pi2039", "/r/wal", { "orch.phase": "relayed" }),
    w("t8", "bet-pi2060", "/r/bet"),
    { address: "t9", parent: "t8", state: "live", labels: {} },
    { address: "t3", parent: "t2", state: "live", labels: {} },  // another head's worker
  ];
  const groups = groupWorkers(terms, "t1", questionsOf("- Q3 (PI-2046) Rounding?\n- Q4 No bracket"));
  assert.deepEqual(groups.map((g) => g.repo), ["tx", "dv", "wal", "bet"]);
  const by = Object.fromEntries(groups.flatMap((g) => g.workers).map((x) => [x.name, x]));
  assert.equal(by["tx-pi2046"].state, "needs");
  assert.equal(by["tx-pi2051"].state, "working");
  assert.equal(by["tx-pi2051"].line, "Writing tests");
  assert.equal(by["dv-plat388"].state, "ready");
  assert.equal(by["dv-plat388"].pr, "644");
  assert.equal(by["wal-pi2039"].state, "frozen");
  assert.equal(by["bet-pi2060"].state, "review");
});

test("questionsOf keeps id, about and text", () => {
  assert.deepEqual(questionsOf("- Q3 (PI-2046) Rounding?\n- Q4: No bracket\n- F1 (x) finding"),
    [{ id: "Q3", about: "PI-2046", text: "Rounding?" }, { id: "Q4", about: null, text: "No bracket" }]);
  assert.deepEqual(questionsOf(null), []);
});

test("newEvents records on the first look, then reports only what changed", () => {
  const a = { address: "t4", name: "tx-pi2046", phase: null }, q3 = { id: "Q3", about: "PI-2046", text: "Rounding?" };
  const first = newEvents(null, [a], [q3]);
  assert.deepEqual(first.events, []);
  const second = newEvents(first.seen, [{ ...a, phase: "checking" }], [q3, { id: "Q4", about: null, text: "Hold?" }]);
  assert.deepEqual(second.events.map((e) => e.kind), ["report", "question"]);
  assert.equal(second.events[1].question.id, "Q4");
  assert.deepEqual(newEvents(second.seen, [{ ...a, phase: "checking" }], [q3]).events, []);   // no repeat, a removed Q is no event
});
