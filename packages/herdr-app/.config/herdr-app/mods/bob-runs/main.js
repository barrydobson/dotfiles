import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { theme, terminals, run, shared, setShared, notify, exec, openOverlay, nextCommand, home, spaces } from "herdr";
import { runsOf, newStops, prLabel, finishOf, parseKey, liveRunFor, spaceFor, closeOf } from "./bob.js";

// The bob layout's sidebar: one row per bob run (a terminal labelled bob.ticket) with its stage strip.
// A click on the row selects the run for the worker-pr panel (shared "orch.selected"; bob carries orch.pr);
// a click on a stage peeks the agent running it, or bob itself when that agent is gone or bob is blocked.
// It toasts when a run's bob.stopped label appears; the toast focuses bob's terminal.
// The Finish pill, while a run waits at the finish phase, asks first (the confirm dialog), then types
// `/bob --finish <key>` into bob's terminal with hc send.
// The + in the header opens a ticket input: Enter starts `/bob <key>` in a new, unfocused tab of the fleet space
// (or focuses the run already on that ticket); Esc closes it.
// The × on a hovered card ends bob's session, its agents and its tab: at once for a done run started from +,
// otherwise after the confirm dialog. The worktree, branch, PR and ticket stay.
export default class BobRuns extends View {
  init(_props, cx) {
    this.seen = null;
    cx.timer.every(1000, () => {
      const { events, seen } = newStops(this.seen, runsOf(terminals()));
      this.seen = seen;
      for (const r of events) notify({ title: `${r.ticket} stopped`, body: r.stopped, level: "warning", timeout: 20000,
        action: { name: "pane.focus", args: { terminal: r.address } } });
    });
    this.pending = null; this.input = null; this.addError = null; this.hovered = null; this.closing = null;
    // The confirm dialog runs bob-runs.finish.
    cx.spawn(async (cx) => { for (;;) { const c = await nextCommand(); if (c.endsWith("finish")) await this.finish(); else if (c.endsWith("close")) await this.close(this.closing); cx.notify(); } });
  }

  openAdd(cx) {
    this.addError = null;
    this.input = InputState.new({ value: "" });
    this.input.on("submit", (_e, cx) => { this.start(); cx.notify(); });
    this.input.focus();
    cx.notify();
  }

  closeAdd() { this.input = null; this.addError = null; }

  start() {
    const { key, error } = parseKey(this.input?.value());
    if (error) { this.addError = error; return; }
    const dup = liveRunFor(runsOf(terminals()), key);
    if (dup) {
      run("pane.focus", { terminal: dup.address });
      notify({ title: `${key} is already running`, body: "Showing its bob.", level: "info" });
      return this.closeAdd();
    }
    const space = spaceFor(terminals(), spaces());
    if (!space) { this.addError = "No fleet space to start it in. Open one named fleet first."; return; }
    // bob only exists in fleet, so the folder is fixed whatever folder the space shows.
    run("tab.new", { space, name: key, folder: `${home()}/_git/barrydobson/fleet`, argv: ["claude", "--permission-mode", "auto"],
      task: `/bob ${key}`, focus: false });
    notify({ title: `${key} started`, body: "bob is running in a new fleet tab. Its row appears once it labels itself.", level: "success" });
    this.closeAdd();
  }

  askClose(r) {
    const c = closeOf(r, spaces());
    if (!c.confirm) return this.close(c.terminal);
    this.closing = c.terminal;
    openOverlay({ mod: "confirm", kind: "dialog", props: { ...c.confirm, command: { name: "bob-runs.close" } } });
  }

  // bob's live agents first, then bob: hc kill ends each, hc rm clears it. Its tab closes with its terminal.
  async close(address) {
    this.closing = null;
    if (!address) return;
    const kids = terminals().filter((t) => t.parent === address && (!t.state || t.state === "live")).map((t) => t.address);
    for (const a of [...kids, address]) { await exec("hc", ["kill", a]); await exec("hc", ["rm", a]); }
  }

  askFinish(r, f) {
    this.pending = f;
    openOverlay({ mod: "confirm", kind: "dialog", props: { title: `${f.replaces ? "Run finish again for" : "Finish"} ${r.ticket}?`,
      detail: `Types ${f.text} into bob's terminal (${f.terminal}). `
        + (f.replaces ? `It replaces the stopped finish agent (${f.replaces}) with a new one. ` : "")
        + "bob checks the PR has merged, runs the post-merge checks, "
        + "then moves the ticket to Done and removes the worktree and branch. A failed check stops it before Done.",
      command: { name: "bob-runs.finish" } } });
  }

