# think-spec conventions

The shared contract for everyone building a think-spec skill or agent. Each stage is built separately; anything two stages must agree on lives here and only here.

Everything here is approved by the project owner (2026-10-16, last revised 2026-10-18). A new shared choice is added only after the user approves it; until then tag it **[Proposal]** and ask before relying on it.

**Revisions.** These conventions are the current agreement, not a freeze. The rules for an artifact (spec, plan, tasks, constitution, …) are settled for good when the stage that writes it is built: that session may revise any of them with the user. A revision is complete only when every file it affects has been reviewed and updated: this file, templates, `scripts/`, skills and agents already built, and the shared notes. List those files to the user before closing the session.

## Workflow

One skill per stage, run as `/think-spec:<skill>`:

| # | Skill | `stage` value | Writes |
|---|---|---|---|
| 1 | `init` | `init` | `AGENTS.md`, the `@AGENTS.md` import in `CLAUDE.md` |
| 2 | `constitution` | `constitution` | `docs/constitution.md` |
| 3 | `specify` | `specify` | `specs/NNN-short-name/spec.md` |
| 4 | `clarify spec` | `clarify-spec` | updates `spec.md` |
| 5 | `plan` | `plan` | `plan.md`, `adr/` |
| 6 | `clarify plan` (optional) | `clarify-plan` | updates `plan.md`, `adr/` |
| 7 | `tasks` | `tasks` | `tasks.md`, `traceability.md` |
| 8 | `clarify tasks` (optional) | `clarify-tasks` | updates `tasks.md`, `traceability.md` |
| 9 | `implement` | `implement` | code, tests, traceability evidence |
| 10 | `validate` | `validate` | `validation.md`, spec status |
| 11 | `maintain` | `maintain` | routes the next work (back to 3, or a fix phase to 9); spec status, `specs/roadmap.md` |
| 12 | `finish` | `finish` | `specs/handoff.md` |

`clarify` is one skill taking `spec | plan | tasks` as its argument (empty = `spec`).

## Plugin layout

```
.claude-plugin/plugin.json      name, version (the think-spec version), description, author
skills/<name>/SKILL.md          one per stage
skills/<name>/templates/        artifact templates the skill fills
skills/<name>/references/       material only some branches of the skill need
skills/<name>/scripts/          zero-dependency Node >= 18 .mjs used only by that skill
scripts/                        zero-dependency Node >= 18 .mjs shared by several skills
agents/<name>.md                subagents (roster below)
hooks/hooks.json                the optional validation hook (see "Hook")
```

- **Self-contained skills**: at runtime a skill reads its own folder, the shared `scripts/`, the plugin manifest and the user's project, never another skill's files. Reference bundled files as `${CLAUDE_SKILL_DIR}/...` and shared scripts as `${CLAUDE_PLUGIN_ROOT}/scripts/...`; quote the path (it may contain spaces).
- **Scripts** do deterministic plumbing (find, parse, validate, rewrite) and print JSON; judgment stays in `SKILL.md`. Exit non-zero with a one-line stderr message on failure. Never write outside the project root.

## SKILL.md

Frontmatter keys used: `name` (matches the folder), `description`, `argument-hint`, optional `allowed-tools`.

