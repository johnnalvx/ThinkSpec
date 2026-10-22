---
name: specify
description: think-spec stage 3 (specify). Turns a feature idea into specs/NNN-short-name/spec.md — WHAT and WHY only, with EARS functional requirements, ISO 25010 NFRs and Given/When/Then acceptance criteria — after a few one-at-a-time questions. Use when the user wants to specify, describe or start a new feature, or to update the draft spec.
argument-hint: "[feature description]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*constitution.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*)
---

# think-spec specify

Write the spec of one feature: what it must do and why it is worth doing, never how. The user asked for the feature; the AI drafts the spec after a few questions; the user approves the draft before it is written. `clarify spec` resolves what stays open.

Feature request: $ARGUMENTS

## Ground rules

- **Language.** Talk, ask and write prose, headings, EARS keywords and Gherkin keywords in the first tag of `docs-language`. IDs, tags, frontmatter and the `[CLARIFY` marker stay English.
- **WHAT and WHY.** The spec names behaviours, data the user sees and measurable qualities. Stack, architecture, files, APIs, storage and libraries belong to the plan; a request that names one is recorded as an assumption or a plan note in the report, never as a requirement.
- **Lean.** Only the template's sections; an optional section (non-functional requirements, assumptions, open questions) is dropped when it has no line. One behaviour per FR, one line per item.
- **Scope guard.** This stage writes only `specs/NNN-short-name/spec.md`, rows of `specs/roadmap.md` and the AGENTS.md state keys. Requests for code, plans or tasks are deferred to the report's next actions.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys. Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs" status` — `constitution.exists` and `constitution.version`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status` — `next` number, `specs` with their status, `active`, `inProgress`, `errors`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" check <NNN-short-name>` — the spec's frontmatter, ID and line formats, AC→FR links, FRs without AC, `[CLARIFY` count: `errors`, `warnings`, `counts`.

## Steps

### 1. Inspect

Run the three `status` commands. Done when you know `docs-language`, `active-spec` and its status, `next`, and the constitution version.

- No AGENTS.md, or `missing` / `duplicates` / `invalid` non-empty: show them, point to `/think-spec:init`, and stop.
- `spec.mjs status` `errors` non-empty: show them and ask the user to fix them first.
- **`active-spec` is a spec**: `draft` → offer to update it (recommend yes); on yes this run is an **update** of that spec; on no, explain that a new spec waits until this one is closed or superseded, and stop. `approved` or `active` → explain that it is still in progress, point to `/think-spec:validate` (or `/think-spec:maintain` to replace it), and stop.
- **No constitution** (`constitution.exists` false): recommend `/think-spec:constitution` first; continue only if the user says so, with `constitution_version: none`.

### 2. Sort the input

Split `$ARGUMENTS` and the user's request into the feature to specify and deferred intents (code, a plan, another feature). No feature description: ask for it in one question. On an update, read the current spec and take the requested changes as the input.

**Epic check**: when the feature would need more than about 10 FRs or holds user stories that could ship apart, propose 2–5 parts, one line of scope each, and ask which one to specify now (recommend the one the others depend on). Only that part is written; the others go to its out-of-scope section and to the report. Then offer to keep the parts in `specs/roadmap.md` (recommend yes for 3 or more): create it, or append rows to the existing one, headings in the docs language — a `#` title, one line of intent, and the table `| ID | <Part> | <Intent> | <Scope boundary> | <Depends on> | Spec |`, one row per part, IDs `R1`, `R2`… never reused, the Spec cell `—` until a spec exists.

When the input names a roadmap entry (`R#`), that row's scope boundary bounds the feature.

**Brownfield** (`mode` of `agent-context.mjs status`) with no spec yet: the first spec is a bounded change that can be reviewed on its own and names the existing behaviour it keeps intact (as out-of-scope lines or `[unwanted]` FRs). A request to document the whole existing system is split this way too, unless that inventory is itself the deliverable.

Done when one bounded feature is the input and every other part is a deferred intent.

### 3. Ask

Read AGENTS.md and the constitution. List the gaps the request leaves on scope, errors and edge cases — empty, duplicate, invalid or corrupt input, limits, concurrency, an unavailable dependency, permissions — ranked scope > security and privacy > user experience > details.

