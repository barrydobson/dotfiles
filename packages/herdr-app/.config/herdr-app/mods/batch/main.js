import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, home, terminals, focused, run, exec, readTextFile, watchFolder } from "herdr";
import { activeHead, askedAbout, groupWorkers } from "./orch.js";

// The orchestrate layout's sidebar: the active head's workers, grouped by repo.
const STATE = "/.local/state/orchestrate";
const ORDER = ["needs", "ready", "review", "working", "frozen", "done"];

export default class Batch extends View {
  init(_props, cx) {
    this.head = null; this.asked = []; this.error = null;
    this.folder = `${home()}${STATE}`;
    // terminals() and focused() are live; this only notices the head changing and reloads its questions.
    cx.timer.every(1000, (cx) => {
      const head = activeHead(terminals(), focused()?.terminal, this.head);
      if (head !== this.head) { this.head = head; cx.spawn((cx) => this.reload(cx)); }
    });
    cx.spawn(async (cx) => {
      try { await exec("mkdir", ["-p", this.folder]); for (;;) { const changed = await watchFolder(this.folder); if (this.head && changed.includes(this.file())) await this.reload(cx); } }
      catch (e) { this.error = `Not watching ${this.folder}: ${e}`; cx.notify(); }
    });
  }

  file() { return `${this.folder}/${this.head}.md`; }

  async reload(cx) {
    try { this.asked = this.head ? askedAbout(await readTextFile(this.file())) : []; this.error = null; }
    catch (e) { this.error = `Can't read ${this.file()}: ${e}`; }
    cx.notify();
  }

  dot(state, t) {
    const color = { needs: t.blocked, ready: t.accent, review: t.ansi4, working: t.working, frozen: null, done: t.done }[state];
    return div().size(9).mt(5).flex_none().rounded(5)
      .when(Boolean(color), (e) => e.bg(color)).when(state === "frozen", (e) => e.border(2).border_color(t.done))
      .when(state === "done", (e) => e.opacity(0.55));
  }

  row(w, t) {
    return h_flex().id(`w-${w.address}`).flex_none().pl(14).pr(8).py(5).gap(8).items_start().rounded(7).cursor_pointer()
      .hover((s) => s.bg(t.surface))
      .on_click(() => run("terminal.peek", { terminal: w.address }))
      .child(this.dot(w.state, t))
      .child(v_flex().flex_1().min_w(0)
        .child(div().truncate().text_color(t.foreground).child(w.name))
        .child(div().truncate().text_size(11.5).text_color(w.state === "needs" ? t.blocked : t.dim).child(w.line)))
      .when(Boolean(w.pr), (e) => e.child(div().flex_none().pt(2).text_size(10.5).text_color(t.muted).child(`#${w.pr}`)));
  }

  render() {
    const t = theme();
    const groups = this.head ? groupWorkers(terminals(), this.head, this.asked) : [];
    const all = groups.flatMap((g) => g.workers);
    const count = (s) => all.filter((w) => w.state === s).length;
    for (const g of groups) g.workers.sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
    return v_flex().id("batch").size_full().min_h(0).overflow_hidden().bg(t.chrome).text_color(t.foreground).text_size(12.5)
      .child(h_flex().flex_none().px(14).pt(10).pb(4).items_center()
        .child(div().text_size(11).font_semibold().text_color(t.dim).child(this.head ? `WORKERS · ${all.length}` : "WORKERS"))
        .child(div().ml_auto().text_size(10.5).text_color(t.dim).child(this.head ? `head ${this.head}` : "")))
      .when(Boolean(this.error), (e) => e.child(div().px(14).py(4).text_size(11).text_color(t.blocked).child(this.error)))
      .child(v_flex().id("batch-list").flex_1().min_h(0).overflow_y_scrollbar().px(6).pb(8)
        .when(!this.head, (e) => e.child(div().px(8).py(6).text_color(t.dim)
          .child("No orchestrate head. Focus a head's tab, or start one with /orchestrate.")))
        .when(Boolean(this.head) && !all.length, (e) => e.child(div().px(8).py(6).text_color(t.dim).child("No workers yet.")))
        .children(groups.map((g) => v_flex().flex_none()
          .child(div().px(8).pt(10).pb(2).truncate().text_size(11.5).text_color(t.muted).child(g.repo))
          .children(g.workers.map((w) => this.row(w, t))))))
      .when(all.length > 0, (e) => e.child(h_flex().flex_none().px(14).py(8).gap(12).border_t(1).border_color(t.border).text_size(11).text_color(t.dim)
        .child(`Needs you ${count("needs")}`).child(`Ready ${count("ready")}`)
        .child(`Running ${count("working") + count("review")}`).child(`Frozen ${count("frozen")}`)));
  }
}
