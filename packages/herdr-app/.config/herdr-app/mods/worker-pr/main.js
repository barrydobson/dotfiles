// The PR panel under the Bob panel in my-main: the selected run's PR (state, checks, comments, a link), as gh tells it.
// The run is the one clicked in the bob-runs panel (shared "orch.selected"); its PR is its orch.pr label,
// asked in the folder it started in. Asks GitHub on selection, then every 30 s.
// Click an Actions check to expand its output, annotations and (for a failure) the end of its log; fetched on expand.
// Comments lists conversation comments, reviews and inline review comments.
// One merge button: squash now, or enable/disable auto-merge, behind the confirm dialog.
// Adapted from Shepherdr mods/task-pr (MIT, Copyright (c) 2026 Elias Stravik).
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, TextView } from "gpui-base";
import { exec, theme, shared, terminals, openOverlay, nextCommand } from "herdr";
import { PR_FIELDS, prOf, checksLine, repoOf, detailOf, mergeActionOf, previewOf } from "./pr.js";

const EVERY = 30000;

// The selected run, if it's still there: { address, name, cwd, pr }.
function selected() {
  const address = shared("orch.selected");
  const w = address && terminals().find((t) => t.address === address);
  return w ? { address, name: w.name ?? address, cwd: w.cwd, pr: w.labels?.["orch.pr"] ?? null } : null;
}
const keyOf = (w) => (w ? `${w.address}:${w.pr}` : null);

// { pr } or { why } (nothing to show, and why) or { error }.
async function ask(w) {
  if (!w.pr) return { why: "No PR yet. bob sets its orch.pr label when it opens one." };
  const r = await exec("gh", ["pr", "view", String(w.pr), "--json", PR_FIELDS], { cwd: w.cwd });
  if (r.code !== 0) return { error: (r.stderr || r.stdout || "").trim().split("\n")[0] || "GitHub didn't answer." };
  const d = JSON.parse(r.stdout), ref = repoOf(d.url);
  // Inline review comments are only in the REST API. A failure here leaves them out rather than hiding the PR.
  const ic = ref ? await exec("gh", ["api", `repos/${ref.repo}/pulls/${ref.number}/comments?per_page=100`]) : null;
  let inline = [];
  try { if (ic?.code === 0) inline = JSON.parse(ic.stdout); } catch { inline = []; }
  return { pr: prOf(d, inline) };
}

export default class WorkerPr extends View {
  init(_props, cx) {
    this.res = null; this.key = null; this.at = 0; this.asking = false;
    this.open = null; this.details = new Map(); this.pending = null; this.mergeMsg = null;
    cx.timer.every(EVERY, (cx) => this.refresh(cx));
    // The confirm dialog runs worker-pr.merge; this copy then makes the merge it offered.
    cx.spawn(async (cx) => { for (;;) { const c = await nextCommand(); if (c.endsWith("merge")) await this.merge(cx); cx.notify(); } });
  }

