---
name: maintain
description: think-spec stage 11 — take a living project to its next piece of work (a new feature, a change, a rewrite or a bug in a closed spec, or dropping a spec in progress), always spec first, never code.
argument-hint: "[what you want: a new feature, a change to NNN, a bug in NNN, drop NNN, roadmap]"
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*constitution.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*tasks.mjs*), PowerShell(node *think-spec*scripts*validate.mjs*)
---

# think-spec maintain

Route the next piece of work on a living project into the workflow, **spec first**: the spec changes before any code does, and the stage that owns each document writes it. This skill reviews the project, asks which path the work takes, prepares the specs' status for it and hands off. It never writes code, tests or spec text.

Request: $ARGUMENTS

## Ground rules

- **Language.** Talk and write task text and roadmap prose in the first tag of `docs-language`. IDs, tags, status values and paths stay English.
- **One truth per feature.** A change or extension of a feature reopens its spec; a new capability gets a new spec; a rewrite gets a new spec that supersedes the old one whole. The constitution and AGENTS.md change only when something general about the project changes (`/think-spec:constitution`, `/think-spec:init`).
- **Ownership.** This skill writes the `status` line of `spec.md` (nothing else in it); in `tasks.md` an appended fix phase and `updated`; in `traceability.md` the Tasks column and evidence cells of the rows a fix task joins, and `updated`; `specs/roadmap.md`; AGENTS.md "pending" lines on the user's OK; the state keys. Every other line stays byte-identical. Code, tests, the constitution and git belong to others.
- **Questions** one per message, each with a recommended answer the user can accept in one word.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys. Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" status` — the constitution version, `staleSpecs`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status | check <NNN-short-name>` — specs with `status` and `supersedes`, `next`; one spec's format.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" check <NNN-short-name>` — `tasks`, `nextTask`, `matrix`, `errors`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" check` — every artifact of the project: `ok`, `errors`, `warnings`, `specs`.

## Steps

### 1. Review

Run `agent-context.mjs status`, `spec.mjs status`, `constitution.mjs status` and `validate.mjs check`. No AGENTS.md, or `missing` / `duplicates` / `invalid` keys: point to `/think-spec:init` and stop. Otherwise show one compact review, a line per item that has something:

- **State**: the active spec and its status; any spec `draft`, `approved` or `active`.
- **Artifacts**: `validate.mjs` errors and warnings, by file. They block only the path that touches their spec.
- **Stale specs** (`staleSpecs`): offer `/think-spec:clarify spec` for each, or a `/think-spec:constitution` amendment when the principle is what changed.
- **Pending**: AGENTS.md lines that still say "pending" although the plan or the code now settles them; offer each with its line before and after, written on the user's OK.
- **Candidates**: deferred parts in the out-of-scope sections of closed specs, LOW findings in their `validation.md`, roadmap entries without a spec whose dependencies are closed.
- **Orphans**: a `superseded` spec with a passing `validation.md` that no spec names in `supersedes` — a rewrite whose new spec was never written; offer to restore it to `closed`.
- **Handoff**: when `specs/handoff.md` exists, say it describes the project at its `finished` date and the next `/think-spec:finish` rewrites it.

Done when the user has seen the review and answered each offer.

### 2. Choose the path

Ask one question, recommending the path `$ARGUMENTS` points to:

- A spec is `draft`, `approved` or `active`: **continue** it (name its next command and stop) or **drop** it (step 3e).
- Otherwise: **new feature** (3a), **change** to a closed spec (3b), **rewrite** of a closed spec (3c), **bug** in a closed spec (3d), or **nothing left** (`/think-spec:finish`). The roadmap (step 4) is offered alongside any of them.

Sort a request that fits two paths by what it contradicts: the code breaks an AC the spec already has → bug; the spec lacks or states differently the behaviour wanted → change; a change that replaces most of a spec's FRs or user stories → rewrite.

### 3a. New feature

When the request already names the behaviour and who it is for, skip to the summary. Otherwise offer a short intake, at most 3 questions: what problem it solves and for whom; what happens if it is never built; what speaks against it (evidence, an existing feature that covers it). Propose a verdict — **go**, **needs clarification** (name what is missing) or **drop** (state the reason) — and let the user decide. Drop and needs clarification write nothing.

Done when the user chose go and you can state the feature in a few lines: problem, users, in and out of scope, open questions. With a roadmap, name the entry it comes from.

