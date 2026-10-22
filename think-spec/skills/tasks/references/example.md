# Example: habits-cli, tasks 001

The tasks for the plan in the plan example (session logging: US-001 log with FR-001, FR-003, FR-004; US-002 streak with FR-002; NFR-001 atomic writes in `src/store.mjs`); `docs-language` `en`. US-001 holds two `[must]` FRs, so it is the MVP phase. Use it to calibrate length and tone, never as content for another project.

```markdown
---
spec: 001-session-logging
status: approved
created: 2026-10-17
updated: 2026-10-17
---
# Tasks 001 — Session logging

## Phase 1 — Setup

- [ ] T-001 (FR-001, FR-002) Create the CLI with empty `log` and `streak` dispatch — bin/habits.mjs
  Done when: `node bin/habits.mjs streak` exits with code 0.

Checkpoint: the CLI starts and recognises both commands.

## Phase 2 — Foundation

- [ ] T-002 [test] (NFR-001) Storage test: missing file → empty list; interruption between temp write and rename → previous file intact — test/store.test.mjs
  Done when: the test exists and fails because `src/store.mjs` does not exist.
- [ ] T-003 (NFR-001) Implement `load()` and `save()` with temp file + rename (ADR-001) — src/store.mjs
  Done when: test/store.test.mjs passes with `node --test`.

Checkpoint: data is saved without risk of corruption.

## Phase 3 — US-001 Log a session (FR-001, FR-003, FR-004) — MVP

- [ ] T-004 [test] [P] (FR-001, AC-001, FR-004, AC-005) Tests of `log()` with a fixed date: new session and duplicate merging — test/core.test.mjs
  Done when: the tests exist and fail because `log()` does not exist.
- [ ] T-005 [test] [P] (FR-003, AC-004) CLI test: `log history 0` exits with 2, shows the range 1–600 and writes nothing — test/cli.test.mjs
  Done when: the test exists and fails because `log` does not validate.
- [ ] T-006 (FR-001, FR-004) Implement the pure `log(sessions, subject, minutes, today)` with a normalised subject — src/core.mjs
  Done when: AC-001 and AC-005 pass.
- [ ] T-007 (FR-001, FR-003) Wire `log` into the CLI: validate 1–600, load, log, save and print "Saved: …" — bin/habits.mjs
  Done when: AC-004 passes and `log english 20` prints "Saved: english 20 min".

Checkpoint: logging works end to end and its tests pass.

## Phase 4 — US-002 See the streak (FR-002)

- [ ] T-008 [test] (FR-002, AC-002, AC-003) Tests of `streak(dates, today)`: three consecutive days and a broken streak — test/core.test.mjs
  Done when: the tests exist and fail because `streak()` does not exist.
- [ ] T-009 (FR-002) Implement `streak()` with the plan's algorithm — src/core.mjs
  Done when: AC-002 and AC-003 pass.
- [ ] T-010 (FR-002) Wire `streak` into the CLI and print "<n> days" — bin/habits.mjs
  Done when: with the data of AC-002, `streak` prints "3 days".

Checkpoint: both stories work together.

## Dependencies

- T-010 ← T-007
```

The `traceability.md` written with it:

```markdown
---
spec: 001-session-logging
updated: 2026-10-17
---
# Traceability 001 — Session logging

| ID | AC | Tasks | Test | Evidence |
|---|---|---|---|---|
| FR-001 | AC-001 | T-001, T-004, T-006, T-007 | test/core.test.mjs | pending |
| FR-002 | AC-002, AC-003 | T-001, T-008, T-009, T-010 | test/core.test.mjs | pending |
| FR-003 | AC-004 | T-005, T-007 | test/cli.test.mjs | pending |
| FR-004 | AC-005 | T-004, T-006 | test/core.test.mjs | pending |
| NFR-001 | — | T-002, T-003 | test/store.test.mjs | pending |
```

No polish phase was needed and no open questions remained, so those sections are absent. The one dependency line is there because stories are independent unless a line says otherwise: T-010 reuses the loading T-007 wires into the CLI.
