// An orchestrate head labels itself orch.role=head; its workers are its hc children (`parent`).
// Workers label themselves orch.pr and orch.status; the head labels them orch.phase=checking|relayed.
// open-items/head.js keeps a copy of activeHead: mods can't import from each other.

export const isHead = (t) => t?.labels?.["orch.role"] === "head";

// The head you're looking at: the first head up the parent chain from the focused terminal,
// else the last one if it's still a head, else the only head there is.
export function activeHead(terms, focusedAddr, last) {
  const by = new Map(terms.map((t) => [t.address, t]));
  for (let t = by.get(focusedAddr), hops = 0; t && hops < 8; t = by.get(t.parent), hops++) if (isHead(t)) return t.address;
  if (last && isHead(by.get(last))) return last;
  const heads = terms.filter(isHead);
  return heads.length === 1 ? heads[0].address : null;
}

const ITEM = /^\s*[-*] (Q\d+)(?: \(([^)]*)\))?:? (.+)$/;
// The open questions in the head's open-items file: [{ id: "Q3", about: "PI-2046" | null, text }].
export const questionsOf = (content) =>
  (content ?? "").split("\n").flatMap((l) => { const m = ITEM.exec(l); return m ? [{ id: m[1], about: m[2]?.trim() || null, text: m[3].trim() }] : []; });

const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const base = (p) => (p ?? "").replace(/\/+$/, "").split("/").pop() || "?";

// One of: needs, review, ready, frozen, done, working.
export function workerState(w, terms, questions) {
  if (w.state && w.state !== "live") return "done";
  const phase = w.labels?.["orch.phase"];
  if (phase === "relayed") return "frozen";
  if (questions.some(({ about: a }) => a && (norm(w.name).includes(norm(a)) || norm(a) === norm(base(w.cwd))))) return "needs";
  if (phase === "checking") return "ready";
  if (w.status === "blocked") return "needs";
  if (terms.some((t) => t.parent === w.address && (!t.state || t.state === "live"))) return "review";
  return "working";
}

const LINE = { needs: "Needs you", review: "Reviewer running", ready: "Report in · head checking", frozen: "Relayed · frozen until merge", done: "Finished", working: "Working" };

// [{ repo, workers: [{ address, name, pr, state, line }] }], repos in first-seen order.
export function groupWorkers(terms, head, questions = []) {
  const groups = new Map();
  for (const w of terms.filter((t) => t.parent === head)) {
    const state = workerState(w, terms, questions), repo = base(w.cwd);
    const line = state === "working" || state === "review" ? w.labels?.["orch.status"] || LINE[state] : LINE[state];
    if (!groups.has(repo)) groups.set(repo, []);
    groups.get(repo).push({ address: w.address, name: w.name ?? w.address, pr: w.labels?.["orch.pr"] ?? null, phase: w.labels?.["orch.phase"] ?? null, state, line });
  }
  return [...groups].map(([repo, workers]) => ({ repo, workers }));
}

// What's new since the last look, for a toast: a worker whose report just came in (orch.phase=checking)
// and a question just added. seen = { phases: { address: phase }, qs: [ids] }, null on the first look,
// which only records. Returns { events, seen }.
export function newEvents(seen, workers, questions) {
  const next = { phases: Object.fromEntries(workers.map((w) => [w.address, w.phase])), qs: questions.map((q) => q.id) };
  if (!seen) return { events: [], seen: next };
  const events = [
    ...workers.filter((w) => w.phase === "checking" && seen.phases[w.address] !== "checking").map((w) => ({ kind: "report", worker: w })),
    ...questions.filter((q) => !seen.qs.includes(q.id)).map((q) => ({ kind: "question", question: q })),
  ];
  return { events, seen: next };
}
