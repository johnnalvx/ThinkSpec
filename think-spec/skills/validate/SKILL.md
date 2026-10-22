---
name: validate
description: think-spec stage 10 — validate the finished active spec requirement by requirement (code-validator and security-auditor in parallel), write validation.md, and close the spec or route each gap to remediation tasks or clarify.
argument-hint: "[model=<model>] [effort=<level>]"
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*plan.mjs*), PowerShell(node *think-spec*scripts*tasks.mjs*), PowerShell(node *think-spec*scripts*validate.mjs*)
---

# think-spec validate

Answer one question with evidence: **is the spec met?** Walk it requirement by requirement — which test covers each FR and NFR, and what running it gives — check its done criteria, audit the code's security, and give a verdict. `code-validator` and `security-auditor` gather the evidence; this skill verifies it, writes `validation.md`, and the user decides whether the spec closes.

Options: $ARGUMENTS

## Ground rules

- **Language.** Talk and write `validation.md` and task text in the first tag of `docs-language`. IDs, tags, gap types, status and verdict values and paths stay English.
- **Claims are not evidence.** A checked box, a traceability row or an agent's report is a claim; evidence is a run observed in this session. What nobody could run is `not run` with its reason, never inferred.
- **Ownership.** Agents never edit. This skill writes `validation.md`; the `status` of `spec.md` (its `updated` untouched); in `tasks.md` an appended remediation phase and `updated`; in `traceability.md` evidence cells, the Tasks column of rows a remediation task joins, and `updated`; the state keys. Every other line stays byte-identical. Code, tests and git belong to others: suggest, never change.
- **Blocking.** HIGH and MEDIUM gaps and findings block closing; LOW ones are reported.
- **Idempotent.** A re-run whose result has not changed leaves every file byte-identical, `validated` date included.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys (`git` says whether the project uses git). Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status | check <NNN-short-name>` — specs and their status; the spec's format.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs" check <NNN-short-name>` — the plan's status, `errors`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs" check <NNN-short-name>` — the tasks' status, `tasks`, `nextOpen`, `nextTask`, `matrix`, `errors`, `warnings`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" check [NNN-short-name]` — every artifact of the project in one report: `ok`, `errors` and `warnings` (each with its `file`), `specs`.

## Steps

### 1. Gate

Run `agent-context.mjs status`, `spec.mjs status`, then `spec.mjs check`, `plan.mjs check` and `tasks.mjs check` on the active spec. Every condition must hold; at the first that fails, say which and its command, and stop:

- AGENTS.md exists with no `missing` / `duplicates` / `invalid` keys — else `/think-spec:init`;
- `active-spec` names a spec — else `/think-spec:specify`; a `closed` spec — `/think-spec:maintain`;
- the spec is `active` with no `spec.mjs` errors — else `/think-spec:implement`;
- the plan and the tasks are `approved` with no `plan.mjs` / `tasks.mjs` errors — else `/think-spec:clarify plan` / `/think-spec:clarify tasks`;
- `nextOpen` is `null` — else `/think-spec:implement`, naming the open task.

Done when every condition holds.

### 2. Load

Read, in this order: AGENTS.md, `docs/constitution.md` (when it exists), `spec.md`, `plan.md` with its `adr/` files, `tasks.md`, `traceability.md`, and `validation.md` when a previous run left one. Take the test, lint, dependency-audit and run commands from AGENTS.md, or from the plan while AGENTS.md says "pending". List the requirements the test runner cannot reach (interface, layout, mobile, visual) from their AC and the plan's test strategy.

