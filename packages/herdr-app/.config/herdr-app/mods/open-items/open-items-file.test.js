// node --test open-items-file.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseItems } from "./open-items-file.js";

test("parses questions and findings, with and without an about", () => {
  const content = [
    "# Open",
    "",
    "- Q7 (PI-2506) Re-run the failed jobs? Recommend yes.",
    "* F12: Version=\"*\" floats (see #268)",
    "- F3 () empty brackets",
    "- not an item",
    "- Q (no number) skipped",
  ].join("\n");
  assert.deepEqual(parseItems(content), [
    { kind: "Q", id: "Q7", about: "PI-2506", text: "Re-run the failed jobs? Recommend yes." },
    { kind: "F", id: "F12", about: null, text: "Version=\"*\" floats (see #268)" },
    { kind: "F", id: "F3", about: null, text: "empty brackets" },
  ]);
});

test("empty file gives no items", () => {
  assert.deepEqual(parseItems(""), []);
});
