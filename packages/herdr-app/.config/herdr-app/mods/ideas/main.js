import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { spaces, panes, focused, exec, theme, home, appHome, props, readTextFile, writeTextFile, watchFolder } from "herdr";
import { parseIdeas, addIdea, toggleIdea, linkIssue, deleteIdea } from "./ideas-file.js";

const DEFAULT_FILE = "~/ideas.md";
const STATUSES = ["Open", "Done", "All"];

const expand = (path) => (path.startsWith("~/") ? `${home()}${path.slice(1)}` : path);
const folderOf = (path) => path.slice(0, path.lastIndexOf("/"));

function today() {
  const d = new Date(), pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ago(date) {
  const days = Math.round((Date.parse(today()) - Date.parse(date)) / 86400000);
  return days <= 0 ? "today" : `${days}d`;
}

// `ideas.json` next to settings.json: { "file": "~/notes/ideas.md" }.
async function ideasPath() {
  const config = await readTextFile(`${appHome()}/ideas.json`).catch(() => null);
  try { return expand(JSON.parse(config ?? "{}").file ?? DEFAULT_FILE); } catch { return expand(DEFAULT_FILE); }
}

function location() {
  const space = spaces().find((s) => s.active), f = focused();
  const pane = f?.pane ? panes().find((p) => p.pane === f.pane) : null;
  return { cwd: pane?.cwd || f?.cwd || space?.folder, on: space?.machine ?? null };
}

// The repo's name, worktrees included (named after their main checkout); null outside git.
async function repoName() {
  const { cwd, on } = location();
  if (!cwd) return null;
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd, on }).catch(() => null);
  if (!r || r.code !== 0) return null;
  const common = r.stdout.trim();
  return (common.endsWith("/.git") ? common.slice(0, -5) : common).split("/").pop();
}

const sameIdea = (a, b) => a.text === b.text && a.added === b.added;

// The file is anyone's to edit, so an issue link opens only if it's https.
function openIssue(url) {
  try { if (new URL(url).protocol === "https:") exec("open", ["--", url]).catch(() => {}); } catch { /* not a URL */ }
}

export default class Ideas extends View {
  init(_props, cx) {
    this.ideas = []; this.status = "Open"; this.tag = null; this.onlyRepo = false;
    this.input = InputState.new({ placeholder: "New idea, #tags, Enter" });
    this.input.on("submit", (_e, cx) => this.add(cx));
    if (props()?.overlay) this.input.focus();
    cx.spawn(async (cx) => {
      this.path = await ideasPath();
      await this.reload(cx);
      this.watch(cx);
    });
    cx.timer.every(5000, (cx) => this.updateRepo(cx));
    this.updateRepo(cx);
  }

  updateRepo(cx) {
    cx.spawn(async (cx) => {
      const repo = await repoName();
      if (repo !== this.repo) { this.repo = repo; cx.notify(); }
    });
  }

