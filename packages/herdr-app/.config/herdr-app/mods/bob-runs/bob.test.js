// node --test bob.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { runsOf, slug, newStops, prLabel, finishOf, parseKey, liveRunFor, spaceFor, closeOf, prKindOf, pollAfter, PR_LOOK } from "./bob.js";

// Shaped like herdr's terminals(): address, name, parent, state, status, labels.
const bob = (address, labels, extra = {}) => ({ address, name: null, state: "live", status: "idle", labels, ...extra });
const kid = (address, name, parent, extra = {}) => ({ address, name, parent, state: "live", status: "working", labels: {}, ...extra });
const states = (run) => run.stages.map((s) => s.state[0]).join("");

test("slug matches bob's <n>", () => {
  assert.equal(slug("PI-123"), "pi-123");
  assert.equal(slug("TheTote/x#12"), "thetote-x-12");
});

test("spec stage: earlier none, spec current, the rest todo; click peeks the spec agent", () => {
  const [run] = runsOf([bob("t1", { "bob.ticket": "PI-1", "bob.phase": "spec" }), kid("t2", "spec-pi-1", "t1")]);
  assert.equal(states(run), "ctttttt");
  assert.equal(run.stages[0].agent, "t2");
  assert.equal(run.line, "Spec");
});

test("review round shows n/3; the PR is read from bob, not the builder", () => {
  const terms = [
    bob("t1", { "bob.ticket": "PI-2", "bob.phase": "review", "bob.round": "2", "orch.pr": "https://github.com/o/r/pull/88" }),
    kid("t3", "pi-2", "t1", { labels: { "orch.pr": "99" } }),
    kid("t4", "sol-pi-2", "t1"),
  ];
  const [run] = runsOf(terms);
  assert.equal(states(run), "ddctttt");
  assert.equal(run.stages[2].label, "Review 2/3");
  assert.equal(run.stages[2].agent, "t4");
  assert.equal(run.pr, "https://github.com/o/r/pull/88");
});

test("a blocked agent or a blocked bob marks the current stage blocked", () => {
  const [a] = runsOf([bob("t1", { "bob.ticket": "PI-3", "bob.phase": "spec" }), kid("t2", "spec-pi-3", "t1", { status: "blocked" })]);
  assert.equal(a.stages[0].state, "blocked");
  assert.equal(a.line, "Needs you");
  const [b] = runsOf([bob("t1", { "bob.ticket": "PI-3", "bob.phase": "build" }, { status: "blocked" })]);
  assert.equal(b.stages[1].state, "blocked");
});

test("a blocked agent's stage peeks the agent; a blocked bob's stage peeks bob, where its dialog is", () => {
  const spec = kid("t2", "spec-pi-3", "t1");
  const [agentBlocked] = runsOf([bob("t1", { "bob.ticket": "PI-3", "bob.phase": "spec" }), { ...spec, status: "blocked" }]);
  assert.equal(agentBlocked.stages[0].agent, "t2");
  const [bobBlocked] = runsOf([bob("t1", { "bob.ticket": "PI-3", "bob.phase": "spec" }, { status: "blocked" }), spec]);
  assert.equal(bobBlocked.stages[0].agent, "t1");
  assert.equal(bobBlocked.stages[1].agent, "t1");  // later stage, no agent yet: falls back to bob as before
});

test("newStops records on the first look, then reports each new or changed stop once", () => {
  const run = (address, stopped) => ({ address, stopped });
  const first = newStops(null, [run("t1", "CI failed twice"), run("t2", null)]);
  assert.deepEqual(first.events, []);
  const second = newStops(first.seen, [run("t1", "CI failed twice"), run("t2", "3 review rounds"), run("t3", "Spec unfit")]);
  assert.deepEqual(second.events.map((r) => r.address), ["t2", "t3"]);
  assert.deepEqual(newStops(second.seen, [run("t1", "CI failed twice"), run("t2", "3 review rounds")]).events, []);
  assert.deepEqual(newStops(second.seen, [run("t2", "Build blocked")]).events.map((r) => r.stopped), ["Build blocked"]);
});

test("bob.stopped blocks the current stage and gives the reason", () => {
  const [run] = runsOf([bob("t1", { "bob.ticket": "PI-4", "bob.phase": "ci", "bob.stopped": "CI failed twice" })]);
  assert.equal(states(run), "ddddbtt");
  assert.equal(run.line, "Stopped: CI failed twice");
});