  // Expand or collapse a check; an Actions check's detail is fetched the first time it opens.
  toggle(c, cx) {
    this.open = this.open === c.url ? null : c.url;
    if (this.open && !this.details.has(c.url)) {
      this.details.set(c.url, { loading: true });
      cx.spawn(async (cx) => {
        const { repo, run, job } = c.job;
        const api = async (path) => { const r = await exec("gh", ["api", `repos/${repo}/${path}`]); if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim().split("\n")[0]); return JSON.parse(r.stdout); };
        try {
          const [checkRun, notes] = await Promise.all([api(`check-runs/${job}`), api(`check-runs/${job}/annotations`)]);
          const log = c.state === "fail" ? (await exec("gh", ["run", "view", run, "--job", job, "--log-failed", "-R", repo], { timeout: 30000 })).stdout : "";
          this.details.set(c.url, { detail: detailOf(checkRun, notes, log) });
        } catch (e) { this.details.set(c.url, { error: String(e?.message ?? e) }); }
        cx.notify();
      });
    }
    cx.notify();
  }

  // Ask first: the confirm dialog names the PR and what happens, then runs worker-pr.merge.
  askMerge(pr, action) {
    const ref = repoOf(pr.url);
    this.pending = { url: pr.url, action }; this.mergeMsg = null;
    const what = { merge: `Squash-merges it into ${pr.base} now. Anything that deploys on merge to ${pr.base} will run.`,
      auto: `GitHub squash-merges it into ${pr.base} once its required checks and reviews pass.`,
      "disable-auto": "Turns auto-merge off. Nothing is merged." }[action.kind];
    openOverlay({ mod: "confirm", kind: "dialog", props: { title: `${action.label}: #${pr.number}?`,
      detail: `${ref?.repo ?? ""} · ${pr.head} → ${pr.base}\n${pr.title}\n\n${what}`, command: { name: "worker-pr.merge" } } });
  }

  async merge(cx) {
    const p = this.pending; this.pending = null;
    const pr = this.res?.pr;
    // Only the PR the dialog named, if it's still shown.
    if (!p || !pr || pr.url !== p.url) return;
    this.mergeMsg = { text: `${p.action.label}…`, bad: false }; cx.notify();
    const r = await exec("gh", p.action.args, { timeout: 60000 });
    this.mergeMsg = r.code === 0 ? { text: `${p.action.label}: done.`, bad: false }
      : { text: (r.stderr || r.stdout || "gh failed").trim().split("\n")[0], bad: true };
    this.at = 0; this.refresh(cx);
  }

  refresh(cx) {
    if (this.asking) return;
    const w = selected(), key = keyOf(w);
    if (key !== this.key) { this.key = key; this.res = null; this.at = 0; this.open = null; this.details.clear(); this.mergeMsg = null; this.pending = null; }
    if (!w || Date.now() - this.at < EVERY - 1000) return cx.notify();
    this.asking = true;
    cx.spawn(async (cx) => {
      let res;
      try { res = await ask(w); } catch (e) { res = { error: String(e?.message ?? e) }; }
      this.asking = false;
      if (key === this.key) { this.res = res; this.at = Date.now(); }
      cx.notify();
    });
  }

  button(id, icon, label, t, fn) {
    return h_flex().id(id).h(28).pl(8).pr(10).gap(6).flex_none().items_center().rounded(7).cursor_pointer()
      .border_1().border_color(t.border).text_size(12.5).text_color(t.muted)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); fn(cx); })
      .child(svg(icon).size(14).flex_none())
      .child(label);
  }

  note(text, t, error) {
    return v_flex().flex_1().items_center().justify_center().px(24).gap(8)
      .child(svg("mods/worker-pr/git-pull-request.svg").size(18).flex_none().text_color(t.dim))
      .child(div().max_w(300).text_center().text_size(12.5).text_color(error ? t.blocked : t.dim).child(text));
  }

  render(cx) {
    const t = theme(), w = selected();
    const key = keyOf(w);
    if (key !== this.key || (w && Date.now() - this.at >= EVERY)) cx.timer.after(0, (cx) => this.refresh(cx));
    const res = key === this.key ? this.res : null;
    const root = v_flex().id("worker-pr").size_full().min_h(0).overflow_hidden().bg(t.background).text_color(t.foreground).text_size(13)
      .child(h_flex().h(36).flex_none().px(12).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().child("Pull request"))
        .child(div().min_w(0).truncate().text_size(11).text_color(t.dim).child(w ? w.name : "")));
    if (!w) return root.child(this.note("Click a bob run to see its PR.", t));
    if (!res) return root.child(this.note("Asking GitHub…", t));
    if (!res.pr) return root.child(this.note(res.why ?? `GitHub didn't answer: ${res.error}`, t, Boolean(res.error)));
    const pr = res.pr;
    const tone = { open: ["Open", t.ansi2], draft: ["Draft", t.muted], merged: ["Merged", t.ansi5], closed: ["Closed", t.muted] }[pr.state];
    const icon = { pass: ["mods/workspace-chrome/circle-check.svg", t.ansi2], fail: ["mods/worker-pr/circle-x.svg", t.ansi1],
      pending: ["mods/workspace-chrome/clock.svg", t.working], skip: ["mods/worker-pr/circle-minus.svg", t.dim] };
    return root
      .child(h_flex().h(34).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border).text_size(12)
        .child(div().h(20).px(8).flex().flex_none().items_center().rounded(10).bg(tone[1] + "24").text_color(tone[1]).font_medium().child(tone[0]))
        .child(div().flex_none().text_color(t.muted).child(`#${pr.number}`))
        .child(div().flex_1())
        .child(div().flex_none().text_color(t.dim).child(`${pr.files} ${pr.files === 1 ? "file" : "files"}`))
        .when(pr.add > 0, (e) => e.child(div().flex_none().text_color(t.ansi2).child(`+${pr.add.toLocaleString()}`)))
        .when(pr.del > 0, (e) => e.child(div().flex_none().text_color(t.ansi1).child(`−${pr.del.toLocaleString()}`))))
      .child(v_flex().id("worker-pr-body").flex_1().min_h(0).overflow_y_scrollbar().p(16).gap(16)
        .child(v_flex().gap(8)
          .child(div().text_size(14).font_semibold().child(pr.title))
          .child(h_flex().gap(6).items_center().text_size(12).text_color(t.dim)
            .child(svg("mods/workspace-chrome/git-branch.svg").size(12).flex_none())
            .child(div().min_w(0).truncate().child(`${pr.head} → ${pr.base}`)))
          .child(h_flex().gap(6).pt(4)
            .child(this.button("worker-pr-open", "mods/worker-pr/external-link.svg", "Open on GitHub", t, (cx) => cx.open_url(pr.url)))
            .child(this.button("worker-pr-copy", "mods/worker-pr/copy.svg", this.copied === pr.url ? "Copied" : "Copy link", t, (cx) => {
              cx.write_to_clipboard(pr.url);
              this.copied = pr.url;
              cx.timer.after(1500, (cx) => { this.copied = null; cx.notify(); });
              cx.notify();
            })))
          .child(this.mergeRow(pr, t)))
        .child(v_flex().gap(4)
          .child(h_flex().gap(8).items_center().justify_between().text_size(12)
            .child(div().font_medium().text_color(t.muted).child("Checks"))
            .when(pr.checks.length > 0, (e) => e.child(div().min_w(0).truncate().text_color(t.dim).child(checksLine(pr.checks)))))
          .when(!pr.checks.length, (e) => e.child(div().text_size(12).text_color(t.dim).child("No checks on it.")))
          .children(pr.checks.map((c, i) => {
            const [ic, color] = icon[c.state];
            const open = Boolean(c.job) && this.open === c.url;
            // An Actions check expands in place; any other check opens its link.
            const row = h_flex().id(`worker-pr-check-${i}`).h(30).mx(-8).px(8).gap(8).items_center().rounded(7)
              .when(Boolean(c.url), (e) => e.cursor_pointer().hover((s) => s.bg(t.hover))
                .on_click((_e, cx) => (c.job ? this.toggle(c, cx) : cx.open_url(c.url))))
              .when(Boolean(c.job), (e) => e.child(div().w(10).flex_none().text_size(10).text_color(t.dim).child(open ? "▾" : "▸")))
              .child(svg(ic).size(14).flex_none().text_color(color))
              .child(div().flex_1().min_w(0).truncate().child(c.name))
              .when(Boolean(c.url), (e) => e.child(div().id(`worker-pr-check-link-${i}`).flex_none().cursor_pointer()
                .on_click((_e, cx) => { cx.stop_propagation(); cx.open_url(c.url); })
                .child(svg("mods/worker-pr/external-link.svg").size(12).text_color(t.dim))));
            return open ? v_flex().child(row).child(this.detail(this.details.get(c.url), t)) : row;
          })))
        .child(this.comments(pr.comments ?? [], t)));
  }

  // Under an expanded check: its output, annotations and log tail, or why there's nothing.
  detail(d, t) {
    const box = v_flex().ml(18).mb(6).p(8).gap(6).rounded(7).bg(t.surface).text_size(11.5);
    if (!d || d.loading) return box.child(div().text_color(t.dim).child("Asking GitHub…"));
    if (d.error) return box.child(div().text_color(t.blocked).child(d.error));
    const { title, summary, annotations, log } = d.detail;
    const mono = (text, color) => div().font_family("JetBrains Mono").text_size(11).text_color(color ?? t.foreground).child(text);
    const lvl = { failure: t.ansi1, warning: t.working, notice: t.dim };
    return box
      .when(Boolean(title), (e) => e.child(div().font_semibold().child(title)))
      .when(Boolean(summary), (e) => e.child(div().text_color(t.muted).child(summary.length > 600 ? `${summary.slice(0, 600)}…` : summary)))
      .when(annotations.length > 0, (e) => e.child(div().font_medium().text_color(t.muted).child(`Annotations · ${annotations.length}`))
        .children(annotations.map((a) => v_flex().child(mono(a.where, lvl[a.level] ?? t.dim)).child(div().child(a.message)))))
      .when(log.length > 0, (e) => e.child(div().font_medium().text_color(t.muted).child("End of the failed log"))
        .child(v_flex().children(log.map((l) => mono(l)))))
      .when(!title && !summary && !annotations.length && !log.length, (e) => e.child(div().text_color(t.dim).child("No output, annotations or failed log.")));
  }

  comments(list, t) {
    const verdictColor = { approved: t.ansi2, "requested changes": t.ansi1 };
    return v_flex().gap(4)
      .child(div().text_size(12).font_medium().text_color(t.muted).child(`Comments · ${list.length}`))
      .when(!list.length, (e) => e.child(div().text_size(12).text_color(t.dim).child("No comments.")))
      .children(list.map((c, i) => v_flex().id(`worker-pr-comment-${i}`).mx(-8).px(8).py(6).gap(3).rounded(7)
        .when(Boolean(c.url), (e) => e.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => cx.open_url(c.url)))
        .child(h_flex().gap(6).items_center().text_size(11.5)
          .child(div().flex_none().font_medium().child(c.author))
          .when(Boolean(c.verdict), (e) => e.child(div().flex_none().text_color(verdictColor[c.verdict] ?? t.dim).child(c.verdict)))
          .when(Boolean(c.where), (e) => e.child(div().min_w(0).truncate().font_family("JetBrains Mono").text_size(10.5).text_color(t.dim).child(c.where)))
          .child(div().flex_1())
          .child(div().flex_none().text_color(t.dim).child(String(c.at ?? "").slice(0, 10))))
        .when(Boolean(c.body), (e) => e.child(this.body(c, i, t)))));
  }

  // A comment body as markdown: the first lines, and all of it once expanded. scrollable(false) lets it
  // grow to its full height, so the panel scrolls it instead of the text view keeping the wheel.
  body(c, i, t) {
    const key = c.url ?? `${c.author}:${c.at}`, all = this.expanded?.has(key), p = previewOf(c.body);
    return v_flex().gap(2).text_size(12).text_color(t.muted)
      .child(TextView.markdown(`worker-pr-comment-body-${i}`, all ? c.body : p.text).scrollable(false))
      .when(p.more > 0, (e) => e.child(div().id(`worker-pr-comment-more-${i}`).text_size(11.5).text_color(t.accent).cursor_pointer()
        .on_click((_e, cx) => { cx.stop_propagation(); this.expanded ??= new Set(); all ? this.expanded.delete(key) : this.expanded.add(key); cx.notify(); })
        .child(all ? "Show less" : `Show all · ${p.more} more ${p.more === 1 ? "line" : "lines"}`)));
  }

  // The button opens the confirm dialog; it never merges by itself.
  mergeRow(pr, t) {
    const action = mergeActionOf(pr);
    return v_flex().gap(4)
      .when(Boolean(action), (e) => e.child(h_flex().gap(6).child(this.button("worker-pr-merge", "mods/worker-pr/git-pull-request.svg", action.label, t,
        () => this.askMerge(pr, action)))))
      .when(!action && pr.state === "open", (e) => e.child(div().text_size(11.5).text_color(t.dim)
        .child(pr.mergeable === "CONFLICTING" || pr.mergeState === "DIRTY" ? "Conflicts with its base: no merge from here." : "GitHub hasn't worked out whether it can merge yet.")))
      .when(Boolean(this.mergeMsg), (e) => e.child(div().text_size(11.5).text_color(this.mergeMsg.bad ? t.blocked : t.dim).child(this.mergeMsg.text)));
  }
}