  async reload(cx) {
    try {
      this.content = (await readTextFile(this.path)) ?? "";
      this.ideas = parseIdeas(this.content); this.error = null;
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
      } catch { /* the folder is gone: edits from here still work */ }
    });
  }

  // Edits run one at a time: each reads the file fresh, applies itself, and writes only if
  // nobody changed it meanwhile (two at once would read the same snapshot and one would be refused).
  mutate(edit, cx) {
    const run = (this.queue ?? Promise.resolve()).then(() => this.save(edit));
    this.queue = run;
    cx.spawn(async (cx) => { await run; await this.reload(cx); });
  }

  async save(edit) {
    try {
      const current = await readTextFile(this.path);
      const next = edit(current ?? "");
      if (next !== (current ?? "")) await writeTextFile(this.path, next, current);
      this.error = null;
    } catch (e) { this.error = `Not saved: ${e}`; }
  }

  // An idea's position in the file as it is now, or the edit is dropped.
  editIdea(idea, change, cx) {
    this.mutate((content) => {
      const fresh = parseIdeas(content).find((i) => sameIdea(i, idea));
      return fresh ? change(content, fresh.index) : content;
    }, cx);
  }

  add(cx) {
    const text = this.input.value().trim();
    if (!text || !this.path) return;
    this.input.set_value("");
    const repo = this.repo ?? null;
    this.mutate((content) => addIdea(content, text, { today: today(), repo }), cx);
  }

  createIssue(idea, cx) {
    this.confirming = null; this.busy = idea.text;
    const { cwd, on } = location();
    cx.spawn(async (cx) => {
      try {
        const r = await exec("gh", ["issue", "create", "--title", idea.title, "--body", "From the ideas bank in Herdr."], { cwd, on });
        if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim().split("\n")[0]);
        const url = r.stdout.trim().split("\n").pop();
        this.editIdea(idea, (content, index) => linkIssue(content, index, url, { today: today() }), cx);
      } catch (e) { this.error = `Issue not created: ${e.message ?? e}`; }
      finally { this.busy = null; cx.notify(); }
    });
    cx.notify();
  }

  shown() {
    return this.ideas.filter((i) => (this.status === "All" || (this.status === "Done") === i.done)
      && (!this.tag || i.tags.includes(this.tag)) && (!this.onlyRepo || i.repo === this.repo)).reverse();
  }

  chip(id, text, active, onClick, t) {
    return h_flex().id(id).h(22).px(8).flex_none().items_center().rounded(6).cursor_pointer().text_size(11)
      .bg(active ? t.selected : t.raised).text_color(active ? t.foreground : t.muted)
      .hover((s) => s.bg(t.hover)).on_click((_e, cx) => { onClick(); cx.notify(); }).child(text);
  }

  action(id, text, onClick, t, color = t.muted) {
    return div().id(id).px(6).h(20).flex().flex_none().items_center().rounded(5).cursor_pointer().text_size(11).text_color(color)
      .hover((s) => s.bg(t.raised)).on_click((_e, cx) => onClick(cx)).child(text);
  }

  filters(t) {
    const tags = [...new Set(this.ideas.flatMap((i) => i.tags))].sort();
    return v_flex().flex_none().px(10).py(8).gap(6).border_b(1).border_color(t.border)
      .child(h_flex().gap(5).flex_wrap()
        .children(STATUSES.map((s) => this.chip(`status-${s}`, s, this.status === s, () => { this.status = s; }, t)))
        .when(Boolean(this.repo), (e) => e.child(this.chip("only-repo", this.repo, this.onlyRepo, () => { this.onlyRepo = !this.onlyRepo; }, t))))
      .when(tags.length > 0, (e) => e.child(h_flex().gap(5).flex_wrap()
        .children(tags.map((tag) => this.chip(`tag-${tag}`, `#${tag}`, this.tag === tag, () => { this.tag = this.tag === tag ? null : tag; }, t)))));
  }

  confirmRow(idea, t) {
    const issue = this.confirming?.kind === "issue";
    return h_flex().gap(6).items_center()
      .child(div().flex_1().min_w(0).truncate().text_size(11.5).text_color(issue ? t.foreground : t.ansi1)
        .child(issue ? `Create an issue in ${this.repo}?` : "Delete this idea?"))
      .child(this.action("confirm-yes", issue ? "Create issue" : "Delete", (cx) => {
        if (issue) this.createIssue(idea, cx);
        else { this.confirming = null; this.editIdea(idea, deleteIdea, cx); }
      }, t, issue ? t.accent : t.ansi1))
      .child(this.action("confirm-no", "Cancel", (cx) => { this.confirming = null; cx.notify(); }, t));
  }

  row(idea, t) {
    const key = `${idea.added}:${idea.text}`, confirming = this.confirming?.key === key;
    const meta = [idea.repo, idea.added && ago(idea.added)].filter(Boolean).join(" · ");
    return h_flex().id(`idea-${key}`).flex_none().px(10).py(7).gap(9).items_start().rounded(7).hover((s) => s.bg(t.hover))
      .child(div().id(`check-${key}`).mt(2).size(14).flex_none().rounded(4).border_1().cursor_pointer()
        .border_color(idea.done ? t.accent : t.input).bg(idea.done ? t.accent : t.background)
        .text_size(10).text_color(t.accent_foreground).flex().items_center().justify_center()
        .on_click((_e, cx) => this.editIdea(idea, (c, i) => toggleIdea(c, i, { today: today() }), cx)).child(idea.done ? "✓" : ""))
      .child(v_flex().flex_1().min_w(0).gap(3)
        .child(div().text_color(idea.done ? t.dim : t.foreground).child(idea.title))
        .child(h_flex().gap(5).flex_wrap().items_center().text_size(11).text_color(t.dim)
          .children(idea.tags.map((tag) => div().px(5).rounded(4).bg(t.raised).text_color(t.muted).child(`#${tag}`)))
          .when(Boolean(meta), (e) => e.child(div().child(meta)))
          .when(Boolean(idea.issue), (e) => e.child(this.action(`issue-${key}`, `#${idea.issue.split("/").pop()}`, () => openIssue(idea.issue), t, t.accent))))
        .when(confirming, (e) => e.child(this.confirmRow(idea, t))))
      .when(!confirming && this.busy !== idea.text, (e) => e
        .when(!idea.issue && !idea.done && Boolean(this.repo), (e) => e.child(this.action(`to-issue-${key}`, "Issue", (cx) => { this.confirming = { key, kind: "issue" }; cx.notify(); }, t)))
        .child(this.action(`delete-${key}`, "Delete", (cx) => { this.confirming = { key, kind: "delete" }; cx.notify(); }, t)))
      .when(this.busy === idea.text, (e) => e.child(div().text_size(11).text_color(t.blocked).child("Creating…")));
  }

  render() {
    const t = theme(), list = this.shown(), open = this.ideas.filter((i) => !i.done).length;
    return v_flex().id("ideas").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(12.5)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().child("Ideas"))
        .child(div().text_size(11).text_color(t.dim).child(`${open} open`))
        .child(div().flex_1())
        .when(Boolean(this.path), (e) => e.child(this.action("open-file", "Open file", () => exec("open", ["--", this.path]).catch(() => {}), t))))
      .child(div().flex_none().p(10).border_b(1).border_color(t.border)
        .child(div().h(32).px(10).flex().items_center().rounded(8).border_1().border_color(t.input).bg(t.background)
          .child(Input.new(this.input).h_full().text_size(12.5).text_color(t.foreground))))
      .child(this.filters(t))
      .when(Boolean(this.error), (e) => e.child(div().px(14).py(6).text_size(11).text_color(t.ansi1).child(this.error)))
      .child(v_flex().id("ideas-list").flex_1().min_h(0).overflow_y_scrollbar().p(6).gap(2)
        .children(list.map((idea) => this.row(idea, t)))
        .when(!list.length, (e) => e.child(div().p(8).text_color(t.dim).child(this.ideas.length ? "No ideas match these filters" : "No ideas yet. Type one above."))));
  }
}
