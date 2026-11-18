// A bob run is a terminal labelled bob.ticket. bob labels itself bob.phase (one of PHASES), bob.round
// (review round), bob.stopped=<reason> when it stops for the person, and orch.pr=<PR URL> once it opens one.
// The PR sits on bob, not the builder, because bob removes the builder when it finishes. Its agents are its hc children,
// named as fleet's .claude/skills/bob/SKILL.md names them: spec-<n>, <n> (builder), sol-<n>, ci-<n>, finish-<n>.

export const STAGES = [
  { id: "spec", label: "Spec", agent: (n) => `spec-${n}` },
  { id: "build", label: "Build", agent: (n) => n },
  { id: "review", label: "Review", agent: (n) => `sol-${n}` },
  { id: "ship", label: "PR", agent: () => null },
  { id: "ci", label: "CI", agent: (n) => `ci-${n}` },
  { id: "ticket", label: "Ticket", agent: () => null },
  { id: "finish", label: "Finish", agent: (n) => `finish-${n}` },
];
const PHASES = [...STAGES.map((s) => s.id), "done"];
const MAX_ROUNDS = 3;

// bob's <n>: the key in lower case, every character outside a-z0-9- turned into -.
export const slug = (key) => String(key).toLowerCase().replace(/[^a-z0-9-]/g, "-");

const live = (t) => !t.state || t.state === "live";

// [{ address, ticket, phase, round, stopped, blocked, line, pr, stages: [{ id, label, state, agent }] }],
// newest terminal last. A stage's state is done, current, blocked or todo; agent is the address to peek,
// live whether the stage's own agent is running.
export function runsOf(terms) {
  return terms.filter((t) => t.labels?.["bob.ticket"]).map((bob) => {
    const l = bob.labels, n = slug(l["bob.ticket"]);
    const phase = PHASES.includes(l["bob.phase"]) ? l["bob.phase"] : "spec";
    const at = PHASES.indexOf(phase), round = Number(l["bob.round"]) || 0, stopped = l["bob.stopped"] || null;
    const child = (name) => name && terms.find((t) => t.parent === bob.address && t.name === name && live(t));
    const stages = STAGES.map((s, i) => {
      const agent = child(s.agent(n));
      const blocked = i === at && (Boolean(stopped) || bob.status === "blocked" || agent?.status === "blocked");
      return { id: s.id, label: s.id === "review" && round ? `Review ${round}/${MAX_ROUNDS}` : s.label,
        // A blocked bob holds the dialog (its AskUserQuestion), so the current stage peeks bob, not its agent.
        state: i < at ? "done" : i > at ? "todo" : blocked ? "blocked" : "current",
        agent: i === at && bob.status === "blocked" ? bob.address : agent?.address ?? bob.address, live: Boolean(agent) };
    });
    const blocked = stages.some((s) => s.state === "blocked");
    const finishing = phase === "finish" && stages[at].live;
    const line = stopped ? `Stopped: ${stopped}` : blocked ? "Needs you" : phase === "done" ? "Done"
      : phase === "finish" ? (finishing ? "Finishing" : "Merge, then finish") : stages[at].label;
    return { address: bob.address, ticket: l["bob.ticket"], phase, round, stopped, blocked, line,
      pr: l["orch.pr"] ?? null, stages };
  });
}

// Runs that have just stopped, for a toast. seen = { address: stopped reason }, null on the first look,
// which only records (or every run already stopped would toast). Returns { events: [run], seen }.
export function newStops(seen, runs) {
  const next = Object.fromEntries(runs.map((r) => [r.address, r.stopped]));
  const events = seen ? runs.filter((r) => r.stopped && seen[r.address] !== r.stopped) : [];
  return { events, seen: next };
}

// "#412" from a PR URL (or a bare number); null without one.
export const prLabel = (pr) => { const m = /(\d+)\/?$/.exec(pr ?? ""); return m ? `#${m[1]}` : null; };

// What the Finish pill types into bob's terminal, or null when it has nothing to start: at the finish phase
// with no finish agent, or after a finish stopped (its agent stays alive but is done; rerun replaces it).
// replaces: the stopped finish agent's address, or null. While a finish runs, the pill peeks it instead.
export function finishOf(run) {
  if (run.phase !== "finish") return null;
  const f = run.stages.find((s) => s.id === "finish");
  if (f.live && !run.stopped) return null;
  return { terminal: run.address, text: `/bob --finish ${run.ticket}`, replaces: f.live ? f.agent : null };
}

// The ticket key the person typed into the + input: a Jira key (any case, given back in capitals),
// owner/repo#12, or a GitHub issue URL (as owner/repo#12). { key } or { error }. The key becomes the
// first message of an auto-mode agent session, so nothing else gets through.
export function parseKey(input) {
  const s = String(input ?? "").trim();
  if (!s) return { error: "Type a ticket key, such as PI-123." };
  let m = /^([A-Za-z][A-Za-z0-9]*)-(\d+)$/.exec(s);
  if (m) return { key: `${m[1].toUpperCase()}-${m[2]}` };
  m = /^([\w.-]+\/[\w.-]+)#(\d+)$/.exec(s);
  if (m) return { key: `${m[1]}#${m[2]}` };
  m = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)\/?$/.exec(s);
  if (m) return { key: `${m[1]}#${m[2]}` };
  const shown = s.length > 40 ? `${s.slice(0, 40)}…` : s;
  return { error: `"${shown}" isn't a ticket key. Use PI-123, owner/repo#12 or a GitHub issue URL.` };
}

// A run already working that ticket (any phase but done), so + focuses it instead of starting a second bob.
export const liveRunFor = (runs, key) => runs.find((r) => r.phase !== "done" && slug(r.ticket) === slug(key)) ?? null;

// The space a new bob's tab goes in: the space an existing bob runs in, else the space named "fleet".
export function spaceFor(terms, spaces) {
  const bob = terms.find((t) => t.labels?.["bob.ticket"] && t.labels?.["herdr.space"]);
  if (bob) return bob.labels["herdr.space"];
  return (spaces ?? []).find((s) => s.name === "fleet")?.id ?? null;
}
