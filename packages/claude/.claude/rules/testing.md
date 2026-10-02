---
paths:
  - "**/*_test.go"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/test_*.py"
  - "**/*Tests.cs"
  - "**/*Test.cs"
---

# Testing

Detail for the summary in `~/.claude/CLAUDE.md`. Consult when writing or modifying tests.

## Test behaviour, not implementation

A refactor that breaks tests but not code means the tests were wrong. Tests assert observable outcomes - return values, side effects on real boundaries, error conditions - not internal calls or private state.

## Cover edges and errors

Bugs live at the edges. Always include:

- Empty inputs, single-element inputs, max-size inputs
- Boundary values (off-by-one, zero, negative, overflow)
- Malformed or unexpected data
- Missing files, missing fields, missing config
- Network failures, timeouts, partial reads
- Concurrent access where relevant

Happy-path-only tests give false confidence.

## Mock boundaries, not logic

Mock only:

- Slow things: network, filesystem, external services
- Non-deterministic things: time, randomness, UUIDs
- Anything outside the unit under test's process

Never mock pure functions, internal collaborators, or anything you own. If logic is hard to test without mocking, the design is wrong - extract the dependency, don't mock around it.

## Verify tests catch failures

Every new test must be proven to fail before it passes:

1. Write the test.
2. Break the code (or skip the implementation).
3. Confirm the test fails for the right reason.
4. Fix the code, watch the test pass.

A test that has never been red is not a test - it's decoration.