- **`allowed-tools`** lists each shared script the skill runs twice, once per shell: `Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/<script>.mjs" *)` and `PowerShell(node *think-spec*scripts*<script>.mjs*)` (Claude Code substitutes the variable only in Bash rules, and a Bash rule does not cover the PowerShell tool, Windows' main shell). The grant lasts only the turn that invokes the skill; `init` offers the project allow rules `Bash(node *think-spec*scripts*.mjs*)` and `PowerShell(node *think-spec*scripts*.mjs*)` in `.claude/settings.json` so the script calls of later turns run without a prompt.

Invocation is mixed:

- **Chainable** (document-only): `init`, `constitution`, `specify`, `clarify`, `plan`, `tasks`. No `disable-model-invocation`; the `description` is model-facing (what the stage does, then "Use when …" triggers). At the end of a run, when the user says yes to continuing, the skill invokes the next stage itself.
- **User-only**: `implement`, `validate`, `maintain`, `finish`. `disable-model-invocation: true`; one human-facing `description` line. A chainable stage whose next stage is user-only ends with the handoff line and stops.

Body rules every stage follows:

- **English prompt, project-language output.** Talk to the user and write artifact prose in the first tag of `docs-language`. Machine-readable parts stay English (see Language policy).
- **Questions**: one per message, each with a recommended answer the user can accept in one word, and only what evidence (files, state keys, `$ARGUMENTS`) cannot answer. Decisions that shape the project belong to the user: propose, never settle them silently.
- **User content is the user's.** Edit artifacts the stage owns; touch anything else only with explicit approval.
- **Idempotent re-runs.** Running a stage again updates what is stale or missing and leaves current content byte-identical.
- **Subagents** cannot ask the user questions (Claude Code removes `AskUserQuestion` from them), so every dialogue stays in the skill. think-spec agents are never given the `Agent` tool, so they spawn nothing. Each dispatch prompt states the return shape and asks for a compact result; long findings go to a file whose path is returned. Cap: about 40 lines.
- **Built-in agents first.** Use `Explore` for read-only code surveys and `Plan` for design exploration; create a think-spec agent only for a role neither covers.
- **Handoff.** The final line of every run is `Next: /think-spec:<skill> …` ("Next" in the docs language; the command verbatim).
- Out of scope for every skill: git branches (the user owns git) and Spec-Kit extension-hook boilerplate (`before_*` / `after_*`).

## Files generated in user projects

```
AGENTS.md                         main agent document, source of truth (docs language)
CLAUDE.md                         the line @AGENTS.md (plus content the user chose to keep there)
.claude/settings.json             the two think-spec allow rules, when the user accepts them in init
docs/constitution.md
specs/NNN-short-name/spec.md
specs/NNN-short-name/plan.md
specs/NNN-short-name/adr/ADR-NNN-short-title.md
specs/NNN-short-name/tasks.md
specs/NNN-short-name/traceability.md
specs/NNN-short-name/validation.md
specs/roadmap.md                  optional, written by maintain and specify
specs/handoff.md                  written by finish
```

- `NNN` is a zero-padded sequence across `specs/`. `short-name` is 2–4 lowercase hyphenated words in the docs language (`001-book-catalog`).
- Closed specs stay in place: their status changes, their files never move.

## AGENTS.md

Sections, in order, headings in the docs language: **Project** (what it is, architecture, technologies, 2–3 sentences), **Commands** (run, tests, lint/format), **Style and conventions** (language version, naming, languages per area), **Rules** (read the constitution and active spec first; limits; the think-spec state lines), **When you finish any task** (mandatory verification). Template: `skills/init/templates/agents.md`.

- Short and to the point, no fixed line limit: only what an agent cannot find out by itself.
- A fact nobody knows yet is written as "pending; defined in the plan", and its section stays.
- `plan` and `implement` replace "pending" commands and conventions once they are decided, showing each line before and after and writing only on the user's OK.

## State keys

think-spec state lives in hidden comments at the end of normal AGENTS.md lines: `<!-- ts:<key> <value> -->`. The comment holds a language-neutral value; the visible text before it is in the docs language. No block markers. Each key appears exactly once; a line may carry several keys.

```markdown
# AGENTS.md — habits-cli
<!-- ts:version 0.1.0 -->
…
## Style and conventions
- **In English:** identifiers, comments, test names and commits. <!-- ts:code-language en -->
- **In English:** documentation, constitution, specs and plans. <!-- ts:docs-language en -->
- **Interface:** English. <!-- ts:ui-language en -->
…
## Rules
- **Active spec:** none <!-- ts:active-spec none -->
- **Current stage:** init; next: `/think-spec:constitution` <!-- ts:stage init -->
- **Constitution:** pending <!-- ts:constitution none -->
```

| Key | Value | Written by |
|---|---|---|
| `version` | think-spec version (`plugin.json`) | any stage that writes keys |
| `code-language` | BCP 47 tags, comma-separated: identifiers, comments, tests, commits | `init` (changed on user request) |
| `docs-language` | BCP 47 tags: documentation, constitution, specs, plans; the **first tag** is the conversation and artifact language | `init` (changed on user request) |
| `ui-language` | BCP 47 tags; line present only when the project has a UI | `init` (changed on user request) |
| `stage` | the stage value of the stage just completed; visible text adds the next command | every stage, at the end of a successful run |
| `active-spec` | `NNN-short-name` or `none` | `specify` and `maintain` (reopening a spec) set it; `validate` / `maintain` reset it |
| `constitution` | semver of `docs/constitution.md`, or `none` | `constitution` |

- `active-spec` is the spec moving through the workflow, from `specify` until `validate` closes it, whatever its status (`draft`, `approved` or `active`).
- A stage leaves the `stage` value alone when it already shows a later stage of the same cycle (`specify` … `implement`). `specify`, `clarify`, `plan` and `tasks` then still set `stage.text` to `<that stage>; <next>: <their own handoff>`, so after a gap `implement` stopped on, the visible next step is never one already done. `validate`, `maintain` and `finish` end a cycle, so the stage that starts the next one writes over them.
- Every skill reads and writes keys through the shared `scripts/agent-context.mjs`: `status`, `scaffold`, `set key=value [key.text=<visible text>]`.
- Missing, duplicated or invalid keys are reported to the user, never auto-repaired.

## Language policy

- Plugin files (skills, agents, template instructions, scripts) are English.
- Conversation and artifact prose use the first tag of `docs-language`; before `init` sets it, the language the user writes in.
- English and language-neutral, always: IDs, frontmatter keys and values, EARS type tags, MoSCoW tags, status values, state keys and values, the `[CLARIFY` marker, file and folder names.
- Artifact headings are translated into the docs language.
- EARS keywords are written in capitals in the docs language (`WHEN … THE SYSTEM SHALL` for `en`; `CUANDO … EL SISTEMA DEBERÁ` for `es`); the table lives in `skills/specify/references/ears.md`.
- Acceptance-criterion keywords use the official Gherkin keywords of the docs language (`Dado` / `Cuando` / `Entonces` for `es`; `Given` / `When` / `Then` for `en`).

## IDs and line formats

IDs are numbered per spec and zero-padded to 3: `US-###` user story, `FR-###` functional requirement, `NFR-###` non-functional requirement (ISO 25010 category), `AC-###` acceptance criterion (Given/When/Then, linked to an FR), `T-###` task (lists the FR/NFR it satisfies), `ADR-###`, `CHK-###` checklist item.

- US, FR, NFR and AC lines are Markdown bullets (`- FR-001 …`), one item per line.
- User story line: `- US-001 <As a … I want … so that …, in the docs language>`. No priority: MoSCoW on each FR carries it.
- Requirement line: `- FR-001 [event] [must] <EARS sentence in the docs language>`.
- **EARS tags**: `ubiquitous | event | state | unwanted | optional | complex`.
- **MoSCoW tags**: `must | should | could | wont`. `wont` is reserved: a spec writes exclusions in its out-of-scope section.
- `[CLARIFY: <question>]` marks an open question in any artifact.
- Dates are `YYYY-MM-DD`.
- NFR line: `- NFR-001 [performance-efficiency] [should] <sentence>`, with ISO 25010:2023 tags `functional-suitability | performance-efficiency | compatibility | interaction-capability | reliability | security | maintainability | flexibility | safety`.
- AC line: `- AC-001 (FR-001) Dado … Cuando … Entonces …` (Gherkin keywords of the docs language). Every FR has at least one AC.
- Task line: `- [ ] T-001 [test] [P] (FR-001, AC-001) <description> — <path>`, then a done-when sub-line indented two spaces (`  Done when: …`, label in the docs language). `[test]` = test task, `[P]` = parallelizable, both optional; the parentheses hold at least one FR or NFR, plus the AC a test task covers. Details in "Tasks".
- Checklist line: `- [ ] CHK-001 <item>`. ADR file: `adr/ADR-001-short-title.md`. A deleted ID is never reused: new IDs come from `spec.mjs check` `next` and `tasks.mjs check` `nextTask`, which count every mention, clarifications included.

## Spec lifecycle

`spec.md` frontmatter keys: `id`, `title`, `status`, `constitution_version`, `created`, `updated`, and optional `supersedes` (the `NNN-short-name` of the spec a rewrite replaces whole). `status` is one of `draft | approved | active | closed | superseded`.

- At most one spec in the project has `status: active`.
- A spec cannot become `approved` while any `[CLARIFY` marker remains.
- `constitution_version` records the constitution the spec was written under, or `none` when the project had none.
- Owners: `specify` → `draft`; `clarify spec` → `approved` only when no `[CLARIFY` marker remains **and the user explicitly confirms** the approval, and back to `draft` when it changes the meaning of an `approved` or `active` spec (a stale spec it approves also gets the current `constitution_version`); `implement` → `active`, without touching `updated`; `validate` → `closed` on a pass and the user's explicit OK, without touching `updated`; `maintain` reopens a `closed` spec (→ `draft` for a change, → `active` for a bug fix or a plan-only change), sets `superseded` (a rewrite's old spec, or a dropped spec in progress) and restores `closed` (a rewrite or reopening that was dropped). `maintain` writes only the `status` line.
- An `active` spec is mid-implementation: `clarify`, `plan` and `tasks` still run on it to settle a gap `implement` stopped on, with their usual rules; only a `closed` spec sends them to `maintain`.

