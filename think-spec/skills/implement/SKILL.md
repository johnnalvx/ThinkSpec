---
name: implement
description: think-spec stage 9 — implement the approved tasks of the active spec phase by phase, tests first (test-designer) then code (implementer), checking each task off and recording traceability evidence.
argument-hint: "[T-004 | T-004..T-006 | phase 3] [model=<model>] [effort=<level>]"
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*plan.mjs*), PowerShell(node *think-spec*scripts*tasks.mjs*)
---

# think-spec implement

Build the active spec from its approved tasks, a scoped run at a time: for each phase, `test-designer` writes the tests of its `[test]` tasks and proves them **red**, then `implementer` turns them **green** one code task at a time. This skill orchestrates and verifies; the agents write; the user reviews at every phase checkpoint and decides every gap.

Scope and options: $ARGUMENTS

## Ground rules

- **Language.** Talk and write evidence cells in the first tag of `docs-language`; commit messages in the first tag of `code-language`. IDs, tags, status values and paths stay English.
- **Evidence before checkmarks.** An agent's report is a claim. After every dispatch, run the test command yourself; a box becomes `[x]` only when that run and the task's done-when line confirm it.
- **Ownership.** The agents write code and tests. This skill edits only the checkboxes of `tasks.md`, the evidence cells and `updated` of `traceability.md`, the `status` of `spec.md`, the "pending" lines of AGENTS.md (with approval) and the state keys. `spec.md` `updated`, `tasks.md` `updated` and every other line stay byte-identical. Git is the user's: suggest commit messages, run no git command.
- **Roles.** `test-designer` writes only the paths of `[test]` tasks; `implementer` writes production code and treats those paths and `specs/` as read-only. When `implementer` reports a wrong-looking test, ask the user; a confirmed fix goes back to `test-designer`.
- **Gaps stop the run.** The code follows the spec, plan and tasks as approved; when it needs something else, the owner stage updates the document and implement resumes from the first unchecked box. A **spec gap** (behaviour a user would notice that the spec lacks or states differently) goes to `/think-spec:clarify spec`; a **plan gap** (a module, decision, contract, dependency or test layer the plan lacks, or code that cannot follow the plan or an ADR) to `/think-spec:clarify plan`; a **task gap** (a missing, oversized or misordered task, a wrong path or done-when) to `/think-spec:clarify tasks`. Internal names and details the plan leaves open are implementation, never a gap.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys. Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status | check <NNN-short-name>` — specs and their status, `active`; the spec's format.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" check <NNN-short-name>` — the plan's status, `errors`, `warnings`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" check <NNN-short-name>` — the tasks' status, `tasks` (id, phase, heading, done, test, parallel, IDs, path), `nextOpen`, `matrix`, `errors`, `warnings`.

## Steps

### 1. Gate

Run `agent-context.mjs status`, `spec.mjs status`, then `spec.mjs check`, `plan.mjs check` and `tasks.mjs check` on the active spec. Every condition must hold; at the first that fails, say which and its command, and stop:

- AGENTS.md exists with no `missing` / `duplicates` / `invalid` keys — else `/think-spec:init`;
- `active-spec` names a spec — else `/think-spec:specify`;
- the spec is `approved` or `active` (a resumed run) with no `spec.mjs` errors, and no other spec is `active` — else `/think-spec:clarify spec` (a `closed` spec: `/think-spec:maintain`);
- the plan is `approved` with no `plan.mjs` errors — else `/think-spec:clarify plan`;
- the tasks are `approved`, with no `tasks.mjs` errors and no warning that the spec or plan was updated after them — else `/think-spec:clarify tasks` (`/think-spec:tasks` for a stale list);
- `nextOpen` is a task — when it is `null`, everything is done: go to step 6.

Done when every condition holds.

### 2. Activate and load

On an `approved` spec, set `status: active` in its frontmatter (nothing else in the file changes), then `agent-context.mjs set` with `active-spec.text='<id> (active)'`.

Read, in this order: AGENTS.md, `docs/constitution.md` (when it exists), `spec.md`, `plan.md` with its `adr/` files, `tasks.md`, `traceability.md`. Take the **test command** (and lint command) from AGENTS.md, or from the plan's test strategy while AGENTS.md still says "pending".

