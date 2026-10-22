# Brownfield constitution

Read when `agent-context.mjs status` reports `mode: "brownfield"`. Principles record what the code already complies with; anything aspirational comes from the user, labelled as new in the draft.

## Sources, in order

1. Guardrail candidates passed by `init` in `$ARGUMENTS` (one line each, with evidence).
2. AGENTS.md: stack, conventions, rules, project-specific limits.
3. When neither gives at least three candidates, dispatch the survey below.

## Survey prompt

Dispatch the built-in `Explore` agent (breadth: medium) with this prompt, filling `<root>`:

```
Survey the project at <root> for candidate constitution principles. Read-only. Return ONLY
the sections below, 30 lines max, each fact followed by its evidence path in parentheses.
Write "unknown" instead of guessing. Report only rules the code or config already enforces.

STACK: language and version, runtime, frameworks, dependency policy (manifest, lockfile).
TESTS: framework, where tests live, what CI runs, coverage or other gates.
STRUCTURE: module boundaries the code respects (what never imports what).
DATA: where data is stored and in what format.
LIMITS: rules already documented or enforced: lint/format configs, CONTRIBUTING, agent files,
  CI checks, secrets handling, things never to run or edit.
LANGUAGES: natural language of identifiers, comments, commits and user-facing messages.
```

## Using the findings

- Each candidate cites its evidence in your chat message; the file itself carries the principle only.
- A finding that contradicts AGENTS.md is shown to the user as a question, never written.
- Topics marked "unknown" go through the normal question step, or are left out.