## Spec

`spec.md` says WHAT the feature does and WHY, never how: no stack, architecture, files, APIs or storage. Template: `skills/specify/templates/spec.md`.

- Body, headings in the docs language, in order: `# Spec NNN — <name>` title, **Context and goal** (one paragraph plus a "Users" line), **User stories**, **Functional requirements**, **Non-functional requirements**, **Acceptance criteria**, **Assumptions**, **Out of scope**, **Done criteria** (1–3 bullets, no IDs), **Clarifications**, **Open questions**. Non-functional requirements, assumptions, clarifications and open questions appear only when they have a line.
- **Clarifications** is written only by `clarify spec`, one line per accepted answer, no session headings: `- 2026-10-16 <question> → <answer> (FR-003)`. The question is plain text, never a `[CLARIFY` marker. Other stages keep the section byte-identical.
- Edge cases are `[unwanted]` FRs with their AC, not a section. Key entities and data models belong to the plan. No success-criteria series: measurable qualities are NFRs.
- A spec holds at most 3 `[CLARIFY` markers, each in the open-questions section with the ID it affects: `- [CLARIFY: <question>] (FR-003)`. `specify` writes the gaps the user left open; `clarify spec` writes the questions left open and every HIGH or MEDIUM doc-reviewer finding it did not settle, so they block approval (beyond 3, the most severe stay and the rest are reported as deferred).
- Shared script `scripts/spec.mjs`: `status` (next number, specs with their status and `supersedes`, active spec) and `check <NNN-short-name>` (frontmatter, `supersedes` naming an existing other spec — a warning while it is not `superseded` —, ID and line formats, AC→FR links, FRs without AC, marker count, `next` free ID per type). Any stage that reads or changes a spec calls it.

