# Changelog

## 0.1.0 — 2026-10-18

First version with every stage: `init`, `constitution`, `specify`, `clarify` (spec, plan, tasks), `plan`, `tasks`, `implement`, `validate`, `maintain` and `finish`; agents `doc-reviewer`, `test-designer`, `implementer`, `code-validator` and `security-auditor`; shared zero-dependency scripts for state keys and every artifact, merged by `validate.mjs`; an opt-in `PostToolUse` hook (`validate_on_edit`) that lints artifacts Claude writes.

Not yet tried in a real Claude Code session end to end; each stage was dry-run with its scripts and agents.
