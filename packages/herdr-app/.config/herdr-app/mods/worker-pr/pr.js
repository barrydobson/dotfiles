// gh pr view's JSON as the worker-pr panel shows it.
// Adapted from Shepherdr core/worktree.js (MIT, Copyright (c) 2026 Elias Stravik).

export const PR_FIELDS = "number,title,state,isDraft,url,headRefName,baseRefName,additions,deletions,changedFiles,statusCheckRollup";
// Asked as well once the head has relayed the PR as ready to merge.
export const READY_FIELDS = `${PR_FIELDS},commits,files,mergeable,reviewDecision`;

// A check as pass, fail, pending (running or waiting) or skip.
export function checkOf(c) {
  if (c.__typename === "StatusContext") {
    const s = String(c.state ?? "").toUpperCase();
    return { name: c.context ?? "Status", url: c.targetUrl || null,
      state: s === "SUCCESS" ? "pass" : s === "PENDING" || s === "EXPECTED" ? "pending" : "fail" };
  }
  const done = String(c.status ?? "").toUpperCase() === "COMPLETED", end = String(c.conclusion ?? "").toUpperCase();
  return { name: c.name ?? c.workflowName ?? "Check", url: c.detailsUrl || null,
    state: !done ? "pending" : end === "SUCCESS" ? "pass" : end === "SKIPPED" || end === "NEUTRAL" ? "skip" : "fail" };
}

// "1 failed · 2 running · 3 passed"
export function checksLine(cs) {
  const n = (s) => cs.filter((c) => c.state === s).length;
  return [[n("fail"), "failed"], [n("pending"), "running"], [n("pass"), "passed"], [n("skip"), "skipped"]]
    .filter(([k]) => k).map(([k, w]) => `${k} ${w}`).join(" · ");
}

// Failed first, then running, passed, skipped: what needs a look sits on top.
const CHECK_ORDER = { fail: 0, pending: 1, pass: 2, skip: 3 };

export function prOf(d) {
  const state = d.state === "MERGED" ? "merged" : d.state === "CLOSED" ? "closed" : d.isDraft ? "draft" : "open";
  const checks = (d.statusCheckRollup ?? []).map(checkOf).sort((a, b) => CHECK_ORDER[a.state] - CHECK_ORDER[b.state] || a.name.localeCompare(b.name));
  return { number: d.number, title: d.title, url: d.url, state, head: d.headRefName, base: d.baseRefName,
    add: d.additions ?? 0, del: d.deletions ?? 0, files: d.changedFiles ?? 0, checks,
    commits: (d.commits ?? []).map((c) => ({ sha: String(c.oid ?? "").slice(0, 7), headline: c.messageHeadline ?? "" })),
    fileList: (d.files ?? []).map((f) => ({ path: f.path, add: f.additions ?? 0, del: f.deletions ?? 0 })),
    mergeable: d.mergeable ?? null, review: d.reviewDecision || null };
}

// GitHub's merge verdict in words, and whether it's good: [text, "ok" | "bad" | "wait"].
export function mergeLine(pr) {
  if (pr.state === "merged") return ["Merged", "ok"];
  if (pr.state === "closed") return ["Closed without merging", "bad"];
  const conflict = pr.mergeable === "CONFLICTING", unknown = !pr.mergeable || pr.mergeable === "UNKNOWN";
  const review = { APPROVED: "approved", CHANGES_REQUESTED: "changes requested", REVIEW_REQUIRED: "review required" }[pr.review] ?? "no review needed";
  const text = `${conflict ? "Conflicts with its base" : unknown ? "GitHub is still working out mergeability" : "No conflicts"} · ${review}`;
  return [text, conflict || pr.review === "CHANGES_REQUESTED" ? "bad" : unknown || pr.review === "REVIEW_REQUIRED" ? "wait" : "ok"];
}

// The head's open items about this worker: those whose bracket names it ("PI-2046" in
// "transaction-pi2046") or its repo ("betslip-service"). Same rule as the batch sidebar.
const ITEM = /^\s*[-*] ([QF]\d+)(?: \(([^)]*)\))?:? (.+)$/;
const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const base = (p) => (p ?? "").replace(/\/+$/, "").split("/").pop() || "";
export function itemsFor(content, name, cwd) {
  return (content ?? "").split("\n").flatMap((l) => {
    const m = ITEM.exec(l), a = norm(m?.[2]);
    return m && a && (norm(name).includes(a) || a === norm(base(cwd))) ? [{ id: m[1], text: m[3].trim() }] : [];
  });
}