## Plan

`plan.md` says HOW the approved spec gets built and adds no behaviour: a design question that would change a requirement, an AC or the out-of-scope section is a spec gap, sent back to `clarify spec`. The plan never edits `spec.md`. Template: `skills/plan/templates/plan.md`.

- Frontmatter keys: `spec` (the folder ID), `status` (`draft | approved`), `constitution_version` (the version the design was checked against, or `none`), `created`, `updated`.
- Body, headings in the docs language, in order: `# Plan NNN — <name>` title, **Summary**, **Technical context** (language/version, dependencies, storage, testing, platform, constraints), **Constitution** (one line per principle: complies, or exception — why — simpler alternative rejected), **Structure** (`- <path> → <responsibility> (FR-###, NFR-###)`), **Data model** (with one example), **Key algorithms** (pseudocode), **Interface contract**, **NFR response** (`- NFR-### → design → verification`), **Decisions** (`- <decision> — instead of <alternative> — because <reason> (ID or principle) [ADR-###]`), **Test strategy** (one line per layer: tool, IDs covered), **Clarifications**, **Open questions**. Data model, key algorithms, interface contract, NFR response, clarifications and open questions appear only when they have content. No code bodies. Spec-Kit's research.md, data-model.md, contracts/ and quickstart.md are sections here, never separate files.
- Every FR and NFR of the spec except `[wont]` is cited in the plan; every ID cited exists in the spec. At most 3 `[CLARIFY` markers, in the open-questions section. **Clarifications** follows the spec's rule and is written only by `clarify plan`.
- Lifecycle: `plan` runs only on an `approved` (or `active`) spec and leaves the spec's status unchanged. `plan` writes `approved` when the user explicitly approves the draft and no `[CLARIFY` remains, otherwise `draft`; `clarify plan` approves the same way, and returns an `approved` plan to `draft` when it changes its meaning or finds a HIGH or MEDIUM spec gap (behaviour a user would notice that the spec lacks), which goes to `clarify spec` and back through `plan`. `tasks` runs only on an `approved` plan; a plan older than its spec's `updated` is reviewed by `plan` first.
- **ADR** (`adr/ADR-NNN-short-title.md`, template `skills/plan/templates/adr.md`) only for hard-to-reverse decisions (architecture, storage, an external dependency, an interface other programs or scripts depend on); the rest are decision lines. Frontmatter `id`, `status` (`accepted | superseded`), `date`; sections context, decision, alternatives, consequences. A reversed ADR becomes `superseded` and is never deleted; the new one names the one it replaces.
- Shared script `scripts/plan.mjs check <NNN-short-name>`: `exists`, frontmatter, IDs cited that the spec lacks, `uncovered` FR/NFR, ADR files and links, `nextAdr`, marker count. Any stage that reads or changes a plan calls it.

