// gh pr view's JSON as the worker-pr panel shows it.
// Adapted from Shepherdr core/worktree.js (MIT, Copyright (c) 2026 Elias Stravik).

export const PR_FIELDS = "number,title,state,isDraft,url,headRefName,baseRefName,additions,deletions,changedFiles,statusCheckRollup,"
  + "mergeable,reviewDecision,mergeStateStatus,autoMergeRequest,comments,reviews";

// A check as pass, fail, pending (running or waiting) or skip.
export function checkOf(c) {
  if (c.__typename === "StatusContext") {
    const s = String(c.state ?? "").toUpperCase();
    return { name: c.context ?? "Status", url: c.targetUrl || null, job: null,
      state: s === "SUCCESS" ? "pass" : s === "PENDING" || s === "EXPECTED" ? "pending" : "fail" };
  }
  const done = String(c.status ?? "").toUpperCase() === "COMPLETED", end = String(c.conclusion ?? "").toUpperCase();
  return { name: c.name ?? c.workflowName ?? "Check", url: c.detailsUrl || null, job: jobOf(c.detailsUrl),
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

export function prOf(d, inline = []) {
  const state = d.state === "MERGED" ? "merged" : d.state === "CLOSED" ? "closed" : d.isDraft ? "draft" : "open";
  const checks = (d.statusCheckRollup ?? []).map(checkOf).sort((a, b) => CHECK_ORDER[a.state] - CHECK_ORDER[b.state] || a.name.localeCompare(b.name));
  return { number: d.number, title: d.title, url: d.url, state, head: d.headRefName, base: d.baseRefName,
    add: d.additions ?? 0, del: d.deletions ?? 0, files: d.changedFiles ?? 0, checks,
    mergeable: d.mergeable ?? null, review: d.reviewDecision || null,
    mergeState: d.mergeStateStatus ?? null, autoMerge: Boolean(d.autoMergeRequest), comments: commentsOf(d, inline) };
}

// "owner/repo" and the number from a PR URL; null for anything else.
export function repoOf(url) {
  const m = /github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/.exec(url ?? "");
  return m ? { repo: m[1], number: m[2] } : null;
}

// { repo, run, job } from a GitHub Actions check's details URL; null for other checks, which only open their link.
export function jobOf(url) {
  const m = /github\.com\/([^/]+\/[^/]+)\/actions\/runs\/(\d+)\/job\/(\d+)/.exec(url ?? "");
  return m ? { repo: m[1], run: m[2], job: m[3] } : null;
}

// The last n lines of `gh run view --log-failed`, whose lines are "<job>\t<step>\t<timestamp> <text>":
// the text only, without Actions' group markers.
export function logTail(text, n = 40) {
  return (text ?? "").split("\n")
    .map((l) => { const parts = l.split("\t"); return parts.length >= 3 ? parts.slice(2).join("\t") : l; })
    .map((l) => l.replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z ?/, ""))
    .filter((l) => l.trim() && !/^##\[(end)?group\]/.test(l))
    .map((l) => l.replace(/^##\[(error|warning|notice)\]/, "$1: "))
    .slice(-n);
}

// What an expanded check shows: the check run's output, its annotations and, for a failure, the log tail.
export function detailOf(run, annotations, log) {
  return {
    title: run?.output?.title || null,
    summary: String(run?.output?.summary ?? "").trim() || null,
    annotations: (annotations ?? []).map((a) => ({ where: `${a.path}:${a.start_line}`, level: a.annotation_level, message: String(a.message ?? "").trim() })),
    log: logTail(log),
  };
}

// Conversation comments, reviews that give a verdict or say something, and inline review comments
// (the REST pulls/<n>/comments list), newest first. Minimised comments are left out.
// Bodies lose HTML comments (bots hide markers in them), since the panel renders the markdown.
export function commentsOf(d, inline = []) {
  const who = (a) => a?.login ?? "ghost";
  const text = (body) => String(body ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
  const verdict = { APPROVED: "approved", CHANGES_REQUESTED: "requested changes", COMMENTED: "reviewed", DISMISSED: "review dismissed" };
  return [
    ...(d.comments ?? []).filter((c) => !c.isMinimized)
      .map((c) => ({ kind: "comment", author: who(c.author), at: c.createdAt, body: text(c.body), url: c.url ?? null })),
    ...(d.reviews ?? []).filter((r) => String(r.body ?? "").trim() || r.state === "APPROVED" || r.state === "CHANGES_REQUESTED")
      .map((r) => ({ kind: "review", author: who(r.author), at: r.submittedAt, body: text(r.body), verdict: verdict[r.state] ?? String(r.state ?? "").toLowerCase(), url: null })),
    ...(inline ?? []).map((c) => ({ kind: "inline", author: c.user?.login ?? "ghost", at: c.created_at, body: text(c.body),
      where: `${c.path}:${c.line ?? c.original_line ?? "?"}`, url: c.html_url ?? null })),
  ].sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
}

// The one merge control, from GitHub's merge state, or null when there is nothing to offer.
// Squash only: Tote squash-merges. Never --admin, so branch protection and required reviews still apply.
// When to offer auto-merge is adapted from Orca's pull-request-auto-merge-availability.ts (MIT, Copyright (c) 2026 Lovecast Inc.).
export function mergeActionOf(pr) {
  if (!pr || pr.state !== "open") return null;
  if (pr.autoMerge) return { kind: "disable-auto", label: "Disable auto-merge", args: ["pr", "merge", pr.url, "--disable-auto"] };
  if (pr.mergeable === "CONFLICTING" || pr.mergeState === "DIRTY") return null;
  if (["CLEAN", "HAS_HOOKS", "UNSTABLE"].includes(pr.mergeState)) return { kind: "merge", label: "Squash and merge", args: ["pr", "merge", pr.url, "--squash"] };
  if (["BLOCKED", "BEHIND"].includes(pr.mergeState)) return { kind: "auto", label: "Enable auto-merge", args: ["pr", "merge", pr.url, "--squash", "--auto"] };
  return null;
}

// The first n lines of a comment body and how many more there are. A cut inside a code fence is
// closed again, so the rest of the markdown isn't swallowed into the block.
export function previewOf(body, n = 12) {
  const lines = String(body ?? "").split("\n");
  if (lines.length <= n) return { text: lines.join("\n"), more: 0 };
  const head = lines.slice(0, n);
  const open = head.filter((l) => /^\s*(```|~~~)/.test(l)).length % 2 === 1;
  return { text: head.join("\n") + (open ? "\n```" : ""), more: lines.length - n };
}

// The PR's kind for polling: merged, closed, draft, failed, pending or open. Same rule as prKindOf in
// bob-runs/bob.js (mods can't import each other), read from prOf's result instead of gh's JSON.
export function kindOf(pr) {
  if (pr.state === "merged" || pr.state === "closed" || pr.state === "draft") return pr.state;
  if (pr.checks.some((c) => c.state === "fail")) return "failed";
  if (pr.checks.some((c) => c.state === "pending")) return "pending";
  return "open";
}

// Copy of pollAfter in bob-runs/bob.js; keep the two in step. Adapted from standFor in Better Sidebar's
// git/pr-status.js (munza/herdr-mods, Apache-2.0, Copyright 2026 Tawsif Aqib).
export function pollAfter(kind, fast = false) {
  if (kind === "merged" || kind === "closed") return null;
  if (kind === "pending") return fast ? 30000 : 120000;
  return fast ? 120000 : 300000;
}