Done when you can name every live FR and NFR with its AC, the commands, and the code paths in scope (the plan's structure and the task paths).

### 3. Lint

Run `validate.mjs check <id>`. Its errors on this spec's files are gaps of the artifacts: show them; an error that the gate did not catch (an incomplete traceability cell, a broken `validation.md`) is fixed by this run where this skill owns the file, and reported otherwise. Note the error count for the checks table.

### 4. Dispatch

Send `think-spec:code-validator` and `think-spec:security-auditor` together, as two dispatches in one message, with the prompts in `${CLAUDE_SKILL_DIR}/references/dispatch.md`.

Done when both result blocks are back.

### 5. Verify

- **Suite.** Run the test command yourself (and lint). A result that differs from the agent's wins over it: re-mark the affected requirements and say so.
- **Manual requirements.** For each requirement the agent returned `not run` with manual steps, verify it with this session's browser tools, on a desktop and a mobile (375 px) viewport, and record what you saw as the evidence. With no browser either, ask the user, one requirement per question with its steps (recommend "it works" only when the steps are simple); record the answer as evidence `manual (<user in the docs language>)`.
- **Spot-check.** Open at least one test the agent marked `pass` for each `[must]` FR and confirm it asserts its AC.
- **Done criteria.** Mark each bullet of the spec's done criteria met or not met from the requirement results.

Done when every live FR and NFR has a result with evidence and every done criterion is marked.

### 6. Verdict

Merge the gaps and the security findings, most severe first. Each `unrequested` gap is asked once: keep it as LOW (the user accepts it) or keep its severity (recommend the agent's). The verdict is **pass** when the suite is green, every live requirement is `pass`, every done criterion is met and no HIGH or MEDIUM gap or finding remains; otherwise **fail**.

Fill `${CLAUDE_SKILL_DIR}/templates/validation.md` with the verdict, checks, one row per live FR and NFR, done criteria and findings (the findings section only when there is one), headings in the docs language. When the result equals the existing `validation.md` apart from the date, leave the file untouched; otherwise write it with today as `validated`. Run `validate.mjs check <id>` and fix every error in `validation.md`.

Show the user the verdict line, the requirement table and the findings.

### 7a. Pass — close

Correct the evidence cells of `traceability.md` that do not match what ran now (other cells keep theirs; `updated` changes only with them). Then ask whether to close the spec (recommend yes). On yes: set `status: closed` in `spec.md` (nothing else in the file changes) and `agent-context.mjs set` with `active-spec=none`, `active-spec.text='<none in the docs language>'` and `stage=validate`. Then ask whether another feature follows (recommend yes): yes → `stage.text='validate; <next>: `/think-spec:maintain`'`; no → the same with `/think-spec:finish`. Without the OK to close, the spec stays `active`, `validation.md` stays written, and `stage` is unchanged.

### 7b. Fail — route

Classify each blocking gap or finding:

- **Meaning gap** — the spec is ambiguous, contradicts itself, or lacks behaviour the code needs (`/think-spec:clarify spec`); the plan lacks a module, decision or contract the fix needs (`/think-spec:clarify plan`). Write no remediation tasks while one remains: they would be written against a document about to change.
- **Code gap** — the spec and plan are clear and the code, a test, or the security falls short of them. Propose a remediation phase in chat: one `## ` phase after the last phase of `tasks.md` (before its dependencies, clarifications and open questions sections), heading `<Phase> N — <Remediation>` in the docs language, ending in its checkpoint line. Tasks follow the task line format from `nextTask` on: a `[test]` task first for every missing or partial test and every security finding that a test can pin down, then the code task (none when the code already does what the AC asks: that test's done-when says so, "passes now and asserts AC-###", so `implement` accepts it green); each cites the FR or NFR the gap breaks (a security finding cites the FR whose code holds the flaw, or the `[security]` NFR), names one path and has a done-when line. An `unrequested` gap gets a task to remove the code or to justify it in the plan, as the user picks.

On the user's OK — which approves the new tasks, so `tasks.md` stays `approved` — append the phase and set its `updated` to today; in `traceability.md`, add the new task IDs to the Tasks column of their rows and set those rows' evidence back to "pending" (docs language), and set `updated`. Run `tasks.mjs check` and fix every error. Then `agent-context.mjs set` with `stage=validate` and `stage.text='validate (fail); <next>: <command>'`.

### 8. Report and hand off

Report in the docs language, briefly: the verdict, the suite summary, requirements failing or not run, findings by severity, the files written. When AGENTS.md shows `git`, add one line suggesting the built-in `/security-review` as an optional second opinion on the changes. End with the handoff as the final line, `Next` in the docs language:

```
Next: /think-spec:maintain
```

`/think-spec:finish` when no feature follows; `/think-spec:implement` after remediation tasks; the clarify command of a meaning gap; `/think-spec:validate` when the user did not approve closing or the tasks.