## Tasks

`tasks.md` breaks the approved plan into small, dependency-ordered tasks and adds neither behaviour nor design: a spec gap goes to `clarify spec`, a plan gap (a module, decision, contract or test layer the plan lacks, or a task contradicting the plan or an ADR) goes to `clarify plan`. Template: `skills/tasks/templates/tasks.md`.

- Frontmatter keys: `spec` (the folder ID), `status` (`draft | approved`), `created`, `updated`.
- Body, headings in the docs language, in order: `# Tasks NNN — <name>` title, one section per phase — **Setup**, **Foundation**, one per user story (`US-### <title> (FR-###, …)`, the one with the most `[must]` FRs first, marked MVP; `[unwanted]` FRs go with the FR they guard), **Polish** — each ending in one checkpoint line (what works together now), then **Dependencies**, **Clarifications**, **Open questions**. Polish, dependencies, clarifications and open questions appear only when they have content. **Clarifications** follows the spec's rule and is written only by `clarify tasks`.
- A task is about 30 minutes of work with one goal and one path, cites at least one FR or NFR (setup and polish cite what they enable) and has a checkable done-when line. Every FR, NFR (except `[wont]`) and plan structure line has a task; every AC and every NFR has a `[test]` task; within a phase, `[test]` tasks come before the code tasks that cover the same requirement. `[test]` tasks are run by `test-designer` in `implement`.
- Tasks run in order and phases in sequence; `[P]` tasks next to each other touch different paths. Stories are independent unless a dependency line says otherwise: `- T-012 ← T-004, T-009`, only to earlier tasks.
- Lifecycle: `tasks` runs only on an `approved` plan with no "spec updated after the plan" warning; it writes `approved` when the user explicitly approves the list in chat and no `[CLARIFY` remains (at most 3), otherwise `draft`. `clarify tasks` approves the same way, and returns `approved` tasks to `draft` when it changes their meaning or finds a HIGH or MEDIUM spec or plan gap. `implement` runs only on `approved` tasks; checking a box does not change the status. `validate` may append a remediation phase and `maintain` a fix phase, each on the user's OK, which approves it: the status stays `approved` and `updated` becomes today.
- **`traceability.md`** (template `skills/tasks/templates/traceability.md`): frontmatter `spec`, `updated`; one table row per FR and NFR except `[wont]`: `| ID | AC | Tasks | Test | Evidence |`. `tasks` and `clarify tasks` write the first four columns from the tasks and leave the evidence "pending" (docs language); `implement` and `validate` fill it; `validate` adds its remediation task IDs to the Tasks column and resets those rows to "pending".
- Shared script `scripts/tasks.mjs check <NNN-short-name>`: `exists`, frontmatter, task line format, done-when lines, unknown IDs, coverage, test order, `[P]` paths, dependency lines, traceability rows, marker count, `nextTask`, `nextOpen` (first unchecked task), `tasks` (each with its phase and checkbox), the computed `matrix`; warnings for paths outside the plan's structure, structure lines without a task, code in an earlier phase than its first test (setup excepted), a stale plan or spec, more than 40 tasks. Any stage that reads or changes tasks calls it.