Ask the top gaps, **one question per message, at most 5**, each with a recommended answer the user can accept in one word; skip any the request, AGENTS.md or the constitution already answers. A gap you can fill with a reasonable default becomes an assumption instead of a question. A gap the user leaves open becomes a `[CLARIFY: question]` line, at most 3; beyond that, use a default and record it as an assumption.

Done when every gap is answered, assumed or marked.

### 4. Name

Short name: 2–4 lowercase hyphenated words in the docs language, from the feature's key nouns, technical terms kept (`session-logging`, `oauth2-login`). The ID is `<next>-<short-name>`; an update keeps its ID. Done when the ID is set; the user sees it with the draft in step 6.

### 5. Draft

Fill `${CLAUDE_SKILL_DIR}/templates/spec.md`. Read `${CLAUDE_SKILL_DIR}/references/ears.md` and `${CLAUDE_SKILL_DIR}/references/requirements.md` before the first FR; `${CLAUDE_SKILL_DIR}/references/example.md` shows the length and tone.

- Frontmatter: `status: draft`; `constitution_version` = `constitution.version`, or `none`; `created` and `updated` today. When the input says this spec supersedes another (a rewrite from `maintain`), add `supersedes: <that id>` after `constitution_version`. An update keeps `created`, sets `updated` today, keeps existing IDs and takes new ones from `next` of `spec.mjs check <id>`, which counts removed IDs too, so a deleted ID is never reused. The clarifications section, written by `clarify spec`, is kept byte-identical in its place before the open questions.
- Users go on the context section's "Users" line; user stories have no priority: MoSCoW on each FR carries it.
- Each answered edge case is an `[unwanted]` FR with its AC. FRs use `must | should | could`; what is excluded goes to the out-of-scope section.
- Each `[CLARIFY` line goes in the open-questions section with the ID it affects.

Done when every section holds content from the request, the answers or a recorded assumption, and no `{{` remains.

### 6. Self-check, show and wait

Run through this checklist and fix the draft until every item holds:

- no stack, framework, file, API, storage or library is named;
- every FR is one EARS sentence whose keywords match its tag, with one behaviour;
- no vague word (list in `requirements.md`) stands unquantified;
- every FR has at least one AC with concrete values and an observable result, and no AC adds behaviour its FR lacks;
- the edge-case gaps from step 3 are each an `[unwanted]` FR, an assumption or out of scope;
- every NFR is measurable and its category fits;
- every default chosen without the user is an assumption;
- the out-of-scope section names at least one exclusion and contradicts no FR;
- nothing contradicts the constitution or AGENTS.md;
- at most 3 `[CLARIFY` markers.

Show the complete draft with its ID; on an update, show the changed lines. List any checklist item you could not satisfy. Ask for approval; revise and show again until the user approves.

Done when the user has explicitly approved this draft. On an update with nothing approved to change, the file stays byte-identical: go to step 8.

### 7. Write and record

Write `specs/<id>/spec.md` (creating `specs/` and the folder when missing), and the spec's ID in the Spec cell of the roadmap row it comes from (and the roadmap rows offered in step 2). Run `spec.mjs check <id>`; fix every error, consider every warning, and run it again. A format fix needs no new approval; a fix that changes meaning is shown to the user first.

Then `agent-context.mjs set` with `active-spec=<id>` and `active-spec.text='<id> (draft)'`, and `stage=specify` with `stage.text='specify; <next in the docs language>: `/think-spec:clarify spec`'`, except when `stage` already shows a later stage of the same cycle (`clarify-spec` to `implement`): then leave the value and set only `stage.text='<the stage it shows>; <next in the docs language>: <this run's handoff command>'`. `validate`, `maintain` and `finish` end a cycle, so this run writes over them.

Done when `spec.mjs check` shows `errors` empty and `agent-context.mjs status` shows `active-spec` equal to the ID.

### 8. Report and hand off

In the docs language, briefly:

- the spec path and its counts (US, FR, NFR, AC, open questions);
- assumptions made without asking, one line each, and checklist items left unmet;
- **next actions**: the other epic parts and each deferred intent, with the think-spec command that handles it (never run it);
- ask: clarify the spec now? Recommend yes. On yes, invoke the `think-spec:clarify` skill with the argument `spec`. On no, the handoff below is the way back.

End with the handoff as the final line, `Next` in the docs language:

```
Next: /think-spec:clarify spec
```
