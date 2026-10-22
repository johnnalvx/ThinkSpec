---
name: constitution
description: think-spec stage 2 (constitution). Proposes the project's short, versioned list of verifiable principles (stack, quality, tests, limits) in docs/constitution.md, and amends it. Use when the user wants to create, review or amend the project constitution or its principles.
argument-hint: "[number of principles, topics, or guardrail candidates from init]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*constitution.mjs*)
---

# think-spec constitution

Write or amend `docs/constitution.md`: a few short, verifiable principles about the project's stack, quality, tests and limits. The AI proposes, the user approves. It is written once and changes only when something general about the project changes; every spec records the version it was written under.

User input: $ARGUMENTS

## Ground rules

- **Language.** Talk and write prose and headings in the first tag of `docs-language`; frontmatter keys and values stay English.
- **Short.** At most 15 content lines (non-blank lines after the frontmatter, the `#` title excluded). One principle = one line, never wrapped. Propose the number of principles the user or `$ARGUMENTS` gives; otherwise 6.
- **Verifiable.** Each principle can be checked yes/no by reading the code, the tests or the repo. `${CLAUDE_SKILL_DIR}/references/principles-menu.md` defines the test and the topics.
- **Approval gate.** The file is written only after the user explicitly approves the complete draft in chat.
- **Nothing pending in the file.** An undecided topic is asked; if it stays undecided it is left out and reported, and adding it later is a MINOR amendment. The file never holds `[CLARIFY`, `TODO(` or `{{`.
- **Scope guard.** This stage writes only `docs/constitution.md` and the AGENTS.md state keys. Requests for features, code, plans or other files are deferred, never carried out.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" status` — the constitution's frontmatter, content lines, principle count, contract `errors`, and the specs' recorded versions (`staleSpecs`, `unversionedSpecs`).
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — the AGENTS.md state keys. Quote `set` arguments with single quotes (the visible text holds backticks).

## Steps

### 1. Inspect

Run `agent-context.mjs status` and `constitution.mjs status`. Done when you know `docs-language`, `mode`, the `stage` key, whether the constitution exists (**create** or **amend**), its `version` and `errors`, and `staleSpecs`.

- No AGENTS.md, or `missing` / `duplicates` / `invalid` non-empty: show them, point to `/think-spec:init`, and stop.
- **Amend**: read `${CLAUDE_SKILL_DIR}/references/versioning.md` now. Existing `errors` are listed to the user; fixing them goes into the draft.

### 2. Sort the input

Classify each part of `$ARGUMENTS` and of the user's request as constitution content (topics, number of principles, guardrail candidates, amendment requests) or a deferred intent (a feature, code, a plan, anything else). Deferred intents go to the report's next actions. A part that could be either is asked about. Done when every part has a class.

### 3. Gather

Read AGENTS.md (project, stack, conventions, rules) and, on amend, the current constitution. Read `${CLAUDE_SKILL_DIR}/references/principles-menu.md`. **Brownfield**: read `${CLAUDE_SKILL_DIR}/references/brownfield.md` and follow it.

Done when every topic of the coming draft has a fact from evidence or the user, or is an open question for step 4.

### 4. Ask

One question per message, each with a recommended answer the user can accept in one word, only for the open topics (an undecided stack, a data store nobody named). On amend with no concrete change requested, ask what should change. Done when every topic has an answer or is explicitly left undecided.

### 5. Draft and self-check

Fill `${CLAUDE_SKILL_DIR}/templates/constitution.md` (create) or edit the current text (amend); `${CLAUDE_SKILL_DIR}/references/example.md` shows the length and tone. Create: `version: 1.0.0`, `ratified` and `amended` today. Amend: bump and dates per `versioning.md`.

Done when every check passes:

- each principle is verifiable and names a concrete thing; none uses a word the menu lists as vague;
- one rule per principle, one line each;
- nothing contradicts AGENTS.md, and nothing restates think-spec's own workflow rules;
- at most 15 content lines; no `[CLARIFY`, `TODO(` or `{{`;
- amend: unchanged lines stay byte-identical.

### 6. Propose and wait

Create: show the complete file. Amend: show the changed lines (added / changed / removed), the bump type and its reason. Brownfield: add each principle's evidence below the draft, in the message only. Ask for approval; revise and show it again until the user approves.

Done when the user has explicitly approved this draft. On amend, if nothing ends up approved to change, the file stays byte-identical: go to step 8.

### 7. Write and record

Write `docs/constitution.md`, creating `docs/` if needed. Run `constitution.mjs status`; fix anything in `errors` and run it again.

Then `agent-context.mjs set` with `constitution=<version>` and `constitution.text='<version> (docs/constitution.md)'`. Also set `stage=constitution` with `stage.text='constitution; <next in the docs language>: `/think-spec:specify`'`, except when `stage` already shows a later stage: then leave it.

Done when `constitution.mjs status` shows `errors` empty and `agent-context.mjs status` shows `constitution` equal to the new version.

### 8. Report and hand off

In the docs language, briefly:

- create: the version and the number of principles; amend: the impact report from `versioning.md`;
- topics left out as undecided;
- **next actions**: each deferred intent with the think-spec command that handles it (never run it);
- ask: continue with the spec now? Recommend yes. On yes, invoke the `think-spec:specify` skill, passing the user's feature request when there was one among the deferred intents. On no, the handoff below is the way back.

End with the handoff as the final line, `Next` in the docs language. It is `/think-spec:clarify spec` when the active spec is in `staleSpecs`, otherwise:

```
Next: /think-spec:specify
```
