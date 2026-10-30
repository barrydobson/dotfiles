import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { theme, home, props, exec, readTextFile, watchFolder } from "herdr";
import { parseItems } from "./open-items-file.js";

// Opened beside a head: pane.split {direction: "right", mod: "open-items", props: {file}}.
const expand = (path) => (path.startsWith("~/") ? `${home()}${path.slice(1)}` : path);
const folderOf = (path) => path.slice(0, path.lastIndexOf("/"));
// The file is named after the head's terminal (`<HC_TERMINAL_ID>.md`), so that's where answers go.
const headOf = (path) => path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "");

export default class OpenItems extends View {
  init(_props, cx) {
    this.items = []; this.answering = null; this.sent = new Set();
    const file = props()?.file;
    this.path = file ? expand(file) : null;
    if (!this.path) { this.error = "No file: open this pane with props {file}."; return; }
    this.head = headOf(this.path);
    cx.spawn(async (cx) => { await this.reload(cx); this.watch(cx); });
  }

  open(item, cx) {
    if (this.answering === item.id) { this.answering = null; cx.notify(); return; }
    this.answering = item.id;
    this.input = InputState.new({ placeholder: `Answer ${item.id}, Enter to send to ${this.head}` });
    this.input.on("submit", (_e, cx) => this.send(item, cx));
    this.input.focus();
    cx.notify();
  }

  // Sent with no sender ID, so it reaches the head as plain text, the same as the user typing it.
  send(item, cx) {
    const answer = this.input.value().trim();
    if (!answer) return;
    this.busy = item.id; this.error = null;
    cx.spawn(async (cx) => {
      try {
        const r = await exec("hc", ["send", this.head, `${item.id}: ${answer}`]);
        if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim().split("\n")[0]);
        this.sent.add(item.id); this.answering = null;
      } catch (e) { this.error = `${item.id} not sent: ${e.message ?? e}`; }
      finally { this.busy = null; cx.notify(); }
    });
    cx.notify();
  }

  async reload(cx) {
    try {
      const content = await readTextFile(this.path);
      this.items = parseItems(content ?? ""); this.missing = content === null; this.error = null;
    } catch (e) { this.error = `Can't read ${this.path}: ${e}`; }
    cx.notify();
  }

  watch(cx) {
    cx.spawn(async (cx) => {
      try {
        for (;;) {
          const changed = await watchFolder(folderOf(this.path));
          if (changed.includes(this.path)) await this.reload(cx);
        }
      } catch (e) { this.error = `Not watching ${folderOf(this.path)}: ${e}`; cx.notify(); }
    });
  }

  row(item, t) {
    const question = item.kind === "Q", answering = this.answering === item.id, sent = this.sent.has(item.id);
    const status = this.busy === item.id ? "Sending…" : sent ? "Sent, waiting for the head" : null;
    return h_flex().id(`item-${item.id}`).flex_none().px(10).py(6).gap(8).items_start().rounded(7).hover((s) => s.bg(t.hover))
      .when(question, (e) => e.cursor_pointer().on_click((_e, cx) => this.open(item, cx)))
      .child(div().flex_none().w(34).font_semibold().text_color(question ? (sent ? t.dim : t.accent) : t.muted).child(item.id))
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(div().text_color(t.foreground).child(item.text))
        .when(Boolean(item.about), (e) => e.child(div().text_size(11).text_color(t.dim).child(item.about)))
        .when(Boolean(status), (e) => e.child(div().text_size(11).text_color(t.blocked).child(status)))
        .when(answering, (e) => e.child(div().id(`answer-${item.id}`).mt(4).h(28).px(8).flex().items_center().rounded(6)
          .border_1().border_color(t.input).bg(t.background)
          .on_click((_e, cx) => cx.stop_propagation())
          .child(Input.new(this.input).h_full().text_size(12).text_color(t.foreground)))));
  }

  section(title, list, t) {
    return v_flex().flex_none().gap(2)
      .child(div().px(10).pt(8).pb(2).text_size(11).font_semibold().text_color(t.dim).child(`${title} · ${list.length}`))
      .children(list.map((item) => this.row(item, t)));
  }

  render() {
    const t = theme();
    const questions = this.items.filter((i) => i.kind === "Q"), findings = this.items.filter((i) => i.kind === "F");
    const waiting = questions.filter((q) => !this.sent.has(q.id)).length;
    return v_flex().id("open-items").size_full().min_h(0).overflow_hidden().bg(t.background).text_color(t.foreground).text_size(12.5)
      .child(h_flex().h(36).flex_none().px(12).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().child("Open items"))
        .child(div().text_size(11).text_color(waiting ? t.accent : t.dim)
          .child(waiting ? `${waiting} need you` : "nothing to answer")))
      .when(Boolean(this.error), (e) => e.child(div().px(12).py(6).text_size(11).text_color(t.ansi1).child(this.error)))
      .child(v_flex().id("open-items-list").flex_1().min_h(0).overflow_y_scrollbar().p(4).gap(4)
        .when(questions.length > 0, (e) => e.child(this.section("Questions", questions, t)))
        .when(findings.length > 0, (e) => e.child(this.section("Findings", findings, t)))
        .when(!this.items.length && !this.error, (e) => e.child(div().p(8).text_color(t.dim)
          .child(this.missing ? "No open items file yet." : "No open items."))));
  }
}
