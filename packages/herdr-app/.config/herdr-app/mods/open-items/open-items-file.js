// An orchestrate head keeps its open questions and findings in a Markdown file, one item per line:
//
//   - Q7 (PI-2506) Re-run the failed jobs, then /finish again? Recommend yes.
//   - F1 (betslip-service) Local-dev compose files use official images without library/.
//
// The part in brackets is optional. Any other line (headings, notes) is ignored.

const ITEM = /^\s*[-*] ([QF])(\d+)(?: \(([^)]*)\))?:? (.+)$/;

// [{ kind: "Q" | "F", id, about, text }] in file order.
export function parseItems(content) {
  return content.split("\n").flatMap((line) => {
    const m = ITEM.exec(line);
    return m ? [{ kind: m[1], id: `${m[1]}${m[2]}`, about: m[3]?.trim() || null, text: m[4].trim() }] : [];
  });
}
