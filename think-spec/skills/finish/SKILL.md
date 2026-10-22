---
name: finish
description: think-spec stage 12 — final audit of the whole project (every closed spec's requirements, done criteria, spec and plan against the code, security) and specs/handoff.md; the project can be reopened later with maintain.
argument-hint: "[model=<model>] [effort=<level>]"
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*), PowerShell(node *think-spec*scripts*spec.mjs*), PowerShell(node *think-spec*scripts*validate.mjs*)
---

# think-spec finish

The flow ends when every spec is right and validated. This skill proves it for the **whole project** at once — every task done, every live FR and NFR of every closed spec with a green test, every done criterion met, the specs and plans describing the code as built, and the code secure — then writes `specs/handoff.md` for whoever picks the project up. Finish is a checkpoint, never a lock: `/think-spec:maintain` reopens the project whenever more work comes.

Options: $ARGUMENTS

## Ground rules

- **Language.** Talk and write `handoff.md` in the first tag of `docs-language`. IDs, status values, commands and paths stay English.
- **Claims are not evidence.** A `validation.md`, a checked box or an agent's report is a claim; evidence is a run observed in this session. What nobody could run is `not run` with its reason.
- **Ownership.** This skill writes `specs/handoff.md` and the `stage` key; the README only with the user's OK. Specs, plans, tasks, code and tests stay byte-identical: their gaps go to `/think-spec:maintain`.
- **Blocking.** HIGH and MEDIUM findings block finishing; LOW ones go to the handoff.
- **Idempotent.** A re-run whose result has not changed leaves `handoff.md` byte-identical, `finished` date included.
- **Scripts.** Run from the project root, each prints JSON; a non-zero exit means stop and show the user the message:
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" status | set key=value … [key.text=<visible text>]` — AGENTS.md state keys (`git` says whether the project uses git). Quote `set` arguments with single quotes.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs" status` — specs with `status` and `supersedes`.
  - `node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" check` — every artifact of the project: `ok`, `errors`, `warnings`, `specs` (status, tasks done/total, validation verdict).

## Steps

### 1. Gate

Run `agent-context.mjs status`, `spec.mjs status` and `validate.mjs check`. Every condition must hold; at the first that fails, say which and its command, and stop:

- AGENTS.md exists with no `missing` / `duplicates` / `invalid` keys — else `/think-spec:init`;
- `active-spec` is `none` and no spec is `draft`, `approved` or `active` — else `/think-spec:validate` for an active spec, `/think-spec:maintain` to finish or drop the others;
- at least one spec is `closed` — else `/think-spec:specify`;
- `validate.mjs` `ok` is true — else show the errors by file and `/think-spec:maintain`. This also proves every closed spec has a passing `validation.md`, every task checked and a dated, all-green evidence cell in every traceability row.

Done when every condition holds.

### 2. Load

Read AGENTS.md, `docs/constitution.md` (when it exists), `specs/roadmap.md` (when it exists), the README (when it exists) and, for each closed spec, `spec.md`, `plan.md` (structure, decisions, test strategy), `traceability.md` and `validation.md`. Take the run, test, lint and dependency-audit commands from AGENTS.md. List the requirements the test runner cannot reach (interface, layout, mobile, visual) with their spec.

Done when you can name every closed spec with its live FR and NFR count, the commands, and the code paths of every plan's structure.

### 3. Audit

Run the test command and the lint command yourself and keep the counts. Then send `think-spec:code-validator` and `think-spec:security-auditor` together, as two dispatches in one message, with the prompts in `${CLAUDE_SKILL_DIR}/references/dispatch.md`.

When both result blocks are back, verify them:

- **Suite.** Your run wins over the agent's: re-mark what differs and say so.
- **Manual requirements.** For each requirement returned `not run` with manual steps, check it with this session's browser tools on a desktop and a mobile (375 px) viewport. With no browser, ask the user once whether to accept, for all of them, the evidence their `validation.md` recorded at closing (recommend yes when the code they touch has no new finding), else one question per requirement with its steps.
- **Spot-check.** Open at least one test the agent marked `pass` per closed spec and confirm it asserts its AC.

Done when every live FR and NFR of every closed spec has a result with evidence, every done criterion is marked, and every finding has a severity.

### 4. Verdict

The project is **finished** when the suite is green, every live requirement passes, every done criterion is met and no HIGH or MEDIUM gap, drift or security finding remains. Show the user a per-spec summary line (`<id> — n/n requirements — criteria met`) and the findings, most severe first.

Not finished: write nothing. Route each blocking finding to `/think-spec:maintain`, naming its path: a failing or missing test, an unmet criterion or a security flaw → bug in the spec whose code holds it; the spec stating behaviour the code does differently → change; only the plan out of date → change (plan only). Leave `stage` unchanged and end with `Next: /think-spec:maintain`.

### 5. Hand off

Fill `${CLAUDE_SKILL_DIR}/templates/handoff.md`, headings in the docs language, sections without content dropped:

- **Features**: one row per spec in number order; a `superseded` spec names the spec whose `supersedes` points at it, or "dropped" when none does; the validated date is its `validation.md` date.
- **How to run and test**: the commands from AGENTS.md, verbatim.
- **Final audit**: this run's suite, lint, artifacts and security result, dated today.
- **Known limits**: the out-of-scope lines of each closed spec that no later spec built, and roadmap rows without a spec.
- **Open findings**: the LOW findings of this audit and of each `validation.md` still present in the code.

When the result equals the existing `handoff.md` apart from the date, leave the file untouched; otherwise write it with today as `finished`.

Then the README: list the facts the handoff knows that the README lacks or states differently (what the project is, how to run, how to test, the features). With any, show each change as its lines before and after, or a short README draft when there is none, and write only on the user's OK.

Then `agent-context.mjs set` with `stage=finish` and `stage.text='finish; <finished in the docs language>; <to continue>: `/think-spec:maintain`'`.

### 6. Report

Report briefly in the docs language: the verdict, the per-spec summary, the suite, findings by severity, the files written. When AGENTS.md shows `git`, add one line suggesting the built-in `/security-review` as an optional second opinion and a commit of `specs/handoff.md`. End with the handoff as the final line, `Next` in the docs language:

```
Next: /think-spec:maintain
```
