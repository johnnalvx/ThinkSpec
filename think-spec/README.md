# think-spec

A Claude Code plugin for spec-driven development (v0.1.0, early release: feedback wanted). You describe a feature. think-spec takes it from a short constitution through a spec, a plan and a task list to tested code, a validation against real test runs and, at the end of the project, a handoff. Each stage is a skill you run as `/think-spec:<skill>`. Subagents review, write tests, implement, validate and audit.

Install and quick start are in the [root README](../README.md).

## Workflow

`init → constitution → specify → clarify spec → plan → (clarify plan) → tasks → (clarify tasks) → implement → validate → maintain | finish`

| Command | What it does | Writes |
|---|---|---|
| `/think-spec:init` | Writes the project's AGENTS.md, surveying existing code if there is any | `AGENTS.md`, `CLAUDE.md` |
| `/think-spec:constitution` | Proposes a short list of verifiable principles, versioned with semver | `docs/constitution.md` |
| `/think-spec:specify` | Asks up to 5 questions, then drafts the spec: what and why only | `spec.md` |
| `/think-spec:clarify spec\|plan\|tasks` | QA review, up to 5 questions one at a time, approval on your OK | the reviewed file |
| `/think-spec:plan` | How: modules, decisions with the rejected alternative, test strategy | `plan.md`, `adr/` |
| `/think-spec:tasks` | Small tasks by user story, MVP first, tests before code | `tasks.md`, `traceability.md` |
| `/think-spec:implement` | Failing tests first, then code until green; stops at each checkpoint | code, tests |
| `/think-spec:validate` | Each requirement with its test and run result, security audit, verdict | `validation.md` |
| `/think-spec:maintain` | Routes a new feature, change, rewrite or bug fix through the spec first | spec status, fix tasks, `specs/roadmap.md` |
| `/think-spec:finish` | Final audit of the project and a handoff document | `specs/handoff.md` |

Stages up to `tasks` only write documents, so each can chain into the next when you say yes. `implement`, `validate`, `maintain` and `finish` change code or close work, so only you start them.

## Agents

| Agent | Role | Dispatched by |
|---|---|---|
| `doc-reviewer` | Read-only review of a spec, plan or task list; returns findings with a question each | clarify |
| `test-designer` | Writes tests from the acceptance criteria and proves they fail first | implement |
| `implementer` | Writes production code for one task until the suite is green | implement |
| `code-validator` | Runs the suite, lint and each requirement's test; checks interfaces in a browser; never edits | validate, finish |
| `security-auditor` | Read-only audit: secrets, injection, input validation, dependencies, URL trust | validate, finish |

## Files in your project

```
AGENTS.md                          source of truth, with the think-spec state keys
CLAUDE.md                          @AGENTS.md
docs/constitution.md
specs/NNN-short-name/spec.md       plan.md, adr/, tasks.md, traceability.md, validation.md
specs/roadmap.md                   optional
specs/handoff.md                   written by finish
```

## Language

Plugin files are in English. Artifacts and conversation use the first language of `docs-language`, which you set in `init`. IDs, tags, frontmatter and file names stay in English. EARS and Gherkin keywords follow your language (table in `skills/specify/references/ears.md`).

## Options

- **Permissions.** A skill pre-approves its script calls only in the turn that starts it. `init` offers to add rules to `.claude/settings.json`; the rules are in the root README.
- **Validation hook, off by default.** Turn on the plugin option `validate_on_edit` (asked when the plugin is enabled, or in `/config`). After Claude writes `AGENTS.md`, `docs/constitution.md` or a file under `specs/`, the hook runs `scripts/validate.mjs` and reports that file's errors.
- **Local clone.** `claude --plugin-dir ./think-spec` loads the plugin without the marketplace.

## Credits

Built on ideas, templates and prompts from [GitHub Spec-Kit](https://github.com/github/spec-kit) (MIT). Each adapted file is listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Contributors follow [CONVENTIONS.md](CONVENTIONS.md). Changes are in [CHANGELOG.md](CHANGELOG.md).
