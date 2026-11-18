// node --test pr.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { prOf, checksLine, repoOf, jobOf, logTail, detailOf, commentsOf, mergeActionOf, previewOf, kindOf, pollAfter } from "./pr.js";

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

// Shapes below are copied from a real kube-fleet PR (gh pr view --json, the check-runs API, gh run view --log).
const ACTIONS = "https://github.com/TheTote/kube-fleet/actions/runs/44332856916/job/134901586806";

test("repoOf and jobOf read GitHub URLs; anything else is null", () => {
  assert.deepEqual(repoOf("https://github.com/TheTote/kube-fleet/pull/4041"), { repo: "TheTote/kube-fleet", number: "4041" });
  assert.equal(repoOf("644"), null);
  assert.deepEqual(jobOf(ACTIONS), { repo: "TheTote/kube-fleet", run: "44332856916", job: "134901586806" });
  assert.equal(jobOf("https://sonarcloud.io/dashboard?id=x"), null);
  assert.equal(jobOf(null), null);
});

test("checks carry their Actions job; status contexts have none", () => {
  const pr = prOf({ statusCheckRollup: [
    { __typename: "CheckRun", name: "yamllint", status: "COMPLETED", conclusion: "FAILURE", detailsUrl: ACTIONS },
    { __typename: "StatusContext", context: "sonar", state: "SUCCESS", targetUrl: "https://sonarcloud.io/x" },
  ] });
  assert.equal(pr.checks[0].job.job, "134901586806");
  assert.equal(pr.checks[1].job, null);
});

test("logTail keeps the text, drops group markers and timestamps, and keeps the last n lines", () => {
  const log = [
    "yamllint\tRun lint\t2026-11-18T15:12:11.8786888Z ##[group]Run yamllint .",
    "yamllint\tRun lint\t2026-11-18T15:12:11.9000000Z ./a.yaml",
    "yamllint\tRun lint\t2026-11-18T15:12:12.0000000Z   3:1  error  wrong indentation",
    "yamllint\tRun lint\t2026-11-18T15:12:12.1000000Z ##[endgroup]",
    "yamllint\tRun lint\t2026-11-18T15:12:12.2000000Z ##[error]Process completed with exit code 1.",
    "",
  ].join("\n");
  assert.deepEqual(logTail(log), ["./a.yaml", "  3:1  error  wrong indentation", "error: Process completed with exit code 1."]);
  assert.deepEqual(logTail(log, 1), ["error: Process completed with exit code 1."]);
  assert.deepEqual(logTail(null), []);
});

test("detailOf takes the output, annotations and log", () => {
  const d = detailOf({ output: { title: null, summary: null } },
    [{ path: ".argocd-preprod/gen3-workloads/appset.yaml", start_line: 131, annotation_level: "warning", message: "131:13 [quoted-strings] string value is not quoted" }],
    "");
  assert.deepEqual(d, { title: null, summary: null, log: [],
    annotations: [{ where: ".argocd-preprod/gen3-workloads/appset.yaml:131", level: "warning", message: "131:13 [quoted-strings] string value is not quoted" }] });
});

test("commentsOf merges comments, reviews with something to say and inline comments, newest first", () => {
  const list = commentsOf({
    comments: [
      { author: { login: "github-actions" }, createdAt: "2026-11-18T15:14:52Z", body: "Render diff", url: "c1", isMinimized: false },
      { author: { login: "bot" }, createdAt: "2026-11-18T15:20:00Z", body: "hidden", isMinimized: true },
    ],
    reviews: [
      { author: { login: "alice" }, submittedAt: "2026-11-18T16:00:00Z", state: "APPROVED", body: "" },
      { author: { login: "bob" }, submittedAt: "2026-11-18T15:30:00Z", state: "COMMENTED", body: "" },
    ],
  }, [{ user: { login: "carol" }, created_at: "2026-11-18T15:45:00Z", body: "Typo", path: "a.yaml", line: null, original_line: 9, html_url: "i1" }]);
  assert.deepEqual(list.map((c) => [c.kind, c.author]), [["review", "alice"], ["inline", "carol"], ["comment", "github-actions"]]);
  assert.equal(list[0].verdict, "approved");
  assert.equal(list[1].where, "a.yaml:9");
});

