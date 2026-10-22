# ThinkSpec

Spec-driven development for Claude Code: write the spec, plan and tasks first, then build and check each requirement against a real test run.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757.svg)](https://claude.com/claude-code)

"Build me X" in a chat leaves code nobody can check. The requirements live in the conversation, scope drifts, and "done" means "it looked fine". think-spec is a Claude Code plugin that puts a written spec between the idea and the code. Each stage is a slash command that writes a short Markdown artifact, and the final validation only trusts test runs it observes itself. It is for Claude Code users who want a spec, tests and evidence instead of a long chat.

The repo `ThinkSpec` is the marketplace `thinkspec`, which holds the plugin `think-spec`.

> v0.1.0 is an early release. Every stage exists and was dry-run, but it has not been exercised end to end in a real Claude Code session yet. If you try it, please [open an issue](https://github.com/johnnalvx/ThinkSpec/issues/new/choose) with what happened.

## Install

Needs Claude Code and Node.js 18 or later.

```
/plugin marketplace add johnnalvx/ThinkSpec
/plugin install think-spec@thinkspec
```

Type `/think-spec:` to see the ten commands.

## Quick start

In your project folder:

```
/think-spec:init a CLI to log study sessions and show streaks
/think-spec:specify log a study session with subject and minutes
/think-spec:implement
/think-spec:validate
```

`init` chains into `constitution`, and `specify` chains through `clarify`, `plan` and `tasks` while you answer yes. Every stage ends with a `Next:` line naming the command to run.

## What you get

- Ten slash commands covering twelve stages: init, constitution, specify, clarify, plan, tasks, implement, validate, maintain, finish.
- Five subagents: a read-only reviewer, a test designer, an implementer, a validator that runs everything and never edits, and a read-only security auditor.
- Plain Markdown in your repo: `AGENTS.md`, `docs/constitution.md`, and per feature `spec.md`, `plan.md`, `adr/`, `tasks.md`, `traceability.md`, `validation.md`.
- Checkable formats: EARS requirements with MoSCoW priority, ISO 25010 non-functional requirements, Given/When/Then acceptance criteria with concrete values.
- Traceability: each task cites its requirements, and `traceability.md` links each requirement to its tasks, its test and a dated passing run.
- Zero-dependency Node scripts that lint every artifact, plus an optional hook that lints files as they are written.
- Artifacts can be written in any language you pick in `init`.

## Example

From the plugin's reference example (a study-streak CLI):

```markdown
- FR-003 [unwanted] [must] IF the duration is not an integer between 1 and 600, THEN THE SYSTEM SHALL reject the session and state the valid range.
- AC-004 (FR-003) Given any state When I log "history" 0 Then nothing is saved and the range 1–600 is shown.
- [ ] T-005 [test] [P] (FR-003, AC-004) CLI test: `log history 0` exits with 2, shows the range 1–600 and writes nothing — test/cli.test.mjs
  Done when: the test exists and fails because `log` does not validate.
```

## Workflow

`init → constitution → specify → clarify → plan → tasks → implement → validate → maintain | finish`

Stages up to `tasks` only write documents, so they can chain when you say yes. `implement`, `validate`, `maintain` and `finish` change code or close work, so only you start them. Commands, agents and file layout are in [think-spec/README.md](think-spec/README.md).

## Compared with Spec-Kit and OpenSpec

Read from each project's README and repo; they may have changed since.

| | think-spec | [Spec-Kit](https://github.com/github/spec-kit) | [OpenSpec](https://github.com/Fission-AI/OpenSpec) |
|---|---|---|---|
| Form | Claude Code plugin | Python `specify` CLI | npm-installed CLI |
| Assistants | Claude Code only | 30+ | 30+ via slash commands |
| Structure | Per-spec folder: spec, plan, ADRs, tasks, traceability, validation | Spec, plan, tasks; `converge`, bug and assess extensions | Per-change folder: proposal, specs, design, tasks |
| Distinct points | EARS + MoSCoW + ISO 25010 formats, subagent roles, a dated test run recorded per requirement | Structured templates, constitution, analyze, checklist and `converge` commands | Lightweight, iterative flow; verification and brownfield support. Needs Node 20.19+ |

Pick Spec-Kit or OpenSpec if you use assistants other than Claude Code. Pick think-spec if you work in Claude Code and want stricter requirement formats and per-requirement test evidence. think-spec builds on Spec-Kit's ideas and some of its text (MIT, see [THIRD_PARTY_NOTICES](think-spec/THIRD_PARTY_NOTICES.md)).

## Troubleshooting

- Plugin not found: run the `marketplace add` command first. The marketplace is `thinkspec`, the plugin is `think-spec`.
- `node` not found: install Node.js 18+ and restart Claude Code so it sees the PATH.
- Permission prompts on every script call: let `init` add the rules, or add these to `permissions.allow` in `.claude/settings.json`:

```json
"Bash(node *think-spec*scripts*.mjs*)",
"PowerShell(node *think-spec*scripts*.mjs*)"
```

## Contributing

Bug reports and field reports are the most useful thing right now. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Not affiliated with GitHub or Anthropic.
