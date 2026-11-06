// node --test pr.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { prOf, checksLine } from "./pr.js";

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
