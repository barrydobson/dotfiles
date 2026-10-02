---
name: wiki-audit
description: Audit the knowledge base, apply the mechanical fixes, and close the top coverage gaps
---

/audit --fix

`--fix` matters. A report-only run re-reports the same broken links every week and applies none of them. That is how 74 dead links survived five months of weekly audits.

Follow the skill in order and **write the report last**. The report has to record what this run changed, not only what it found. A report written before the fixing lists gaps that the same run went on to close, and the next run's recurrence check then reads that report and calls them open again.

Two limits on an unattended run:

- **Write the top 2 to 3 coverage gaps, no more.** Everything below that goes in `### Suggested new articles` for the next run. Add each new article to its topic hub note.
- **Never delete or merge a duplicate note.** Report the pair under `### Needs a decision` and leave both in place.

Report what was fixed, what was written, and what needs a decision.