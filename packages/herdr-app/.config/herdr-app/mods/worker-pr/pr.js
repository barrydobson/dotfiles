// gh pr view's JSON as the worker-pr panel shows it.
// Adapted from Shepherdr core/worktree.js (MIT, Copyright (c) 2026 Elias Stravik).

export const PR_FIELDS = "number,title,state,isDraft,url,headRefName,baseRefName,additions,deletions,changedFiles,statusCheckRollup";

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
    add: d.additions ?? 0, del: d.deletions ?? 0, files: d.changedFiles ?? 0, checks };
}
