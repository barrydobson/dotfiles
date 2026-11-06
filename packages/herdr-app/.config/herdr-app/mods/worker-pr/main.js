// The orchestrate layout's worker panel: the selected worker's PR (state, checks, a link), as gh tells it.
// The worker is the one clicked in the batch sidebar (shared "orch.selected"); its PR number is its orch.pr
// label, asked in the folder it started in. Asks GitHub on selection, then every 30 s. Read only.
// Once the head has relayed it (orch.phase=relayed) it adds a Ready to merge section: GitHub's merge
// verdict, the commits and files, and the head's open items about it. There is no merge button: merge on GitHub.
// Adapted from Shepherdr mods/task-pr (MIT, Copyright (c) 2026 Elias Stravik).
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { exec, theme, shared, terminals, home, readTextFile } from "herdr";
import { PR_FIELDS, READY_FIELDS, prOf, checksLine, mergeLine, itemsFor } from "./pr.js";

const EVERY = 30000;

// The selected worker, if it's still there: { address, name, cwd, parent, pr, relayed }.
function selected() {
  const address = shared("orch.selected");
  const w = address && terminals().find((t) => t.address === address);
  return w ? { address, name: w.name ?? address, cwd: w.cwd, parent: w.parent, pr: w.labels?.["orch.pr"] ?? null,
    relayed: w.labels?.["orch.phase"] === "relayed" } : null;
}
const keyOf = (w) => (w ? `${w.address}:${w.pr}:${w.relayed}` : null);

// { pr } or { why } (nothing to show, and why) or { error }.
async function ask(w) {
  if (!w.pr) return { why: "No PR yet. The worker sets its orch.pr label when it opens one." };
  const r = await exec("gh", ["pr", "view", String(w.pr), "--json", w.relayed ? READY_FIELDS : PR_FIELDS], { cwd: w.cwd });
  if (r.code !== 0) return { error: (r.stderr || r.stdout || "").trim().split("\n")[0] || "GitHub didn't answer." };
  const items = w.relayed && w.parent ? itemsFor(await readTextFile(`${home()}/.local/state/orchestrate/${w.parent}.md`), w.name, w.cwd) : [];
  return { pr: prOf(JSON.parse(r.stdout)), items };
}

export default class WorkerPr extends View {
  init(_props, cx) {
    this.res = null; this.key = null; this.at = 0; this.asking = false;
    cx.timer.every(EVERY, (cx) => this.refresh(cx));
  }

  refresh(cx) {
    if (this.asking) return;
    const w = selected(), key = keyOf(w);
    if (key !== this.key) { this.key = key; this.res = null; this.at = 0; }
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
    if (!w) return root.child(this.note("Click a worker in the sidebar to see its PR.", t));
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
            }))))
        .child(v_flex().gap(4)
          .child(h_flex().gap(8).items_center().justify_between().text_size(12)
            .child(div().font_medium().text_color(t.muted).child("Checks"))
            .when(pr.checks.length > 0, (e) => e.child(div().min_w(0).truncate().text_color(t.dim).child(checksLine(pr.checks)))))
          .when(!pr.checks.length, (e) => e.child(div().text_size(12).text_color(t.dim).child("No checks on it.")))
          .children(pr.checks.map((c, i) => {
            const [ic, color] = icon[c.state];
            return h_flex().id(`worker-pr-check-${i}`).h(30).mx(-8).px(8).gap(8).items_center().rounded(7)
              .when(Boolean(c.url), (e) => e.cursor_pointer().hover((s) => s.bg(t.hover)).on_click((_e, cx) => cx.open_url(c.url)))
              .child(svg(ic).size(14).flex_none().text_color(color))
              .child(div().flex_1().min_w(0).truncate().child(c.name))
              .when(Boolean(c.url), (e) => e.child(svg("mods/worker-pr/external-link.svg").size(12).flex_none().text_color(t.dim)));
          })))
        .when(w.relayed, (e) => e.child(this.ready(pr, res.items ?? [], t))));
  }

  // Shown once the head has relayed the PR: what you'd be merging, from GitHub and the head's file.
  ready(pr, items, t) {
    const [verdict, how] = mergeLine(pr);
    const head = (text) => div().pt(4).text_size(12).font_medium().text_color(t.muted).child(text);
    const line = (id, left, right) => h_flex().id(id).min_h(24).gap(8).items_center().text_size(12).child(left).child(right);
    return v_flex().gap(4).pt(12).border_t(1).border_color(t.border)
      .child(div().text_size(13).font_semibold().child("Ready to merge"))
      .child(div().text_size(12).text_color({ ok: t.ansi2, bad: t.ansi1, wait: t.working }[how]).child(verdict))
      .child(head(`Commits · ${pr.commits.length}`))
      .children(pr.commits.map((c, i) => line(`worker-pr-commit-${i}`,
        div().flex_none().font_family("JetBrains Mono").text_size(11).text_color(t.dim).child(c.sha),
        div().flex_1().min_w(0).truncate().child(c.headline))))
      .child(head(`Files · ${pr.fileList.length}`))
      .children(pr.fileList.map((f, i) => line(`worker-pr-file-${i}`,
        div().flex_1().min_w(0).truncate().child(f.path),
        h_flex().flex_none().gap(6).text_size(11)
          .when(f.add > 0, (e) => e.child(div().text_color(t.ansi2).child(`+${f.add}`)))
          .when(f.del > 0, (e) => e.child(div().text_color(t.ansi1).child(`−${f.del}`))))))
      .child(head("Open items about it"))
      .when(!items.length, (e) => e.child(div().text_size(12).text_color(t.dim).child("None.")))
      .children(items.map((it) => line(`worker-pr-item-${it.id}`,
        div().flex_none().w(26).font_semibold().text_color(it.id.startsWith("Q") ? t.accent : t.muted).child(it.id),
        div().flex_1().min_w(0).child(it.text))));
  }
}
