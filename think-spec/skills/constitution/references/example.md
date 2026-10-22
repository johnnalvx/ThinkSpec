# Example: habits-cli

A Python CLI to log study habits and compute streaks, maintained by a junior developer; `docs-language` is `en`. Use it to calibrate length and tone, never as content for another project.

## 1.0.0 (created)

```markdown
---
version: 1.0.0
ratified: 2026-10-16
amended: 2026-10-16
---
# Constitution — habits-cli

Python CLI to log study habits and compute streaks; maintained by a junior developer.

## Principles

1. **Simple stack:** Python 3.12 and the standard library; no dependency without approval.
2. **The spec rules:** no code without an FR/AC in the active spec asking for it.
3. **Separated logic:** `habits/core/` imports nothing from `habits/cli/`.
4. **Tests first:** every AC has a pytest test that fails before implementing.
5. **Local persistence:** a single JSON file; no database.
6. **Language:** code, tests, commits and user messages in English.

## Governance

- Prevails over any other practice: what contradicts it is fixed in the spec, plan or tasks, never by diluting a principle.
- Amendments: the AI proposes, the user approves; semver (MAJOR remove or redefine, MINOR add or tighten, PATCH wording).
```

11 content lines: the title and blank lines do not count.

## 1.1.0 (amended on 2026-11-02)

The user asks for clear errors. The draft adds one principle at the end, so the bump is MINOR:

```markdown
7. **Clear errors:** every error shows its cause on stderr and exits with a non-zero code.
```

Frontmatter becomes `version: 1.1.0`, `ratified: 2026-10-16`, `amended: 2026-11-02`. The chat report:

```
Constitution 1.0.0 → 1.1.0 (MINOR: one principle added).
+ 7. Clear errors
Open specs written with an earlier version: 001-session-logging (active) → /think-spec:clarify spec
```
