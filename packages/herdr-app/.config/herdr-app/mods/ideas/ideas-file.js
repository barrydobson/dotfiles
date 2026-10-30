// Ideas live in a Markdown file as task items, each with an optional indented meta line:
//
//   - [ ] Review queue panel #herdr #github
//     added 2026-10-30 · repo herdr-mods · issue https://github.com/o/r/issues/7 · done 2026-11-02
//
// Edits touch only those lines: frontmatter, headings and anything else in the file stay as written.

const ITEM = /^- \[( |x|X)\] (.*)$/;
const META = /^ {2}(added .*)$/;
const TAG = /(^|\s)#([\p{L}\p{N}_/-]+)/gu;
const META_KEYS = ["added", "repo", "issue", "done"];

function parseMeta(text) {
  const meta = {};
  for (const part of text.split(" · ")) {
    const at = part.indexOf(" ");
    if (at > 0) meta[part.slice(0, at)] = part.slice(at + 1).trim();
  }
  return meta;
}

function formatMeta(meta) {
  return "  " + META_KEYS.filter((k) => meta[k]).map((k) => `${k} ${meta[k]}`).join(" · ");
}

export function tagsOf(text) {
  return [...text.matchAll(TAG)].map((m) => m[2].toLowerCase());
}

// [{ index, line, metaLine, done, text, title, tags, added, repo, issue, doneAt }] in file order.
export function parseIdeas(content) {
  const lines = content.split("\n"), ideas = [];
  lines.forEach((line, i) => {
    const item = ITEM.exec(line);
    if (!item) return;
    const metaMatch = META.exec(lines[i + 1] ?? "");
    const meta = metaMatch ? parseMeta(metaMatch[1]) : {};
    const text = item[2].trim();
    ideas.push({
      index: ideas.length, line: i, metaLine: metaMatch ? i + 1 : null, done: item[1] !== " ",
      text, title: text.replace(TAG, "$1").replace(/\s+/g, " ").trim(), tags: tagsOf(text),
      added: meta.added ?? null, repo: meta.repo ?? null, issue: meta.issue ?? null, doneAt: meta.done ?? null,
    });
  });
  return ideas;
}

function metaOf(idea) {
  return { added: idea.added, repo: idea.repo, issue: idea.issue, done: idea.doneAt };
}

// Replaces one idea's two lines (item and meta) with new ones.
function rewrite(content, idea, itemLine, meta) {
  const lines = content.split("\n");
  const block = [itemLine, ...(meta.added ? [formatMeta(meta)] : [])];
  lines.splice(idea.line, idea.metaLine === null ? 1 : 2, ...block);
  return lines.join("\n");
}

// New ideas go after the last one, or at the end of the file when there are none.
export function addIdea(content, text, { today, repo = null }) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return content;
  const block = [`- [ ] ${clean}`, formatMeta({ added: today, repo })];
  const ideas = parseIdeas(content), lines = content.split("\n");
  if (ideas.length) {
    const last = ideas[ideas.length - 1];
    lines.splice((last.metaLine ?? last.line) + 1, 0, ...block);
    return lines.join("\n");
  }
  const body = content.replace(/\n*$/, "");
  return `${body}${body ? "\n\n" : ""}${block.join("\n")}\n`;
}

export function toggleIdea(content, index, { today }) {
  const idea = parseIdeas(content)[index];
  if (!idea) return content;
  const done = !idea.done;
  const meta = { ...metaOf(idea), added: idea.added ?? today, done: done ? today : null };
  return rewrite(content, idea, `- [${done ? "x" : " "}] ${idea.text}`, meta);
}

export function linkIssue(content, index, url, { today }) {
  const idea = parseIdeas(content)[index];
  if (!idea) return content;
  return rewrite(content, idea, `- [${idea.done ? "x" : " "}] ${idea.text}`, { ...metaOf(idea), added: idea.added ?? today, issue: url });
}

export function deleteIdea(content, index) {
  const idea = parseIdeas(content)[index];
  if (!idea) return content;
  const lines = content.split("\n");
  lines.splice(idea.line, idea.metaLine === null ? 1 : 2);
  return lines.join("\n");
}
