---
name: tasks
description: think-spec stage 7 (tasks). Breaks the approved plan into specs/NNN-short-name/tasks.md — small dependency-ordered tasks grouped by user story, MVP first, each citing its FR/NFR with one path and a verifiable done-when line, test tasks from the AC before the code they cover — plus traceability.md, and approves them on the user's OK. Use when the user wants the task list, a breakdown of the plan into work items, or to update the tasks.
argument-hint: "[notes on scope or ordering] [model=<model>] [effort=<level>]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*plan.mjs*), PowerShell(node *think-spec*scripts*tasks.mjs*)
---

# think-spec tasks

Divide the approved plan into small pieces that each end in something verifiable, then show how the pieces fit together phase by phase. Every task traces to a requirement; every requirement and every module of the plan gets tasks; tests come before the code they cover. The AI proposes the list in chat, the user decides, and the files are written only on the user's explicit yes.

Notes: $ARGUMENTS

## Ground rules

- **Language.** Talk, ask and write prose, headings and the done-when and checkpoint labels in the first tag of `docs-language`. IDs, the `[test]`, `[P]` and `[CLARIFY` tags, frontmatter, paths and code identifiers stay English or as named in the code language.
- **Breakdown, never new design.** Tasks serve the plan and add neither behaviour nor design. A **spec gap** (behaviour a user would notice that the spec lacks) goes to `/think-spec:clarify spec`; a **plan gap** (a task needs a module, decision, contract or test layer the plan lacks, or contradicts the plan or an ADR) goes to `/think-spec:clarify plan`. Rate each gap as `clarify` would: HIGH or MEDIUM when it touches a `must` FR, data loss, security, a missing edge case or a module, decision or contract the tasks cannot do without; LOW otherwise. Collect the gaps you find through step 3; when any is HIGH or MEDIUM, show them all, write nothing, and hand off to the command of the most upstream one. LOW gaps go to the report's next actions and the run continues. Naming a file inside a directory the plan lists, or a function inside a module it lists, is breakdown, not a gap.
- **Task line**, one per task, then its done-when sub-line indented two spaces:

  ```
  - [ ] T-001 [test] [P] (FR-001, AC-001) <description> — <path>
    <Done when>: <a condition a reviewer can check>
  ```

  `[test]` marks a test task, which the `test-designer` agent runs in `implement`; `[P]` marks a task that can run alongside the `[P]` tasks next to it (another file, nothing pending it needs). Every task cites at least one FR or NFR (setup and polish cite what they enable); a test task also cites the AC it covers, when the requirement has any. One path per task, written last: the path is whatever follows the last ` — `.
- **Small.** A task is about 30 minutes of a person's work with one goal and one path; a larger one is split.
- **Scope guard.** This stage writes only `specs/<id>/tasks.md`, `specs/<id>/traceability.md` and the state keys. Code, tests and other stages go to the report's next actions; `implement` is started only by the user.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys. Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status | check <NNN-short-name>` — the active spec, its status and format.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" check <NNN-short-name>` — the plan's status, `errors`, `warnings`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" check <NNN-short-name>` — `exists`, frontmatter, `counts`, `nextTask`, `matrix` (one row per FR/NFR: AC, tasks, test paths), `errors`, `warnings`.

## Steps

### 1. Inspect

Run `agent-context.mjs status`, `spec.mjs status`, then `spec.mjs check`, `plan.mjs check` and `tasks.mjs check` on the active spec. Done when you know `docs-language`, the active spec and its status, the plan's status and warnings, and whether tasks exist and their status.

- No AGENTS.md, or `missing` / `duplicates` / `invalid` non-empty: show them, point to `/think-spec:init`, and stop.
- `active-spec` is `none`: point to `/think-spec:specify` and stop.
- Spec `closed`: the feature is finished; point to `/think-spec:maintain` and stop.
- Spec `active`: implementation is underway; continue as an update, telling the user that `implement` resumes once the tasks are approved again.
- No plan, plan `draft`, or `plan.mjs check` errors: the tasks need an approved plan; point to `/think-spec:clarify plan` (or `/think-spec:plan` when there is none) and stop.
- `plan.mjs` warns that the spec was updated after the plan: point to `/think-spec:plan` to review it first, and stop.
- Tasks exist: this run is an **update**. Take `$ARGUMENTS`, the user's request and any "updated after the tasks" warning as the changes; on `approved` tasks, tell the user that a change of meaning returns them to `draft` until approved again. Checked boxes and their tasks stay as they are.

### 2. Read

Read the spec, the plan, its ADRs, `docs/constitution.md` (when it exists) and AGENTS.md; on an update, also `tasks.md` and `traceability.md`. Done when you can name, for each user story, the FRs it needs, and for each line of the plan's structure, the requirements it serves.

### 3. Map

Propose the phases, in this order:

1. **Setup**: what every later task needs (project skeleton, test runner).
2. **Foundation**: blocking pieces several stories share (storage, shared models, NFR mechanisms).
3. **One phase per user story**: the FRs it serves, its `[unwanted]` FRs with the FR they guard. Order: the story with the most `[must]` FRs first, marked MVP; ties follow the spec's order. When that story is not usable on its own (nothing to see what it did), propose the smallest set of stories that is, and say why in the mapping question. An FR no story serves joins the story it fits best, or the foundation.
4. **Polish**, only when something cross-cutting is left.

