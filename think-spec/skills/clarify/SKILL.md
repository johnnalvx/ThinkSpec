---
name: clarify
description: think-spec stages 4, 6 and 8 (clarify spec | plan | tasks). Reviews the active spec, its plan or its task list with the doc-reviewer agent, asks up to 5 one-at-a-time questions, writes each answer back into spec.md, plan.md or tasks.md, and moves it from draft to approved on the user's explicit OK. Use when the user wants to clarify, review, resolve open questions in, or approve the spec, the plan or the tasks.
argument-hint: "spec|plan|tasks [model=<model>] [effort=<level>]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*constitution.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*plan.mjs*), PowerShell(node *think-spec*scripts*tasks.mjs*)
---

# think-spec clarify

Find what the active spec, its plan or its task list leaves ambiguous, missing or contradictory, settle it with the user one question at a time, and write every answer back into the artifact. A QA reviewer (the `doc-reviewer` agent) detects; this skill asks and writes; the user decides. The artifact becomes `approved` only on the user's explicit yes.

Arguments: $ARGUMENTS

## Ground rules

- **Language.** Talk, ask and write prose in the first tag of `docs-language`. IDs, tags, frontmatter and the `[CLARIFY` marker stay English.
- **Mode.** The first word of `$ARGUMENTS` is the mode; empty means `spec`. The **artifact** is `specs/<active-spec>/spec.md` in `spec` mode, `specs/<active-spec>/plan.md` (with its `adr/` files) in `plan` mode, and `specs/<active-spec>/tasks.md` (with `traceability.md`, kept in step with it) in `tasks` mode.
- **Scope guard.** This stage edits only the artifact of its mode and the AGENTS.md state keys. Requests for code, other stages or other features go to the report's next actions.
- **Each artifact keeps its level.** In `spec` mode, an answer that names stack, architecture, files or storage goes to the report as a plan note, never into the spec. In `plan` and `tasks` modes, a **spec gap** is a question whose answer a user would notice as behaviour and an AC would test, or that changes a requirement or the out-of-scope section; in `tasks` mode, a **plan gap** is one that needs a module, decision, contract or test layer the plan lacks, or a task that contradicts the plan or an ADR. A gap is never asked here: report it and recommend `/think-spec:clarify spec` or `/think-spec:clarify plan`. A gap of HIGH or MEDIUM severity blocks approval: the artifact stays or returns to `draft` until the upstream artifact is settled and its stage (`/think-spec:plan`, `/think-spec:tasks`) updates this one.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys. Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" status` — `constitution.exists`, `constitution.version`, `staleSpecs`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status | check <NNN-short-name>` — the active spec, its status, and its format `errors`, `warnings`, `counts`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" check <NNN-short-name>` — `plan` and `tasks` modes: `exists`, the plan's status, `uncovered` FR/NFR, `nextAdr`, ADR files, `errors`, `warnings`, `counts`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" check <NNN-short-name>` — `tasks` mode: `exists`, the tasks' status, `counts`, `nextTask`, `matrix` (traceability rows), `errors`, `warnings`.
- **The check** below means `spec.mjs check <id>` in `spec` mode, `plan.mjs check <id>` in `plan` mode and `tasks.mjs check <id>` in `tasks` mode.

## Steps

### 1. Inspect

Run the three `status` commands, `spec.mjs check <active-spec>`, in `plan` and `tasks` modes `plan.mjs check <active-spec>`, and in `tasks` mode `tasks.mjs check <active-spec>`. Done when you know `docs-language`, the active spec and its status, the artifact's status and check result, the constitution version, and whether the spec is in `staleSpecs`.

