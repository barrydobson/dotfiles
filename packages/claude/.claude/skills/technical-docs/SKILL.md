---
name: technical-docs
description: "Write reader-facing prose in the style of the Google Developer Documentation Style Guide. Name a document to write and it dispatches the technical-writer agent."
argument-hint: "[document path or topic]"
disable-model-invocation: true
---

# Google developer documentation style

Write reader-facing prose the way the Google Developer Documentation Style Guide prescribes: like a knowledgeable friend - conversational, direct, and precise, for a global audience. This skill distils that guide. Follow the core rules below in reader-facing prose (see Scope); open the reference files when a specific situation calls for detail.

## Writing a whole document

Given a document to create or overhaul - a README, an API reference, a user guide, an architecture doc - dispatch the `technical-writer` agent. It owns the section templates and the audit, research, write, review pass; this skill is the prose style it writes to, and it reads this file itself. Hand it the target path and the source material to read.

Write inline instead when the ask is prose in flight: a chat answer, a report, a section of a document that already exists, or a rewrite of text already on screen.

## Scope

This skill governs **prose a person reads**: chat answers and explanations, summaries, reports, READMEs, docs, tutorials, and how-tos. Word-list substitutions apply to that prose only - never to identifiers, flags, paths, or quoted terms from the project.

It never changes:

- Code, identifiers, string literals, or code comments - write those to match the surrounding codebase.
- Commit messages, configuration files, or machine-read output.
- Quoted material, error messages, or command output that you report verbatim.
- Machine-parsed markdown (for example `AGENTS.md` and other agent contracts). Match the file's existing voice and structure; do not restyle it as public documentation.
- Tool-call arguments.

When rules conflict, the order of precedence is: an explicit style request from the user, then standing instructions in `CLAUDE.md` and organisation instructions, then the constraints of your environment (for example, response-length or formatting rules from your system prompt), then this skill. This skill shapes _how_ you write, not _how much_ - keep whatever brevity your environment requires.

## Voice and tone

Aim for the middle path: not stuffy, not silly. A knowledgeable friend explains things plainly without performing.

- **Second person.** "You," not "we" - except "we recommend" when speaking as the organisation. "The user" means the reader's users, never the reader. If the user or environment sets a different grammatical person (team or product "we", a defined persona, legal first person), keep it.
- **Conversational, not frivolous.** Contractions are fine; slang, hype, pop-culture references, and exclamation marks are not.
- **Delete the hype and hedge words.** The delete-outright list in [references/word-list.md](references/word-list.md) is mandatory, not advisory. Difficulty words earn their own ban: if the reader finds it hard, you've told them the problem is them.
- **Plain imperatives.** "Click **Save**," not "Please click **Save**."
- **Timeless.** Write what stays true whenever the reader arrives; anchor a version or date when recency matters, and leave future features unannounced.
- **Software acts, it doesn't feel.** A service checks, requires, detects, returns.
- **Literal language.** Plain words survive translation; idioms and figurative language don't. Write around jargon or define it on first use.
- **Qualified claims.** Give the measurable fact instead of "best," "fastest," "always," or an unqualified security guarantee.
- **Plain over promotional.** Attribute a claim to a named source or cut it; never "studies show." Give the items that exist rather than padding a list to three for rhythm. The promotional adjectives sit in the delete-outright list.

**Too informal:** "Just garbage-collect and you're golden."
**Right:** "To clean up, call the `collectGarbage` method."
**Too formal:** "The invocation of the garbage-collection facility may be effected as follows."

## Grammar essentials

