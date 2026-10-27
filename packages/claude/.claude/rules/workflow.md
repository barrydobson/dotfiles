# Workflow

## Branch protection

- Ticket/feature work on shared repos: worktree, never on `main`/`master`. Small doc/config edits and solo repos: `main` is fine. Unsure? Ask.
- Parallel subagents require worktrees - each in its own directory. Never share working directories.
- Create worktrees in the project's `.claude/worktrees` directory. Worktrunk (`wt`) uses the same path.

## Commits

- Conventional prefix: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Imperative mood. Subject ≤72 chars.
- One logical change per commit.
- Never amend or rebase commits already pushed to a shared branch.
- Never commit secrets or `.env` files. Use environment variables.