- No AGENTS.md, or `missing` / `duplicates` / `invalid` non-empty: show them, point to `/think-spec:init`, and stop.
- `active-spec` is `none`: point to `/think-spec:specify` and stop.
- Spec `closed`: the feature is finished; point to `/think-spec:maintain` and stop.
- Spec `active`: implementation is underway, and this run settles what `implement` stopped on; continue, telling the user that `implement` resumes once the artifact is approved again.
- **`spec` mode**, spec `draft`, `approved` or `active`: continue. On `approved` or `active`, tell the user that any change of meaning returns it to `draft` until approved again.
- **`plan` mode**: the spec must be `approved` or `active`; otherwise point to `/think-spec:clarify spec` and stop. No plan (`exists` false): point to `/think-spec:plan` and stop. Plan `draft` or `approved`: continue; on `approved`, the same warning as above.
- **`tasks` mode**: the plan must be `approved` with no `plan.mjs check` errors; otherwise point to `/think-spec:clarify plan` and stop. No tasks (`exists` false): point to `/think-spec:tasks` and stop. Tasks `draft` or `approved`: continue; on `approved`, the same warning as above.

### 2. Review

Dispatch the `think-spec:doc-reviewer` subagent. Pass `model` and `effort` only when `$ARGUMENTS` or the user named them; otherwise it inherits the session's model. The prompt gives:

- the mode (`spec`, `plan` or `tasks`), the artifact path, the spec path in `plan` mode, the spec and plan paths in `tasks` mode, the constitution path (or "none"), and the docs language;
- the `errors` and `warnings` of the check;
- when the spec is stale: its `constitution_version` and the current one, so conflicts with the newer principles are reported.

Done when the numbered findings list is back (or "no findings").

### 3. Queue

Read the artifact and the taxonomy of the mode: `${CLAUDE_SKILL_DIR}/references/spec-taxonomy.md`, `${CLAUDE_SKILL_DIR}/references/plan-taxonomy.md` or `${CLAUDE_SKILL_DIR}/references/tasks-taxonomy.md`. Build an internal queue of at most 5 questions, never shown in advance:

1. every `[CLARIFY` line in the open-questions section;
2. the reviewer's findings by severity (constitution conflicts and contradictions first);
3. taxonomy categories still Partial or Missing.

Merge findings that one answer settles. A finding you can fix without changing meaning (a missing bullet, a tag that plainly mismatches its EARS keywords, an ADR link to an existing file, a traceability row out of step with `tasks.md`) is a format fix: apply it, list it in the report, and ask nothing. A question whose answer would not change a requirement, an AC or a test (`spec`), a module, decision, contract or test (`plan`), or a task, its order, its done-when line or a phase (`tasks`), is dropped. In `plan` and `tasks` modes, a spec or plan gap is reported, never queued. You classify gaps by the definitions in the ground rules; the reviewer's "… in the spec?" or "… in the plan?" is a hint, and a finding the artifact itself can settle (a task rewritten, a test task added) is a question here. Skip questions a pending gap's answer would make moot.

Done when the queue holds only questions whose answer changes the artifact, or is empty. Empty: report "no material ambiguities", show the reviewer's low findings in one line each, and go to step 6.

### 4. Ask and write back

One question per message, in this shape (labels in the docs language):

```
**Question:** <a full question ending in ?> (<ID, ADR or section>)
**Why it matters:** <one sentence: what goes wrong in tests or delivery without it>
**Recommended:** <option> — <one-sentence reason>
| Option | Answer |
|---|---|
| A | … |
| B | … |
```

Two to four options, or a suggested short answer when no options fit; the user can reply with a letter, "yes" for the recommendation, or their own words. An unclear reply gets one follow-up that still counts as the same question.

After each accepted answer, before the next question:

- edit the affected section (where each kind of answer goes is in the mode's taxonomy); replace the statement the answer makes obsolete, never leave two versions. In `spec` mode, a new US, FR, NFR or AC takes its ID from `next` of `spec.mjs check`. In `plan` mode, a new hard-to-reverse decision gets an ADR numbered from `nextAdr` (template shape: frontmatter `id`, `status: accepted`, `date`; context, decision, alternatives, consequences), an answer that refines an accepted ADR without reversing it edits that ADR in place and sets its `date` today, and a reversed one becomes `status: superseded`, never deleted. In `tasks` mode, a new task takes its ID from `nextTask` and keeps the task line format (`[test]`, `[P]`, IDs, path, done-when sub-line), a split task keeps its ID for the first part, a removed ID is never reused, a checked task keeps its `[x]` unless the answer changes what it must do (then `[ ]`), and `traceability.md` is rebuilt from the `matrix` of `tasks.mjs check`: a row whose task IDs are unchanged keeps its evidence cell, any other row gets "pending" in the docs language;
- remove the answered `[CLARIFY` line;
- append one line to the clarifications section, creating it right before the open-questions section (or at the end): `## <Clarifications in the docs language>` then `- YYYY-MM-DD <question> → <answer> (<IDs, ADRs or sections touched>)`; one line per answer, never a session heading;
- set `updated` today; on an `approved` (or `active`) artifact, also set `status: draft`;
- save the file.

Stop when the queue is empty, after 5 questions, or when the user says to stop. Then every question still open, whether the user left it open or it was never asked, and every HIGH or MEDIUM finding not settled (spec and plan gaps excepted: they are reported and block approval in step 6), becomes or stays a `- [CLARIFY: <question>] (<IDs>)` line in the open-questions section, so the artifact cannot be approved until a later round settles it. Merge findings that share an ID or one answer into one line. At most 3 lines: keep the most severe, and list the rest in the report as deferred; the next round's review finds them again.

Done when every asked question is written back, and every open question and unsettled HIGH or MEDIUM finding is a marker or a deferred item.

### 5. Check

Run the check; fix every error, consider every warning, and run it again. A format fix needs no new approval; a fix that changes meaning is shown to the user first. Re-read the edited sections against the self-check of the stage that wrote the artifact:

- `spec`: one EARS behaviour per FR, every FR with a concrete AC, no vague word unquantified, no stack named.
- `plan`: every FR and NFR has a home, nothing adds behaviour, every decision names its rejected alternative, the constitution lines still hold, every `[unwanted]` FR and NFR has a test, no code bodies.
- `tasks`: every FR, NFR and plan structure line has a task, every AC and NFR has a `[test]` task ahead of its code, each task is about 30 minutes with one path and a checkable done-when, nothing adds behaviour or design, the first story phase is usable on its own.

Done when `errors` is empty.

### 6. Approve

- **`plan` or `tasks` mode with a HIGH or MEDIUM spec or plan gap**: no approval this run; an `approved` artifact gets `status: draft` and `updated` today. Show the gaps and go to the stage keys below.
- **An `active` spec this run left unchanged** stays `active`; skip the approval question.
- **No `[CLARIFY` left**: show the counts and any LOW findings left, then ask whether to approve the artifact (recommend yes). On an explicit yes: `status: approved`, `updated` today; on a stale spec or a plan with an older `constitution_version`, also `constitution_version` = the current version (tasks carry none). Run the check again.
- **Markers left**: the artifact stays `draft`; show the markers and offer another round (`/think-spec:clarify <mode>`), which asks them first.

Then `agent-context.mjs set`: in `spec` mode, `active-spec.text='<id> (<status>)'`; in every mode, `stage=clarify-<mode>` with `stage.text='clarify <mode>; <next in the docs language>: `<the handoff command of step 7>`'`, except when `stage` already shows a later stage: then leave the value and set only `stage.text='<the stage it shows>; <next in the docs language>: <this run's handoff command>'`.

Done when the frontmatter status is what the user chose and `agent-context.mjs status` shows the stage.

### 7. Report and hand off

In the docs language, briefly:

- questions asked and answered, sections, IDs and ADRs touched, format fixes applied;
- open or deferred items, and reviewer findings not asked, one line each;
- plan notes (`spec` mode), spec and plan gaps (`plan` and `tasks` modes) and other deferred intents, with the think-spec command that handles them (never run it);
- the artifact's status. When `approved` and no gap is pending, ask whether to go on to the next stage (`plan` after a spec, `tasks` after a plan); recommend yes. On yes, invoke `think-spec:plan` or `think-spec:tasks`. After approved tasks the next stage is `implement`, which only the user starts: the handoff below is the way on.

End with the handoff as the final line, `Next` in the docs language, the first that applies: `/think-spec:clarify spec` when a run found a spec gap; `/think-spec:clarify plan` when a `tasks`-mode run found a plan gap; `/think-spec:plan` after an approved spec; `/think-spec:tasks` after an approved plan; `/think-spec:implement` after approved tasks; otherwise another round of the same mode:

```
Next: /think-spec:clarify spec
```