test("done: every stage done; another run's or a dead agent is ignored; agent falls back to bob", () => {
  const terms = [
    bob("t1", { "bob.ticket": "PI-5", "bob.phase": "done" }),
    bob("t9", { "bob.ticket": "PI-6", "bob.phase": "build" }),
    kid("t5", "pi-6", "t1"),                       // same name pattern, wrong parent
    kid("t6", "pi-6", "t9", { state: "exited" }),  // right parent, not live
    { address: "t7", labels: {} },                 // not a bob run
  ];
  const [done, other] = runsOf(terms);
  assert.equal(states(done), "ddddddd");
  assert.equal(done.line, "Done");
  assert.equal(other.stages[1].agent, "t9");
});

test("a finished run keeps its PR after bob removes the builder", () => {
  const [run] = runsOf([bob("t1", { "bob.ticket": "PI-7", "bob.phase": "done", "orch.pr": "https://github.com/o/r/pull/12" })]);
  assert.equal(prLabel(run.pr), "#12");
});

test("prLabel reads a URL, a bare number or nothing", () => {
  assert.equal(prLabel("https://github.com/TheTote/kube-fleet/pull/4040"), "#4040");
  assert.equal(prLabel("https://github.com/o/r/pull/7/"), "#7");
  assert.equal(prLabel("412"), "#412");
  assert.equal(prLabel(null), null);
});

test("finish phase waits on merge; the pill offers /bob --finish until a finish agent runs", () => {
  const [waiting] = runsOf([bob("t1", { "bob.ticket": "PI-2792", "bob.phase": "finish" })]);
  assert.equal(states(waiting), "ddddddc");
  assert.equal(waiting.line, "Merge, then finish");
  assert.deepEqual(finishOf(waiting), { terminal: "t1", text: "/bob --finish PI-2792", replaces: null });

  const [running] = runsOf([bob("t1", { "bob.ticket": "PI-2792", "bob.phase": "finish" }), kid("t2", "finish-pi-2792", "t1")]);
  assert.equal(running.line, "Finishing");
  assert.equal(running.stages[6].agent, "t2");
  assert.equal(finishOf(running), null);

  const [stopped] = runsOf([bob("t1", { "bob.ticket": "PI-2792", "bob.phase": "finish", "bob.stopped": "PR not merged" })]);
  assert.equal(stopped.line, "Stopped: PR not merged");
  assert.ok(finishOf(stopped));                                  // can be run again

  // A stopped finish whose agent is still alive: the pill reruns and says it replaces that agent.
  const [stoppedLive] = runsOf([bob("t1", { "bob.ticket": "PI-2792", "bob.phase": "finish", "bob.stopped": "AC4 waits on 1h scan" }),
    kid("t2", "finish-pi-2792", "t1", { status: "idle" })]);
  assert.deepEqual(finishOf(stoppedLive), { terminal: "t1", text: "/bob --finish PI-2792", replaces: "t2" });

  for (const phase of ["ticket", "done"]) assert.equal(finishOf(runsOf([bob("t1", { "bob.ticket": "PI-1", "bob.phase": phase })])[0]), null);
});

