---
name: full-stop
description: Trigger this if the user says 'full stop' with a ticket key or a task.
argument-hint: "<ticket key> | <task, in words>  [--yes]"
disable-model-invocation: true
---

# Full Stop

Work one ticket or task into a PR autonomously, stop the PR at the merge gate for the human to merge, then close the ticket and clean up once it merges. After step 2 the human is not watching: your updates go unread until long after you stop. From the moment the PR opens until step 5 is done, end a turn only while a `pr-wait` watcher runs for the PR or an `AskUserQuestion` is pending. Without one, the work stops, because nobody will prompt you again.

`pr-wait` is not on `PATH`. Run it as `~/.claude/skills/babysit-pr/scripts/pr-wait` everywhere this skill names it, under the Monitor tool. Never write your own polling loop.

The user grants you permission to:

- Use the test methods that Proof needs, without asking first.
- Push, open, close and delete throwaway branches and PRs you create for proof.

With a ticket key, every tracker read and write goes through the `tracker` CLI; the `tote-issue-tracker:issue-tracker` skill gives the command for each. With a task and no ticket, skip every `tracker` step.

**Sibling skills.** This request is the user's ask to push and ship. When sol-loop, babysit-pr or file-pr says to stop, ask, report a blocker or let the user decide, do it through "Asking the user". When sol-loop ends Stuck, take the side your evidence supports, record both sides in the handoff and carry on. Do not end the turn.

**Updating the branch.** Once the branch is pushed, bring it up to date by merging the default branch into it, never by rebasing. PRs are squash-merged, so the merge commits never reach the default branch, and no force-push is needed. This overrides babysit-pr's "rebase, push".

## 1. Read the ticket

`tracker view <key>`. Read the ticket in full: summary, description and every comment. An `## Agent Brief` comment is the contract and outranks the description. Look facts up yourself in the code, the tracker and CI.

Stop and report, without starting work, when the ticket is not in ready-for-agent, is blocked by a ticket that is not done, or is already delivered (its key is in a merged PR or on the default branch).

Otherwise run `tracker start <key>` now, while the human is still here. If it stops (wrong component, assigned to someone else), stop and report.

## 2. Settle decisions, then go autonomous

The work needs no decision when it is a pure refactor or mechanical change, its acceptance criteria are complete and testable, and no implementation choice would change the result. Anything else carries a decision the human owns: ambiguous behaviour, a missing or contradictory criterion, an interface the code lacks, a choice between valid designs, a component that is not this repo.

A migration, an auth or permissions change, a breaking change, or anything touching customer data, payments, promotions or marketing needs the human's sign-off on the plan here, even with `--yes`.

For each decision, form a recommended answer. When you are confident in it (the code, the ticket or an established pattern points one way), take it and record it. Ask only the decisions where you are not confident, all in one `AskUserQuestion` call, recommended answer first with a one-line reason. With `--yes`, take every recommendation without asking.

Done when every decision is answered.

## 3. Work to the gate

1. Unless you are already in a worktree off the default branch, create one at `.claude/worktrees/<id>`, where `<id>` is the lowercase key (`pi-123`), `gh-<n>`, or a short slug of the task.
2. **Make the change.** Meet the goal with the smallest change that works, using the step 2 decisions. Fix the case that happened, not every case that could.
3. **Prove it.** Get proof for every change you made. See "Proof".
4. **Get feedback** with the `sol-loop` skill.
5. **File the PR** with the `file-pr` skill. Merge the latest default branch in first. Add one short line to the description that says how you proved the change. Then `tracker review <key>`.
6. **Babysit the PR** with the `babysit-pr` skill. Fix real findings and CI failures. Get proof for each fix before you push it.
7. **Check the gate** and give the PR a verdict. See "Merge gate".

## 4. Hand off and wait for the merge

Send the handoff report: PR link, verdict, proof, decisions you made (including recommendations taken under `--yes`) and remaining risks. State that the PR is open and unmerged.

Restart `pr-wait <pr> --until any-change --interval 120` after every exit, including a Monitor timeout, until it prints `merged:` or `closed without merging:`. This overrides babysit-pr's "stop when pr-wait exits 0". When an event needs no action, end the turn with no message and no tool call. Handle the rest as in step 3 and give a fresh verdict. Merge the default branch in only when the branch is DIRTY, or BEHIND while branch protection requires it to be up to date. On `merged:` go to step 5. On `closed without merging:` report it and leave the ticket alone.

