# Example: habits-cli, plan 001

The plan for the spec in the specify example (session logging, FR-001…FR-004, NFR-001); `docs-language` `en`, constitution 1.0.0 with principles "1. No dependencies: only the Node 20 standard library", "2. Tests first: every AC has a `node --test` test", "3. Local data: nothing leaves the machine". One question was asked (where the data file lives); one decision earned an ADR. Use it to calibrate length and tone, never as content for another project.

```markdown
---
spec: 001-session-logging
status: approved
constitution_version: 1.0.0
created: 2026-10-17
updated: 2026-10-17
---
# Plan 001 — Session logging

## Summary

A dependency-free Node CLI with three layers: an argument parser, a pure logic core that takes "today" as a parameter, and JSON storage with atomic writes.

## Technical context

- **Language/version:** JavaScript, Node 20 (ES modules).
- **Dependencies:** none.
- **Storage:** one JSON file at `~/.habits/sessions.json`.
- **Testing:** `node --test`, files `test/*.test.mjs`.
- **Platform:** Windows, macOS and Linux, terminal.
- **Constraints:** no network; one user per installation.

## Constitution

- 1. No dependencies: complies, only `node:fs`, `node:path`, `node:os`.
- 2. Tests first: complies, every AC has its test in the test strategy.
- 3. Local data: complies, the file lives in the user's home directory.

## Structure

- `bin/habits.mjs` → argument parser, messages and exit codes (FR-001, FR-002, FR-003)
- `src/core.mjs` → pure logic: log, merge duplicates, compute streak (FR-001, FR-002, FR-004)
- `src/store.mjs` → load and save JSON with atomic writes (FR-001, NFR-001)
- `test/` → one file per module

## Data model

Session: `date` (YYYY-MM-DD, local time), `subject` (text, compared ignoring case and surrounding spaces), `minutes` (integer 1–600).

    { "version": 1, "sessions": [ { "date": "2026-10-17", "subject": "english", "minutes": 35 } ] }

## Key algorithms

Streak (FR-002), with `today` injected:
1. Take the distinct dates that have a session, newest first.
2. If the newest is earlier than yesterday → 0.
3. Count backwards while each date is the day before the previous one.

## Interface contract

- `habits log <subject> <minutes>` → stdout "Saved: <subject> <total> min", exit 0.
- `habits streak` → stdout "<n> days", exit 0.
- Duration outside 1–600 (FR-003) → stderr with the valid range, exit 2, nothing is written.

## NFR response

- NFR-001 → write to a temporary file and rename it over the original → a test that interrupts between write and rename and checks the previous file is intact.

## Decisions

- Inject `today` into the core — instead of reading the clock inside — because streaks are tested without mocking dates (principle 2).
- Temporary file + rename — instead of writing in place — because an interruption must not corrupt the data (NFR-001) [ADR-001].
- Own `process.argv` parser — instead of a CLI library — because there are two commands (principle 1).

## Test strategy

- **Unit** (`node --test`): `core` with fixed dates — empty streak, alive through yesterday, broken, one day (AC-002, AC-003); duplicate merging (AC-005).
- **Storage** (`node --test`, temporary directory): missing file, valid file and interrupted write (NFR-001).
- **CLI** (`node --test` + `child_process`): exit codes and messages (AC-001, AC-004).
```

The ADR it links, `adr/ADR-001-atomic-write.md`:

```markdown
---
id: ADR-001
status: accepted
date: 2026-10-17
---
# ADR-001 — Atomic write of the sessions file

## Context

NFR-001 requires that no session is lost if the program is interrupted. Writing the JSON in place leaves a truncated file if the process dies halfway.

## Decision

Write to `sessions.json.tmp` and rename it over `sessions.json`.

## Alternatives

- Write in place — an interruption leaves the file corrupt.
- One file per session — avoids corruption but complicates the streak and the format.

## Consequences

- The rename is atomic on the same volume; the temporary file lives next to the original.
- An orphaned `.tmp` is ignored and overwritten on the next log.
```

Optional sections with nothing to say are absent; this plan has no open questions.