## Implement

`implement` builds the active spec from its approved tasks, one scoped run at a time (`T-###`, `T-###..T-###`, a phase, or by default the phase of `nextOpen`), stopping at each phase checkpoint for the user's OK.

- Gate: tasks `approved` with no `tasks.mjs` errors and no "spec/plan updated after the tasks" warning, plan `approved`, spec `approved` or `active`, no other spec `active`. Then the spec becomes `active` (its `updated` untouched) and AGENTS.md shows `<id> (active)`.
- Red → green: per phase, `test-designer` writes the open `[test]` tasks in one dispatch and proves them red for the right reason (or `covered`, only for a `[test]` task whose done-when says the behaviour already exists: the test passes now and asserts its AC); then `implementer` takes one code task per dispatch (`[P]` neighbours together). The skill reruns the test command itself after each dispatch and checks a box only when the run and the done-when confirm it; a failure stops the run.
- Roles: `test-designer` writes only `[test]` task paths; `implementer` writes production code and treats `[test]` task paths and `specs/` as read-only, reporting a wrong-looking test instead of editing it.
- Gaps: implement never edits spec or plan text; a spec gap goes to `clarify spec`, a plan gap to `clarify plan`, a task gap to `clarify tasks`, and implement resumes from the first unchecked box once they are approved again.
- Evidence: a traceability row whose tasks are all `[x]` gets `<green in the docs language> YYYY-MM-DD — <test command> (<passing>/<total>)`; `validate` confirms it.
- Each checkpoint shows the suite summary, the AGENTS.md "pending" lines now settled (before/after, written on OK) and a suggested commit message citing the T- and FR- IDs; implement runs no git command. Checking a box changes neither the tasks' status nor their `updated`.
- `stage=implement` at the end of a run that checked a box; its visible text names `nextOpen` and `/think-spec:implement`, or `/think-spec:validate` when every box is checked.

## Validate

`validate` answers "is the spec met?" with evidence: every live FR and NFR with the test that covers it and its run result, the spec's done criteria, a security audit, and a verdict. A checked box, a traceability row or an agent's report is a claim; evidence is a run observed in this session, and what nobody could run is `not run` with its reason.