  async finish() {
    const f = this.pending; this.pending = null;
    // Still waiting to finish? The run may have moved on while the dialog was open.
    const r = f && runsOf(terminals()).find((x) => x.address === f.terminal);
    if (!r || !finishOf(r)) return;
    // Without HC_TERMINAL_ID, hc send types the text as is, so bob reads it as the /bob command, not a tagged message.
    const res = await exec("env", ["-u", "HC_TERMINAL_ID", "hc", "send", f.terminal, f.text], { timeout: 70000 });
    if (res.code !== 0) notify({ title: `${r.ticket}: finish not sent`, body: (res.stderr || res.stdout || "hc send failed").trim().split("\n")[0], level: "error" });
  }

  chip(s, r, t) {
    const f = s.id === "finish" ? finishOf(r) : null;
    const color = { done: t.done, current: t.working, blocked: t.blocked, todo: t.dim }[s.state];
    return div().id(`s-${s.agent}-${s.id}`).flex_none().px(6).py(1).rounded(5).text_size(10.5).cursor_pointer()
      .border(1).border_color(color).text_color(s.state === "todo" ? t.dim : t.foreground)
      .when(s.state === "current" || s.state === "blocked", (e) => e.bg(t.surface).font_semibold())
      .hover((h) => h.bg(t.surface))
      .on_mouse_down("left", (_e, cx) => { cx.stop_propagation(); f ? this.askFinish(r, f) : run("terminal.peek", { terminal: s.agent }); })
      .child(s.label);
  }

  row(r, t) {
    const selected = shared("orch.selected") === r.address;
    return v_flex().id(`r-${r.address}`).flex_none().px(10).py(7).gap(5).rounded(7).cursor_pointer()
      .on_hover((h, cx) => { this.hovered = h ? r.address : this.hovered === r.address ? null : this.hovered; cx.notify(); })
      .when(Boolean(selected), (e) => e.bg(t.surface).border_l(2).border_color(t.accent)).hover((s) => s.bg(t.surface))
      .on_mouse_down("left", () => setShared("orch.selected", r.address))
      .child(h_flex().gap(8).items_center()
        .child(div().flex_1().min_w(0).truncate().text_color(t.foreground).child(r.ticket))
        .when(Boolean(r.pr), (e) => e.child(div().flex_none().text_size(10.5).text_color(t.muted).child(prLabel(r.pr))))
        .when(this.hovered === r.address, (e) => e.child(div().id(`close-${r.address}`).size(18).flex().flex_none().items_center().justify_center()
          .rounded(5).cursor_pointer().text_color(t.muted).hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip(`Close ${r.ticket}`)
          .on_mouse_down("left", (_e, cx) => { cx.stop_propagation(); this.askClose(r); })
          .child(svg("mods/workspace-chrome/x.svg").size(12)))))
      .child(div().truncate().text_size(11.5).text_color(r.blocked ? t.blocked : t.dim).child(r.line))
      .child(h_flex().flex_wrap().gap(4).children(r.stages.map((s) => this.chip(s, r, t))));
  }

  render() {
    const t = theme();
    const runs = runsOf(terminals());
    return v_flex().id("bob-runs").size_full().min_h(0).overflow_hidden().bg(t.background).text_color(t.foreground).text_size(12.5)
      // Same header bar as worker-pr's "Pull request", the panel below it.
      .child(h_flex().h(36).flex_none().px(12).gap(8).items_center().border_b(1).border_color(t.border).text_size(13)
        .child(div().font_semibold().child("Bob"))
        .child(div().flex_1())
        .child(div().id("bob-add").size(24).flex().items_center().justify_center().rounded(6).cursor_pointer()
          .text_color(this.input ? t.foreground : t.muted).when(Boolean(this.input), (e) => e.bg(t.hover))
          .hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip("Start a bob on a ticket")
          .on_click((_e, cx) => (this.input ? this.closeAdd() : this.openAdd(cx)))
          .child(svg("mods/workspace-chrome/plus.svg").size(14))))
      .when(Boolean(this.input), (e) => e.child(v_flex().id("bob-add-row").flex_none().px(12).py(8).gap(6).border_b(1).border_color(t.border)
        .on_key_down((ev, cx) => { if (ev.key === "escape") { this.closeAdd(); cx.stop_propagation(); cx.notify(); } })
        .child(Input.new(this.input).h(32).px(10).rounded(8).border_1().border_color(this.addError ? t.blocked : t.accent)
          .bg(t.background).text_size(12.5).text_color(t.foreground))
        .child(div().text_size(11.5).text_color(this.addError ? t.blocked : t.dim)
          .child(this.addError ?? "Ticket key: PI-123, owner/repo#12 or an issue URL. Enter starts bob, Esc closes."))))
      .child(v_flex().id("bob-list").flex_1().min_h(0).overflow_y_scrollbar().px(6).pt(6).pb(8)
        .when(!runs.length, (e) => e.child(div().px(8).py(6).text_color(t.dim).child("No bob runs. Start one with /bob <ticket> in fleet.")))
        .children(runs.map((r) => this.row(r, t))));
  }
}