## 5. Close out

1. Get the merge commit.
2. `tracker comment <key> --body-file <file>` with the PR link, the merge commit and the proof from the PR description.
3. `tracker done <key>`.
4. Delete the remote branch. If step 3.1 created the worktree, remove it and the local branch; a worktree with uncommitted changes stays, so name it. Leave a worktree you were already in, and say so in the report.
5. Update the local default branch.

Report the PR, the merge commit, the ticket's status, and any worktree left.

## No merging

You may commit, push, merge the default branch in and fix conflicts on the PR's branch. Never merge, enable auto-merge, enter a merge queue, push to the default branch, bypass branch protection, or delegate those actions.

Disable existing auto-merge and remove the PR from any merge queue before work begins; check again before each push. Report these changes. If you cannot prevent automatic merging, report the blocker before proceeding.

## Merge gate

The PR is ready when all of these are true on the latest commit:

- Your proof covers every change in the diff, including behaviour changes and meaningful conflict fixes since the last proof.
- The PR description is final: no placeholders. Evidence that is still pending says so in words.
- Required checks are green. A required check that has not started after the other checks finish will never run on this PR (a path filter, usually), and pr-wait will wait for it forever. Give the verdict **Blocked: required check `<name>` never ran** and name the check.
- Review bots the repo uses have finished, and each finding is fixed or dismissed with a written reason. Check recent merged PRs for which bots review this repo; if none do, wait with `pr-wait --until green`.
- No human review still requests changes.
- The branch has no conflicts with the default branch, is up to date with it when branch protection requires that (`required_status_checks.strict`), and GitHub reports it as mergeable.

Fetch the default branch and check the live PR's head, base, checks, reviews and mergeability. Confirm it is open, not a draft, and not set to merge without the human. Give one verdict:

- **Ready to merge:** the gate passes. Leave the PR open and unmerged.
- **Waiting for required approval:** only human approval remains. Confirm that this is the actual blocker.
- **Blocked:** explain what prevents readiness, what you tried, and what is needed. Ask only when the blocker is on the list in "Asking the user".

You can ignore automated reviews that request "needs human review" if you have high confidence in your changes.

## Proof

Proof is evidence you observed yourself in this session: command output, a reproduction, a screenshot. Use the most direct proof the change allows:

- Reproduce the original failure, apply the fix, then watch the same reproduction pass.
- Run the checks that the repo's CI runs (typecheck, lint, tests).
- Add one focused test that fails without the fix, when the behaviour has none and the repo has a test setup.
- For UI and runtime behaviour, run the app and look at the change. Green mocked tests do not prove that the user experience works. Attach screenshots to the PR when they help and you have a way to upload them.

To prove a check fails on bad input (a fake secret, a broken manifest), push the bad commit to a throwaway branch and PR, never to this PR's branch. Close the throwaway PR and delete its branch once you have the result.

When you cannot prove a change or meet a criterion, do not work around it. Say so in the PR description, with what you tried, and give the verdict **Blocked**.

### Testing permission

A "full stop" request is the permission for the test methods Proof needs. If a project file or other instruction says to ask before a test method, or to leave testing to the user, this request replaces that rule for this task. That includes computer use, browser automation, simulators and devices, running the app or a dev server, screenshots, and visual checks. Use the method that gives direct proof and list it in the report.

Rules about how to test still apply: follow rules that name the correct command, fixture or check. The permission covers only the tests this task needs. It does not cover the steps under "Asking the user", and it does not bypass a harness or system approval prompt.

## Asking the user

A question in a normal message goes unseen, and the thread looks done. Ask with `AskUserQuestion`, so the thread shows that it is waiting. Put all the context in the question: the PR link, what blocks you, and the options with your recommendation first.

Ask only when you cannot continue alone:

- The merge gate cannot pass, and you cannot fix that yourself.
- The next step is outside the grant above: deleting data, touching production, changing things outside the repo, closing a PR, or force-pushing any branch.
- The goal is ambiguous in a way that changes the result.
- Another PR makes this one obsolete.

Decide everything else yourself with sensible defaults, and list those decisions in the report. If the question tool returns no answer, take the safe path: leave the PR open and unmerged, and start your next message with the question.