- Gate: spec `active` with no `spec.mjs` errors, plan and tasks `approved` with no script errors, `nextOpen` null.
- `code-validator` and `security-auditor` are dispatched together (prompts in `skills/validate/references/dispatch.md`); the skill reruns the suite itself and verifies the requirements the agent could not (browser on desktop and mobile, else the user's answer, recorded as `manual`).
- Gap types `missing | partial | contradicts | unrequested`; severities `HIGH | MEDIUM | LOW`. HIGH and MEDIUM gaps and security findings block closing; LOW is reported. An `unrequested` gap the user accepts becomes LOW.
- **`validation.md`** (template `skills/validate/templates/validation.md`): frontmatter `spec`, `verdict` (`pass | fail`), `validated`; sections, headings in the docs language: title, verdict line, **Checks** (suite, lint, artifacts), **Requirements** (`| ID | Test | Result | Evidence |`, one row per live FR and NFR), **Done criteria**, **Findings** (only when any). Each run rewrites it with the current state; an unchanged result leaves it byte-identical, date included.
- Pass: on the user's explicit OK the spec becomes `closed`, `active-spec` becomes `none` and `stage=validate`; next `/think-spec:maintain`, or `/think-spec:finish` when no feature follows. Only evidence cells that do not match the run change.
- Fail: a meaning gap goes to `clarify spec` or `clarify plan` and no task is written; a code gap becomes an appended remediation phase (normal task format, `[test]` tasks first; a test for behaviour the code already has says so in its done-when, so it may pass from the start), written on the user's OK; next `/think-spec:implement`. Existing tasks are never rewritten.
- Shared script `scripts/validate.mjs check [NNN-short-name]`: runs `agent-context`, `constitution`, `spec`, `plan` and `tasks` as subprocesses and merges their errors and warnings with the file each belongs to, then adds its own: every traceability row of a feature whose tasks are all done holds a dated evidence cell with all tests passing, `validation.md` follows its contract, and a `closed` spec has a passing `validation.md` and no open task. One JSON report `{ok, errors, warnings, specs}`, exit 0; the hook reads its `errors`.

## Hook

`hooks/hooks.json` holds one `PostToolUse` hook on `Write|Edit` that runs `scripts/hook.mjs` (exec form). It is opt-in: it acts only when the plugin option `validate_on_edit` (`userConfig` in `plugin.json`, default `false`) is true. When Claude writes `AGENTS.md`, `docs/constitution.md` or a file under `specs/`, it runs `validate.mjs check` (on that spec only, for a spec file) and, when the written file has errors, exits 2 with at most 10 of them on stderr: a warning Claude reads, since the edit already happened. It never blocks and exits 0 on any failure of its own. A `Stop` hook is out: its exit 2 keeps Claude working and can loop.

## Maintain

`maintain` routes the next work on a living project, **spec first**: it changes spec statuses and hands off; the stage owning each document writes it. It never writes code, tests or spec text.

- Every run starts with a review: state and `validate.mjs check`, stale specs, AGENTS.md "pending" lines now settled (before/after, on OK), deferred candidates (out-of-scope parts, LOW findings, roadmap rows), orphan rewrites, an outdated `handoff.md`.
- Paths, chosen with one question: **new feature** (optional chat intake of at most 3 questions, verdict go / needs clarification / drop, no files) → `specify`; **change** of a feature → reopen its spec (`draft`, `active-spec` set) → `specify` update, or a plan-only change (`active`) → `plan`; **rewrite** → old spec `superseded`, new spec with `supersedes` → `specify`; **bug** breaking an existing AC → a fix phase appended to `tasks.md` (a `[test]` task reproducing it red first, then code), spec `active` → `implement`; behaviour no AC states is a change; **drop** a spec in progress → `superseded` (or back to `closed` when it is a reopening left as it was), the spec it superseded restored, code untouched.
- One truth per feature: a change edits the feature's spec in place; a new capability gets a new spec; a rewrite supersedes the old spec whole.
- Paths that lead to a spec ask "specify now?" and invoke `think-spec:specify` on yes. `stage=maintain`.
- **`specs/roadmap.md`** (optional; template `skills/maintain/templates/roadmap.md`): `#` title, one line of intent, table `| ID | Part | Intent | Scope boundary | Depends on | Spec |` (headings in the docs language), rows `R1`, `R2`… never reused. No status column: a row's status is its spec's; no spec means planned. `maintain` creates it on request and recommends the next row whose dependencies are `closed`; `specify` offers it when it splits an epic and writes the spec ID into the row it specifies.

## Finish

`finish` proves the whole project is done and writes `specs/handoff.md`. It is a checkpoint, never a lock: `maintain` reopens the project.

- Gate: `active-spec none`, every spec `closed` or `superseded`, at least one `closed`, `validate.mjs check` `ok`.
- Audit: the skill runs the suite and lint; `code-validator` (every live FR/NFR of every closed spec green, done criteria, spec and plan against the code) and `security-auditor` (all the code) are dispatched together (prompts in `skills/finish/references/dispatch.md`), counts per spec and failures only.
- HIGH and MEDIUM findings block: nothing is written and each goes to `/think-spec:maintain` (bug, change or plan-only change). LOW findings go to the handoff.
- **`specs/handoff.md`** (template `skills/finish/templates/handoff.md`): frontmatter `finished`; title, one paragraph, **Features** (`| Spec | Title | Status | Validated |`), **How to run and test**, **Final audit**, **Known limits**, **Open findings**, **Where the docs live**; empty sections dropped; byte-identical, date included, when nothing changed. The next `finish` rewrites it.
- The README is proposed as lines before/after (or a short draft) and written only on the user's OK. `stage=finish`; next `/think-spec:maintain`.

## Constitution

`docs/constitution.md` is a short list of verifiable principles about the project's stack, quality, tests and limits. The AI proposes it, the user approves it; it changes only when something general about the project changes. Template: `skills/constitution/templates/constitution.md`.

- Frontmatter keys: `version` (semver), `ratified` (first adoption date, never changes), `amended` (date of the last written change).
- Body, headings in the docs language: `#` title, one context line, **Principles** (numbered, one line each: `1. **Name:** rule`), **Governance** (two lines: supremacy, amendment rule).
- At most 15 content lines: non-blank lines after the frontmatter, the title excluded. Default 6 principles.
- No open markers: an undecided topic is left out, never written as `[CLARIFY` or `TODO(`.
- Version bump: **MAJOR** removes or redefines a principle; **MINOR** adds or tightens one; **PATCH** rewords without changing what complies. The largest change wins. Principle numbers never change: a removed principle's number is not reused and new principles go at the end, so "principle N" cited in a plan or spec keeps its meaning.
- The amendment impact report (old → new version, changes, stale specs) is shown in chat only, never written to the file.
- A spec is **stale** when it is not `closed` / `superseded` and its `constitution_version` is an older MAJOR.MINOR than the constitution's `version`.
- Shared script `scripts/constitution.mjs status` reports the frontmatter, content lines, contract errors and stale specs; any stage that needs the constitution version or stale specs calls it.

## Agents

Names are a contract; each is built by the stage that first needs it and invoked as subagent type `think-spec:<name>`.

| Agent | Role |
|---|---|
| `doc-reviewer` | read-only doc review, returns clarify findings |
| `test-designer` | writes tests from AC items before code exists |
| `implementer` | reads and writes code, per task |
| `code-validator` | reads and runs, never edits |
| `security-auditor` | read-only security review |

Frontmatter: `name`, `description`, `tools` (or `disallowedTools`, to inherit the session's tools minus the listed ones), optional `model`. Claude Code ignores `permissionMode`, `hooks`, `mcpServers` and `initialPrompt` for plugin agents.

- **Model**: `model: inherit` (the session's model). A skill passes `model` / `effort` on the dispatch only when the user names them (`model=<model> effort=<level>` in the arguments, or in chat).
- **doc-reviewer** (`agents/doc-reviewer.md`, built with `clarify`): tools `Read, Grep, Glob`. Detects, never resolves or edits; takes a mode (`spec`, `plan` or `tasks`) with passes for each. Returns a numbered list in the docs language, most severe first, at most 15 lines plus one `+N more` line: `1. [HIGH|MEDIUM|LOW] <ID, file or section> — <problem> — <suggested question>?`, or `No findings.`. `clarify` dispatches it on every run; `specify`, `constitution`, `plan` and `tasks` rely on their self-checks and scripts instead.
- **test-designer** and **implementer** (`agents/test-designer.md`, `agents/implementer.md`, built with `implement`): tools `Read, Grep, Glob, Edit, Write, Bash, PowerShell` (whichever shell the session has). Their dispatch prompts and result blocks (`Result: red | blocked`, each test `fails` or `covered`, and `Result: done | blocked`, at most 40 lines) live in `skills/implement/references/dispatch.md`.
- **code-validator** (`agents/code-validator.md`, built with `validate`): `disallowedTools: Edit, Write, NotebookEdit, Agent`, so it inherits the session's browser tools whatever they are. Runs the suite, lint and dependency audit, runs and reads the test of each requirement, checks interface requirements in a browser (desktop and mobile), and returns `Result: pass | fail` with typed gaps, at most 40 lines. `finish` dispatches it over every closed spec at once.
- **security-auditor** (`agents/security-auditor.md`, built with `validate`): tools `Read, Grep, Glob`. Secrets, injection, `[unwanted]` input validation, `[security]` NFRs and principles, dependencies, URL and external-input trust; returns `Result: clean | findings`, at most 40 lines. `finish` dispatches it over all the code. `validate` also suggests the built-in `/security-review` when the project uses git.
- **Built-in agents in `plan`**: `Explore` surveys existing code in brownfield projects; `Plan` compares designs only when two or more are viable and the user wants them compared.

## Third-party text

GitHub Spec-Kit is MIT. When a file copies or closely adapts Spec-Kit text or code, add a row to `THIRD_PARTY_NOTICES.md` naming the file and its source.