The spec does not link FRs to stories, so the story ↔ FR mapping is a proposal: show it, one line per phase, and ask the user to confirm or move FRs (one question). Questions about scope or ordering the plan leaves open are asked one per message, at most 3, each with a recommended answer; a gap found here goes to the gap list (see ground rules). An open point the user leaves becomes a `[CLARIFY: question]` line, at most 3.

Done when the user has confirmed the mapping and every question is answered, marked or a gap.

### 4. Break down

Fill `${CLAUDE_SKILL_DIR}/templates/tasks.md`; `${CLAUDE_SKILL_DIR}/references/example.md` shows the length and tone. Number tasks from `T-001` (on an update, new tasks from `nextTask`; a deleted ID is never reused) in execution order.

- **Inside a story phase**: the `[test]` tasks for its AC first, then models, then services, then the interface. Each AC appears in a `[test]` task; each NFR (except `[wont]`) gets a `[test]` task in the phase where the code it measures is finished, ahead of that code, following the plan's NFR response and test strategy. A test task's done-when says the test exists and fails for the expected reason; a code task's names the AC or test that turns green.
- **Descriptions** name the command, module or data the plan gives (a function name only when the plan or the code has one), and quote data-model constraints verbatim (range, length, format) so nothing is left to implementation.
- **Paths** come from the plan's structure; a task that needs a path the plan lacks is a plan gap.
- **Each phase ends** with one checkpoint line: what works together now. Stories stay independent; a task that needs one from another story or a later phase gets a line in the dependencies section, `- T-012 ← T-004, T-009`. The section exists only when it has a line.
- **Frontmatter**: `status: draft` (step 6 writes the final status), `created` and `updated` today. An update keeps `created`, sets `updated` today, and keeps the clarifications section (written by `clarify tasks`) byte-identical.

`traceability.md` is not drafted here: step 6 derives it from the written list.

Done when every phase holds tasks from the mapping, every task has its done-when line, and no `{{` remains.

### 5. Self-check, show and wait

Fix the draft until every item holds:

- every FR and NFR except `[wont]` has a task, and every line of the plan's structure has a task;
- every AC and every NFR has a `[test]` task, ahead of the code that covers it in its phase;
- each task is about 30 minutes, one goal, one path, and its done-when is checkable;
- `[P]` tasks next to each other touch different paths and need nothing pending;
- nothing adds behaviour the spec lacks or design the plan lacks;
- the first story phase delivers something usable on its own;
- at most 3 `[CLARIFY` markers; more than about 40 tasks means the spec should be split: recommend `/think-spec:maintain` in the report.

Show the complete task list in chat (on an update, the changed lines). List any item you could not satisfy. Ask for approval; revise and show again until the user approves.

Done when the user has explicitly approved this list. On an update with nothing approved to change, the files stay byte-identical: go to step 7.

### 6. Write and record

Write `tasks.md` with `status: approved` when no `[CLARIFY` is left (with markers, `draft`, and tell the user `clarify tasks` must settle them before `implement`), then run `tasks.mjs check <id>`: on a first run its one expected error is the missing `traceability.md`. Write `traceability.md` from `${CLAUDE_SKILL_DIR}/templates/traceability.md` and the `matrix`: one row per entry, its AC, tasks and test paths, the evidence cell "pending" in the docs language (`implement` and `validate` fill it); on an update, rows whose tasks did not change keep their evidence cells. Run the check again; fix every error, consider every warning, and repeat. A format fix needs no new approval; a fix that changes meaning is shown to the user first.

Then `agent-context.mjs set` with `stage=tasks` and `stage.text='tasks; <next in the docs language>: `/think-spec:implement`'` (`/think-spec:clarify tasks` when markers are left), except when `stage` already shows a later stage (`clarify-tasks` or beyond): then leave the value and set only `stage.text='<the stage it shows>; <next in the docs language>: <this run's handoff command>'`.

Done when `tasks.mjs check` shows `errors` empty and `agent-context.mjs status` shows the stage.

### 7. Report and hand off

In the docs language, briefly:

- the paths, the status and counts (tasks, test tasks, FR/NFR and AC covered, phases, open questions); the MVP phase;
- checklist items left unmet and warnings kept;
- **next actions**: spec and plan gaps, deferred intents, a recommended split, with the think-spec command that handles each (never run it);
- approved tasks: ask whether to review them with `clarify tasks` first (optional; recommend it for more than about 20 tasks); on yes, invoke `think-spec:clarify` with the argument `tasks`. With markers left: clarify now? Recommend yes; on yes, invoke `think-spec:clarify` with the argument `tasks`. `implement` is the user's to start.

End with the handoff as the final line, `Next` and `optional` in the docs language. Approved tasks:

```
Next: /think-spec:clarify tasks (optional) or /think-spec:implement
```

Tasks with markers: `Next: /think-spec:clarify tasks`. A gap found: `Next: /think-spec:clarify spec` or `Next: /think-spec:clarify plan`.