Done when you can name the test command and, for the first task in scope, its requirements and plan lines.

### 3. Scope

From `$ARGUMENTS`: `T-###` is that task; `T-###..T-###` the open tasks in that range; `phase N` (any language) or `N` the open tasks of phase N in `tasks.mjs`'s numbering; nothing is the phase of `nextOpen`, and on the user's OK at each checkpoint, the next phase. A scope that starts after an open task asks once whether to start at `nextOpen` instead (recommend yes: tasks run in order, tests before their code).

Tell the user the scope in one line: the phase heading and the task IDs.

### 4. Run a phase

For the scope's tasks in this phase, in file order:

1. **Red.** When `[test]` tasks are open, dispatch `think-spec:test-designer` once for all of them, with the prompt in `${CLAUDE_SKILL_DIR}/references/dispatch.md`. On `red`, run the test command: every new test fails for the reason given and every test that passed before still passes. A test listed as `covered` passes instead; accept it only when its task's done-when says the behaviour already exists (a remediation or fix task) and the test asserts the AC it cites, which you open and read. Then check those boxes.
2. **Green.** For each code task, dispatch `think-spec:implementer` with its prompt; `[P]` code tasks next to each other go out together, as separate dispatches in one message. On `done`, run the test command (and lint): the task's tests pass, nothing that passed before fails, and its done-when holds (run the command it names); before the project has any test, the done-when alone is the evidence. Then check its box and say in one line which FR/NFR it covers and the suite result.
3. **Failure** — a `blocked` result, a red suite, or an unmet done-when: leave the box open and stop the run. `[P]` siblings that passed keep their boxes. Show the failure (test names and one-clause reasons, never a full log), then ask one question: retry with a note (re-dispatch with it), or the command that settles the gap.
4. **Issues** on a verified result: the box is checked, and the run stops after that task (through step 5 when it closed the phase, without asking to go on). Show each issue classified by the ground rules as a test issue or a spec, plan or task gap; a gap ends the run at step 6 with its command; a test issue is the user's to confirm before `test-designer` revisits it.

Done when every task of the phase in scope is checked, or the run stopped on a failure or an issue.

### 5. Checkpoint

At the end of a phase:

- **Suite.** Run the full test command once more and show its summary line; say whether the phase's checkpoint line holds, running what it names.
- **Evidence.** In `traceability.md`, each row whose tasks are now all `[x]` gets the evidence cell `<green in the docs language> YYYY-MM-DD — <test command> (<passing>/<total>)`; other rows keep theirs. Set its `updated` today. Run `tasks.mjs check` and fix every error.
- **AGENTS.md.** When a command marked "pending" in the docs language (run, tests, lint/format) or a convention the code now shows has run successfully in this run, list each line before and after; on the user's OK replace only the "pending" wording.
- **Commit.** Suggest a commit message in the code language citing the phase's IDs, e.g. `feat(001): log a session — T-004..T-007 (FR-001, FR-003)`.

Then, when the scope has a next phase, ask whether to go on with it (recommend yes when the suite is green); on yes, back to step 4.

Done when the user has seen the checkpoint and answered, or the scope is finished.

### 6. Record and hand off

Run `tasks.mjs check`. When it shows a task left open, `agent-context.mjs set` with `stage=implement` and `stage.text='implement (<nextOpen>); <next in the docs language>: `/think-spec:implement`'`; when every box is checked, `stage.text='implement; <next>: `/think-spec:validate`'`. A run that ended on a gap names the gap's command as next instead; one that checked no box leaves `stage` as it is.

Report in the docs language, briefly: tasks checked this run with their FR/NFR, the suite summary, evidence rows filled, AGENTS.md lines replaced, the suggested commit messages, and failures or gaps with the command that handles each (never run it). End with the handoff as the final line, `Next` in the docs language. Every box checked:

```
Next: /think-spec:validate
```

Tasks still open: `Next: /think-spec:implement`. A gap: the command that settles it (`/think-spec:clarify spec`, `plan` or `tasks`).