test("parseKey accepts Jira keys, owner/repo#n and issue URLs, and nothing else", () => {
  assert.deepEqual(parseKey(" pi-123 "), { key: "PI-123" });
  assert.deepEqual(parseKey("PLAT2-9"), { key: "PLAT2-9" });
  assert.deepEqual(parseKey("barrydobson/fleet#3"), { key: "barrydobson/fleet#3" });
  assert.deepEqual(parseKey("https://github.com/TheTote/kube-fleet/issues/77"), { key: "TheTote/kube-fleet#77" });
  for (const bad of ["", "PI 123", "PI-123; rm -rf ~", "$(whoami)-1", "/bob PI-1", "PI-123\n/clear", "https://github.com/o/r/pull/4"])
    assert.ok(parseKey(bad).error, bad);
  assert.match(parseKey("x".repeat(60)).error, /…"/);
});

test("liveRunFor finds a run on the same ticket, ignoring finished ones", () => {
  const runs = runsOf([
    bob("t1", { "bob.ticket": "PI-1", "bob.phase": "build" }),
    bob("t2", { "bob.ticket": "PI-2", "bob.phase": "done" }),
  ]);
  assert.equal(liveRunFor(runs, "PI-1").address, "t1");
  assert.equal(liveRunFor(runs, "PI-2"), null);
  assert.equal(liveRunFor(runs, "PI-3"), null);
});

test("spaceFor prefers an existing bob's space, else the space named fleet", () => {
  const spaces = [{ id: "sp1", name: "Personal" }, { id: "sp2", name: "fleet" }];
  assert.equal(spaceFor([bob("t1", { "bob.ticket": "PI-1", "herdr.space": "sp9" })], spaces), "sp9");
  assert.equal(spaceFor([{ address: "t2", labels: { "herdr.space": "sp1" } }], spaces), "sp2");
  assert.equal(spaceFor([], [{ id: "sp1", name: "Personal" }]), null);
});

test("closeOf closes a done run from + at once; asks for anything else and flags a person's own session", () => {
  const spaces = [{ id: "sp1", name: "fleet", tabs: [{ id: "tb1", name: "PI-5" }, { id: "tb2", name: "1" }] }];
  const run = (labels) => runsOf([bob("t1", { "bob.ticket": "PI-5", ...labels })])[0];

  assert.deepEqual(closeOf(run({ "bob.phase": "done", "herdr.tab": "tb1" }), spaces), { terminal: "t1", confirm: null });

  const busy = closeOf(run({ "bob.phase": "review", "bob.round": "2", "herdr.tab": "tb1" }), spaces);
  assert.equal(busy.confirm.title, "Close PI-5?");
  assert.match(busy.confirm.detail, /PI-5 is at Review 2\/3\. Closing ends bob's session and its agents/);
  assert.doesNotMatch(busy.confirm.detail, /started yourself/);

  const stopped = closeOf(run({ "bob.phase": "finish", "bob.stopped": "AC4 waits", "herdr.tab": "tb1" }), spaces);
  assert.match(stopped.confirm.detail, /^PI-5 stopped at Finish\./);

  const own = closeOf(run({ "bob.phase": "done", "herdr.tab": "tb2" }), spaces);
  assert.match(own.confirm.detail, /PI-5 is done\./);
  assert.match(own.confirm.detail, /started yourself, not from \+/);
  assert.ok(closeOf(run({ "bob.phase": "done" }), spaces).confirm);   // no tab label: treated as the person's own
});

test("prKindOf: terminal states first, then draft, failed and running checks", () => {
  const run = (status, conclusion) => ({ __typename: "CheckRun", status, conclusion });
  assert.equal(prKindOf({ state: "MERGED", isDraft: true, statusCheckRollup: [run("COMPLETED", "FAILURE")] }), "merged");
  assert.equal(prKindOf({ state: "CLOSED" }), "closed");
  assert.equal(prKindOf({ state: "OPEN", isDraft: true }), "draft");
  assert.equal(prKindOf({ state: "OPEN", statusCheckRollup: [run("COMPLETED", "SUCCESS"), run("COMPLETED", "FAILURE")] }), "failed");
  assert.equal(prKindOf({ state: "OPEN", statusCheckRollup: [{ __typename: "StatusContext", state: "ERROR" }] }), "failed");
  assert.equal(prKindOf({ state: "OPEN", statusCheckRollup: [run("COMPLETED", "SUCCESS"), run("IN_PROGRESS", "")] }), "pending");
  assert.equal(prKindOf({ state: "OPEN", statusCheckRollup: [{ __typename: "StatusContext", state: "PENDING" }] }), "pending");
  assert.equal(prKindOf({ state: "OPEN", statusCheckRollup: [run("COMPLETED", "SUCCESS"), run("COMPLETED", "SKIPPED")] }), "open");
  assert.equal(prKindOf(null), "open");
  for (const k of ["open", "pending", "failed", "merged", "closed", "draft"]) assert.ok(PR_LOOK[k].label, k);
});

test("pollAfter stops on merged or closed and asks sooner while checks run", () => {
  assert.equal(pollAfter("merged"), null);
  assert.equal(pollAfter("closed", true), null);
  assert.equal(pollAfter("pending"), 120000);
  assert.equal(pollAfter("pending", true), 30000);
  assert.equal(pollAfter("open"), 300000);
  assert.equal(pollAfter("failed", true), 120000);
});

test("a merged PR at the finish phase reads Merged · ready to finish", () => {
  const url = "https://github.com/o/r/pull/9";
  const terms = [bob("t1", { "bob.ticket": "PI-9", "bob.phase": "finish", "orch.pr": url })];
  assert.equal(runsOf(terms, { [url]: "merged" })[0].line, "Merged · ready to finish");
  assert.equal(runsOf(terms, { [url]: "merged" })[0].prKind, "merged");
  assert.equal(runsOf(terms, { [url]: "open" })[0].line, "Merge, then finish");
  assert.equal(runsOf(terms)[0].line, "Merge, then finish");     // not asked yet
  const stopped = [bob("t1", { "bob.ticket": "PI-9", "bob.phase": "finish", "orch.pr": url, "bob.stopped": "AC4" })];
  assert.equal(runsOf(stopped, { [url]: "merged" })[0].line, "Stopped: AC4");
});