- **Active voice.** Say who does what: "The server sends a response," not "a response is sent."
- **Present tense.** "The command returns a list," not "will return." Future tense only for genuinely later events.
- **Conditions before instructions.** "To delete the document, click **Delete**" - the goal or condition comes first, so the reader knows whether the step is for them.
- **Precise modals.** "Must" for requirements, "can" for options, "might" for possibilities, "we recommend" for recommendations. Avoid "should," "could," "would," and "may" (policy only).
- **British English spelling** with -ise endings: colour, licence, organisation, behaviour.
- **Short sentences.** Under about 26 words; one idea per paragraph, key point first.
- **Keep helper words** that remove ambiguity: "if X, _then_ Y"; "assumes _that_ you"; "the rules _that_ you defined"; "Start the profiler, _and then_ run the app."
- **Spell out an abbreviation on first use** - "two-factor authentication (2FA)" - unless it's better known than its expansion (API, URL, HTML). Never "e.g.," "i.e.," or "etc." - write "for example," "that is," "such as."

For articles, capitalisation, contractions, plurals, possessives, pronouns, claims, and jargon in depth, read [references/grammar.md](references/grammar.md).

## Formatting essentials

- **Sentence case for every heading and title.** Task headings start with a bare infinitive: "Create an instance," not "Creating an instance."
- **Numbered lists for sequences; bulleted lists for everything else.** One imperative action per step; introduce every list with a complete sentence ending in a colon; keep items parallel.
- **Serial comma.** "Servers, proxies, and load balancers."
- **Code font** (backticks) for code in text: commands, filenames, paths, API names, parameters, literal values, HTTP status codes.
- **Bold** for UI elements only: "click **Deploy**." Not for emphasis.
- **Descriptive link text.** Link the name of the thing - never "click here" or a bare URL in prose. "For more information, see X."
- **Spell out zero through nine**; numerals for 10 and up, and for every number with a unit ("8 bits," "64 GB" with a space).
- **Unambiguous dates.** "19 August 2026" or ISO 8601 (2026-08-19) - never "19/8/26." Times use the 24-hour clock: "15:45".
- **Avoid semicolons, parentheses for important information, "and/or," and slashes in prose.** For a break in a sentence, use a spaced hyphen ( - ), never an em dash or en dash.
- **Notices sparingly.** A note or warning loses force when every paragraph is one.

For headings, lists, procedures, tables, numbers, dates, and notices in depth, read [references/formatting.md](references/formatting.md). For punctuation edge cases (commas, hyphens, dashes, quotation marks), read [references/punctuation.md](references/punctuation.md).

## Word choices

Word substitutions carry more of this style than any other rule. Read [references/word-list.md](references/word-list.md) before writing, and again whenever a term feels off.

## Inclusive and accessible writing

Write so the widest audience can read you: no ableist terms ("sanity check" → "final check"), no gendered defaults (use singular "they"), no violent metaphors ("hangs" → "stops responding"), replace non-inclusive terms ("master/slave" → "primary/replica"). Refer to UI by label, not position or appearance; keep link text meaningful out of context; avoid directional language ("above"/"below" → "earlier"/"following"). Detail: [references/inclusive-accessible.md](references/inclusive-accessible.md).

## Writing about code and interfaces

When prose refers to code or UI - placeholders, command-line syntax, UI navigation, what gets code font versus bold versus italics - follow [references/code-in-text.md](references/code-in-text.md). Two rules come up constantly:

- Never inflect a code item: "send a `POST` request," not "`POST` the data"; "`Intent` objects," not "`Intent`s."
- Placeholders are descriptive `UPPERCASE_WITH_UNDERSCORES`, each explained with "Replace the following:" - never `foo` or `x`.

Invented sample values are never real: example.com, dana@example.com, Example Organisation, 192.0.2.0/24, gender-neutral names (Alex, Dana, Quinn). Facts the user or environment already supplied stay as given - do not replace them with sample data.

## Self-check

Before sending, reread the prose against every rule in this file and in `references/word-list.md` - all of them, not a sample. Title Case headings and the delete-outright words are the slips that survive a careless pass.

## Attribution

This skill distils the [Google Developer Documentation Style Guide](https://developers.google.com/style), created by Google LLC and used under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/). The guide is the authority for cases this skill doesn't cover. Three deliberate deviations: this skill uses British English spelling, day-first dates with a 24-hour clock, and a spaced hyphen where the guide prescribes American spelling, month-first dates with a 12-hour clock, and em dashes.
