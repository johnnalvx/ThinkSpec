# Brownfield init

Read when `status` reports `mode: "brownfield"`. The codebase is evidence: AGENTS.md records what is already true, never what would be nice.

## Baseline

When `git` is true, tell the user (one line, no question) that committing or stashing first makes init's changes reviewable as a single diff. You never run git yourself.

## Survey prompt

Dispatch the built-in `Explore` agent (breadth: medium) with this prompt, filling `<root>`:

```
Survey the project at <root> for an AGENTS.md. Read-only. Return ONLY the sections below,
40 lines max, each fact followed by its evidence path in parentheses. Write "unknown"
instead of guessing.

STACK: languages, runtimes and versions, frameworks, package manager.
COMMANDS: exact run / build / test / lint / format commands, from manifests (package.json
  scripts, pyproject, Makefile, *.csproj, go.mod, Cargo.toml...), CI files, README. Include
  env vars they need.
LAYOUT: top-level folders and key files, one line each with their role.
TESTS: framework, where tests live, how to run one test.
GUARDRAILS: rules the project already enforces or documents: CI checks, lint/format configs,
  CONTRIBUTING, existing agent files (.cursorrules, .github/copilot-instructions.md, GEMINI.md...),
  architecture docs, ADRs.
GOTCHAS: non-obvious constraints stated in docs or comments (platform quirks, generated
  files not to edit, secrets handling, things that must not run in tests).
LANGUAGES: natural language of identifiers, code comments, test names, commit messages
  (git log, if any), docs and user-facing interface strings; several are a list.
PURPOSE: what the project does, its architecture and technologies, in 2-3 sentences,
  quoted or paraphrased from README/manifest/docs.
```

The survey is complete when every section has a fact with evidence or an explicit "unknown". Fill gaps yourself with a targeted read only when a section matters for AGENTS.md (commands above all); leave the rest unknown.

## Turning the survey into AGENTS.md

- Commands come from the survey verbatim: run, tests, lint/format. Where a manifest lists many scripts, name the few that matter and point to the manifest for the rest. A command the survey marks unknown is written as "pending".
- Style and conventions, and project-specific rules: keep only facts an agent would otherwise get wrong (non-obvious constraints, things never to run or edit).
- LANGUAGES feeds the language question; mixed evidence (e.g. Spanish comments, English identifiers) is shown to the user as it is, with the dominant one recommended.
- Existing agent files from other tools (`.cursorrules`, `copilot-instructions.md`, …): mention them in the report; leave them untouched.
- LAYOUT and STACK feed the architecture and technologies sentences of the project section; folders are named only when an agent needs them to navigate.
- Other unknowns go in the report, not in AGENTS.md.

## Restructuring an existing AGENTS.md

When an existing AGENTS.md does not follow the template's sections (project, commands, style and conventions, rules, when you finish any task), draft the restructured file and show it before writing:

- every existing line lands in the section it fits, words unchanged; a line that fits no section goes under rules;
- survey facts it lacks are added and marked as new in your message;
- the state-key lines are added as in the template;
- list anything you would drop as duplicated, so the user decides.

Write it only on approval; otherwise keep the file and add just the state-key lines.

## Guardrails for the constitution

GUARDRAILS facts are candidate constitution principles: rules already true for the project or explicitly adopted by its team. In the report, list them as one short line each with evidence, framed as input for `/think-spec:constitution`. Propose nothing the evidence does not show.
