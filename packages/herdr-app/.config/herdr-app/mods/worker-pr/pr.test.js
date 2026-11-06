// node --test pr.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { prOf, checksLine, mergeLine, itemsFor } from "./pr.js";

test("prOf maps state and sorts checks failed first", () => {
  const pr = prOf({
    number: 644, title: "Bump", state: "OPEN", isDraft: false, url: "u", headRefName: "h", baseRefName: "main",
    additions: 12, deletions: 4, changedFiles: 3,
    statusCheckRollup: [
      { __typename: "CheckRun", name: "lint", status: "COMPLETED", conclusion: "SUCCESS" },
      { __typename: "CheckRun", name: "build", status: "IN_PROGRESS", conclusion: "" },
      { __typename: "StatusContext", context: "sonar", state: "FAILURE" },
      { __typename: "CheckRun", name: "docs", status: "COMPLETED", conclusion: "SKIPPED" },
    ],
  });
  assert.equal(pr.state, "open");
  assert.deepEqual(pr.checks.map((c) => [c.name, c.state]), [["sonar", "fail"], ["build", "pending"], ["lint", "pass"], ["docs", "skip"]]);
  assert.equal(checksLine(pr.checks), "1 failed · 1 running · 1 passed · 1 skipped");
});

test("prOf: draft, merged, and no checks", () => {
  assert.equal(prOf({ state: "OPEN", isDraft: true }).state, "draft");
  assert.equal(prOf({ state: "MERGED", isDraft: false }).state, "merged");
  assert.deepEqual(prOf({ state: "CLOSED" }).checks, []);
  assert.equal(checksLine([]), "");
});

test("prOf keeps commits, files and GitHub's merge verdict", () => {
  const pr = prOf({ state: "OPEN", commits: [{ oid: "abcdef1234", messageHeadline: "fix: x" }],
    files: [{ path: "a.js", additions: 2, deletions: 1 }], mergeable: "MERGEABLE", reviewDecision: "" });
  assert.deepEqual(pr.commits, [{ sha: "abcdef1", headline: "fix: x" }]);
  assert.deepEqual(pr.fileList, [{ path: "a.js", add: 2, del: 1 }]);
  assert.deepEqual(mergeLine(pr), ["No conflicts · no review needed", "ok"]);
  assert.equal(mergeLine({ ...pr, mergeable: "CONFLICTING" })[1], "bad");
  assert.equal(mergeLine({ ...pr, review: "CHANGES_REQUESTED" })[1], "bad");
  assert.equal(mergeLine({ ...pr, review: "REVIEW_REQUIRED" })[1], "wait");
  assert.equal(mergeLine({ ...pr, mergeable: "UNKNOWN" })[1], "wait");
  assert.deepEqual(mergeLine({ ...pr, state: "merged" }), ["Merged", "ok"]);
});

test("itemsFor picks the worker's Qs and Fs by ticket or repo", () => {
  const file = "- Q3 (PI-2046) Rounding?\n- F1 (racing-platform-apps-transaction) No tests.\n- Q4 (PI-2051) Other ticket\n- F2 No bracket";
  assert.deepEqual(itemsFor(file, "transaction-pi2046", "/r/racing-platform-apps-transaction").map((i) => i.id), ["Q3", "F1"]);
  assert.deepEqual(itemsFor(null, "x", "/r/x"), []);
});
