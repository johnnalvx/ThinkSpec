---
name: plan
description: think-spec stage 5 (plan). Turns the approved spec into specs/NNN-short-name/plan.md — the HOW, with technical context, constitution check, module structure with the FR/NFR each module serves, optional data model, algorithms and interface contract, decisions with the rejected alternative (ADR files for the hard-to-reverse ones), test strategy — and approves it on the user's OK. Use when the user wants to plan, design or decide the technical approach for the approved spec, or to update its plan.
argument-hint: "[technical notes or preferences] [model=<model>] [effort=<level>]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*constitution.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*plan.mjs*)
---

# think-spec plan

Design how the active spec gets built. The spec says WHAT and WHY; the plan says HOW, so that `tasks` can break it down and every requirement has a home in the design. The AI proposes, the user decides: technical unknowns are asked, the draft is shown, and the plan becomes `approved` only on the user's explicit yes.

Technical notes: $ARGUMENTS

## Ground rules

- **Language.** Talk, ask and write prose and headings in the first tag of `docs-language`. IDs, tags, frontmatter, file paths, code identifiers and the `[CLARIFY` marker stay English or as named in the code language.
- **HOW, never a new WHAT.** The plan serves the spec's requirements and adds no behaviour. A **spec gap** is a question whose answer a user would notice as behaviour and an AC would test (what happens to input the spec does not cover, a new message or result), or that changes a requirement or the out-of-scope section. Collect the spec gaps you find through step 3; when there is any, show them all, write nothing, and hand off to `/think-spec:clarify spec`, which returns the spec to `draft`. Choices the user only sees as form (command names, file locations, formats the spec leaves open) are design decisions. The plan never edits `spec.md`.
- **No code.** Paths, responsibilities, data shapes, pseudocode and contracts; function bodies, migrations and test code belong to `implement`.
- **Testable design.** Clock, randomness, network and file system reach the logic as parameters or adapters, so every AC can be tested without mocks of the environment.
- **Lean.** Only the template's sections; an optional section (data model, key algorithms, interface contract, NFR response, open questions) is dropped when it has nothing to say. One line per module, decision or test layer.
- **Scope guard.** This stage writes only `specs/<id>/plan.md`, `specs/<id>/adr/`, the "pending" lines of AGENTS.md (with approval) and the state keys. Requests for code or tasks go to the report's next actions.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys. Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" status` — `constitution.exists`, `constitution.version`, `staleSpecs`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status | check <NNN-short-name>` — the active spec, its status and format.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" check <NNN-short-name>` — `exists`, the plan's frontmatter, `uncovered` FR/NFR IDs, `nextAdr`, the ADR files, `[CLARIFY` count, `errors`, `warnings`.

## Steps

### 1. Inspect

Run the three `status` commands, `spec.mjs check <active-spec>` and `plan.mjs check <active-spec>`. Done when you know `docs-language`, the spec named by the `active-spec` key and its frontmatter status, whether a plan exists (`exists`) and its status, the constitution version, and whether the spec is in `staleSpecs`.

- No AGENTS.md, or `missing` / `duplicates` / `invalid` non-empty: show them, point to `/think-spec:init`, and stop.
- `active-spec` is `none`: point to `/think-spec:specify` and stop.
- Spec `draft`, or `spec.mjs check` errors: the plan needs an approved spec; point to `/think-spec:clarify spec` and stop.
- Spec `closed`: the feature is finished; point to `/think-spec:maintain` and stop.
- Spec `active`: implementation is underway; treat it as `approved` (this run settles what `implement` stopped on), and tell the user that `implement` resumes once the plan and tasks are approved again.
- Spec `approved` (or `active`) and in `staleSpecs`: the constitution changed after approval; recommend `/think-spec:clarify spec` first, and continue only if the user says so.
- Plan exists: this run is an **update**; a warning that the spec was updated after the plan means every changed requirement is reviewed in this run. Take `$ARGUMENTS` and the user's request as the changes; on an `approved` plan, tell the user that a change of meaning returns it to `draft` until approved again.

### 2. Survey

Read the spec, `docs/constitution.md` (when it exists), AGENTS.md and, on an update, the plan and its ADRs.

**Brownfield** (the project has source code beyond think-spec files): dispatch the built-in `Explore` agent with the spec path and this return shape, at most 40 lines: modules and files the feature touches, patterns and conventions to follow, the real test and lint commands, risks (shared state, missing tests, fragile areas). Greenfield: nothing to survey.

Done when you can name the modules the feature touches, or that it starts from nothing.

### 3. Ask

List the technical unknowns the spec, the constitution, AGENTS.md, the survey and `$ARGUMENTS` leave open: language and version, dependencies, storage, testing tool, platform, and any choice with two or more reasonable options that is hard to reverse. Rank them: constitution conflicts > data and security > what blocks the structure > details.

Ask the top ones, **one question per message, at most 5**, each with a recommended option and a one-sentence reason the user can accept in one word. A choice with an obvious default from the constitution or the existing code is a decision line, not a question. An unknown the user leaves open becomes a `[CLARIFY: question]` line, at most 3.