### 3b. Change

Pick the closed spec (from `$ARGUMENTS`, or ask with the list). Confirm the change is not a rewrite. Set its `status: draft` (that line only) and `agent-context.mjs set` with `active-spec=<id>` and `active-spec.text='<id> (draft)'`. Its `validation.md` stays until `validate` rewrites it.

When only the plan is out of date (the spec still says what the code does, as a `finish` audit may report), set `status: active` instead, with `active-spec.text='<id> (active)'`: `plan`, `tasks` and `implement` update an active spec in place, and `validate` closes it again. The next command is `/think-spec:plan`.

Done when `spec.mjs status` shows the spec reopened (`draft`, or `active` for a plan-only change) and `active-spec` names it; the change itself is written by `specify` (step 5), or by `plan`.

### 3c. Rewrite

Pick the closed spec it replaces. Set its `status: superseded` (that line only). The new spec carries `supersedes: <old id>` in its frontmatter and restates whatever of the old behaviour stays.

Done when the old spec is `superseded`; `specify` writes the new one (step 5).

### 3d. Bug

Pick the closed spec. Gather in chat the symptom, the expected behaviour, the steps to reproduce and the AC it breaks; ask for what is missing, one question at a time, and invent no step. No AC states the expected behaviour: it is a change (3b). Read the plan's structure, the traceability rows of the broken FR and the code they name to locate the suspected path.

Propose a fix phase in chat, after the last phase of `tasks.md` (before its dependencies, clarifications and open questions sections): heading `<Phase> N — <Fix>: <bug in a few words>` in the docs language, ending in its checkpoint line. From `nextTask` on, first a `[test]` task citing the FR and the AC whose done-when is that the test reproduces the bug and fails on the current code, then the code task with its one path; normal task line format.

On the user's OK — which approves the new tasks, so `tasks.md` stays `approved` — append the phase and set its `updated` to today; in `traceability.md`, add the task IDs to their rows, set those evidence cells to "pending" (docs language) and set `updated`. Run `tasks.mjs check <id>` and fix every error. Then set the spec's `status: active` and `agent-context.mjs set` with `active-spec=<id>` and `active-spec.text='<id> (active)'`.

Done when `tasks.mjs check` has no errors and `nextOpen` is the reproducing test.

### 3e. Drop

Show what dropping means and ask for explicit confirmation (recommend no when the spec is `active`). On yes:

- a spec reopened by a change or a bug (it has a passing `validation.md`) goes back to `closed` when it is as it was at closing: `updated` not after `validated` and every task checked. Otherwise ask the user to revert the spec text or the fix phase first (git), and run maintain again;
- any other spec becomes `superseded`; when it names a spec in `supersedes`, that spec goes back to `closed`;
- for an `active` spec, list the paths of its checked tasks: code and tests already written stay untouched, for the user to keep or remove.

Then `agent-context.mjs set` with `active-spec=none` and `active-spec.text='<none in the docs language>'`.

Done when `spec.mjs status` shows no spec in progress.

### 4. Roadmap (optional)

Offered when the user plans several features ahead, or a roadmap exists. Created only on the user's request from `${CLAUDE_SKILL_DIR}/templates/roadmap.md`: one row per part, `R1`, `R2`… (an ID is never reused), intent, scope boundary, dependencies, and the spec ID once one exists. A row's status is its spec's status; no spec yet means planned. Recommend the first row without a spec whose dependencies are `closed`; `specify` writes the spec ID into the row it specifies.

### 5. Hand off

Run `validate.mjs check` and fix every error in the files this run wrote. Then `agent-context.mjs set` with `stage=maintain` and `stage.text='maintain; <next in the docs language>: <command>'`.

Report briefly in the docs language: the path taken, the statuses changed, the files written. Paths that lead to a spec (new feature, change, rewrite): ask whether to specify now (recommend yes); on yes, invoke the `think-spec:specify` skill with the summary as its argument — the change to make (3b), or the new feature with `supersedes: <old id>` and what of the old spec stays (3c), or the roadmap entry it comes from. End with the handoff as the final line, `Next` in the docs language:

```
Next: /think-spec:specify
```

`/think-spec:implement` after a bug; `/think-spec:plan` after a plan-only change; `/think-spec:finish` when nothing is left; `/think-spec:maintain` after a drop or a verdict other than go.