test("mergeActionOf: squash now, auto-merge when blocked or behind, nothing on conflicts, drafts or unknown", () => {
  const pr = (extra) => ({ state: "open", url: "https://github.com/o/r/pull/1", mergeable: "MERGEABLE", mergeState: "CLEAN", autoMerge: false, ...extra });
  assert.deepEqual(mergeActionOf(pr()).args, ["pr", "merge", "https://github.com/o/r/pull/1", "--squash"]);
  assert.equal(mergeActionOf(pr({ mergeState: "UNSTABLE" })).kind, "merge");
  assert.deepEqual(mergeActionOf(pr({ mergeState: "BLOCKED" })).args, ["pr", "merge", "https://github.com/o/r/pull/1", "--squash", "--auto"]);
  assert.equal(mergeActionOf(pr({ mergeState: "BEHIND" })).kind, "auto");
  assert.equal(mergeActionOf(pr({ mergeState: "BLOCKED", autoMerge: true })).kind, "disable-auto");
  assert.equal(mergeActionOf(pr({ mergeable: "CONFLICTING" })), null);
  assert.equal(mergeActionOf(pr({ mergeState: "DIRTY" })), null);
  assert.equal(mergeActionOf(pr({ mergeState: "UNKNOWN" })), null);
  assert.equal(mergeActionOf(pr({ state: "draft" })), null);
  assert.equal(mergeActionOf(pr({ state: "merged" })), null);
  for (const s of ["CLEAN", "BLOCKED", "BEHIND", "UNSTABLE"]) assert.ok(!mergeActionOf(pr({ mergeState: s })).args.includes("--admin"));
});

test("commentsOf strips HTML comments from bodies", () => {
  const [c] = commentsOf({ comments: [{ author: { login: "github-actions" }, createdAt: "t", body: "<!-- render-fleet-diff -->\n### Rendered diff" }] });
  assert.equal(c.body, "### Rendered diff");
});

test("previewOf keeps short bodies whole and cuts long ones, closing an open code fence", () => {
  assert.deepEqual(previewOf("a\nb", 12), { text: "a\nb", more: 0 });
  const diff = ["### Rendered diff", "```diff", "-a", "+b", "-c", "+d"].join("\n");
  assert.deepEqual(previewOf(diff, 3), { text: "### Rendered diff\n```diff\n-a\n```", more: 3 });
  assert.deepEqual(previewOf("x\n```\ny\n```\nz", 4), { text: "x\n```\ny\n```", more: 1 });
  assert.deepEqual(previewOf(null), { text: "", more: 0 });
});

test("kindOf reads prOf's result; pollAfter asks the shown PR fast and stops once it's merged", () => {
  const pr = (state, isDraft, checks) => prOf({ state, isDraft, statusCheckRollup: checks });
  const ok = { __typename: "CheckRun", status: "COMPLETED", conclusion: "SUCCESS" };
  assert.equal(kindOf(pr("MERGED", false, [])), "merged");
  assert.equal(kindOf(pr("CLOSED", false, [])), "closed");
  assert.equal(kindOf(pr("OPEN", true, [])), "draft");
  assert.equal(kindOf(pr("OPEN", false, [ok, { __typename: "CheckRun", status: "COMPLETED", conclusion: "FAILURE" }])), "failed");
  assert.equal(kindOf(pr("OPEN", false, [ok, { __typename: "CheckRun", status: "IN_PROGRESS", conclusion: "" }])), "pending");
  assert.equal(kindOf(pr("OPEN", false, [ok])), "open");
  assert.equal(pollAfter("merged", true), null);
  assert.equal(pollAfter("pending", true), 30000);
  assert.equal(pollAfter("open", true), 120000);
});