Then run the **constitution check**: one line per principle, `complies — how` or `exception — why it is needed — simpler alternative rejected because …`. An exception needs the user's explicit OK; without it, redesign or ask.

Done when every unknown is answered, decided by default, or marked, and every principle has its line.

### 4. Design

Fill `${CLAUDE_SKILL_DIR}/templates/plan.md`; `${CLAUDE_SKILL_DIR}/references/example.md` shows the length and tone.

- **Structure**: one line per file or module, `path → responsibility (FR-###, NFR-###)`. Every FR and NFR of the spec except `[wont]` appears at least once in the plan; modules follow the existing code's layout in brownfield. Cite IDs one by one (`FR-001, FR-002`), never as a range: the script counts only the IDs written.
- **Data model**, **key algorithms** (numbered pseudocode headed by its FR) and **interface contract**: only when the feature has data, non-trivial logic or an external interface. With an external interface (CLI, API, events, file format), read `${CLAUDE_SKILL_DIR}/references/contracts.md` first.
- **NFR response**: `NFR-### → how the design meets it → how it is verified`, one line each.
- **Decisions**: one line each, `decision — instead of <alternative> — because <reason> (FR or principle)`. A decision that is hard to reverse (architecture, storage, an external dependency, an interface other programs or scripts depend on) also gets `adr/ADR-NNN-short-title.md` from `${CLAUDE_SKILL_DIR}/templates/adr.md`, numbered from `nextAdr`, and its line ends with `[ADR-NNN]`. On an update, a reversed ADR becomes `status: superseded` and the new one says which it replaces; an ADR is never deleted.
- **Test strategy**: one line per layer, with its tool and the AC or FR it covers; every `[unwanted]` FR and every NFR has a test somewhere.
- When two or more designs are viable and the user wants them compared, dispatch the built-in `Plan` agent with the spec path, the constraints and the options, asking for a comparison in at most 40 lines; the choice goes to the user as a question.
- Frontmatter: `status: draft` (step 6 writes the final status), `constitution_version` = the current version or `none`, `created` and `updated` today. An update keeps `created`, sets `updated` today, and keeps the clarifications section (written by `clarify plan`) byte-identical.

Done when every section holds content from the spec, the answers, the survey or a recorded decision, and no `{{` remains.

### 5. Self-check, show and wait

Run through this checklist and fix the draft until every item holds:

- every FR and NFR has a home, and every ID cited exists in the spec;
- nothing adds or changes behaviour the spec lacks;
- the constitution check, redone against the finished design, still holds;
- every decision names the alternative it rejected; every hard-to-reverse one has an ADR;
- logic depends on no clock, randomness or I/O it cannot receive as a parameter;
- every `[unwanted]` FR and every NFR is covered by the test strategy;
- no code bodies; at most 3 `[CLARIFY` markers.

Show the complete draft and any ADRs; on an update, the changed lines. List any item you could not satisfy. Ask for approval; revise and show again until the user approves.

Done when the user has explicitly approved this draft. On an update with nothing approved to change, the files stay byte-identical: go to step 7.

### 6. Write and record

Write `plan.md` and the ADR files, with `status: approved` when no `[CLARIFY` is left; with markers, `draft`, and tell the user `clarify plan` must settle them before `tasks`. Run `plan.mjs check <id>`; fix every error, consider every warning, and run it again. A format fix needs no new approval; a fix that changes meaning is shown to the user first.

**AGENTS.md**: list the lines still marked "pending" (in the docs language) that the plan now settles — architecture and technologies in the project section, run, test and lint commands, language version and conventions — showing each line before and after. On the user's OK, replace only the "pending" wording on those lines (the whole line when it holds nothing else); every other line stays byte-identical.

Then `agent-context.mjs set` with `stage=plan` and `stage.text='plan; <next in the docs language>: `/think-spec:tasks`'` (`/think-spec:clarify plan` when markers are left), except when `stage` already shows a later stage (`tasks` or beyond): then leave the value and set only `stage.text='<the stage it shows>; <next in the docs language>: <this run's handoff command>'`.

Done when `plan.mjs check` shows `errors` empty and `agent-context.mjs status` shows the stage.

### 7. Report and hand off

In the docs language, briefly:

- the plan path, its status and counts (FR and NFR covered, ADRs, open questions); ADR files written;
- AGENTS.md lines replaced, and checklist items left unmet;
- **next actions**: spec gaps found, deferred intents, with the think-spec command that handles each (never run it);
- ask what comes next. Approved plan: tasks now (recommended) or a second review with `clarify plan` first; on the choice, invoke `think-spec:clarify` with the argument `plan`, or the `think-spec:tasks` skill. With markers left: clarify the plan now? Recommend yes; on yes, invoke `think-spec:clarify` with the argument `plan`. Otherwise the handoff below is the way on.

End with the handoff as the final line, `Next` in the docs language. Approved plan:

```
Next: /think-spec:clarify plan (optional) or /think-spec:tasks
```

Plan with markers: `Next: /think-spec:clarify plan`.
