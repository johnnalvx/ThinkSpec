# Principles menu

Topics to draft principles from. A principle is **verifiable**: someone reading the code, the tests or the repo can say yes or no. Each one names a concrete thing (a version, a folder, a tool, a file, a count) and stays on one line.

Vague words fail that test: *clean, simple, fast, robust, secure, readable, good, appropriate, as needed*. Replace each with the observable fact it stands for.

## Defaults

Use these six unless the user or `$ARGUMENTS` names other topics. When one does not apply (no stored data, no user-facing messages), swap in a topic from the second list or a limit specific to the project.

| Topic | What makes it verifiable | Weak → strong |
|---|---|---|
| Simple stack | language + version, the allowed libraries, the rule for adding one | "Use a simple stack" → "Python 3.12 and the standard library; no dependency without approval" |
| The spec rules | code exists only for a FR/AC of the active spec | "Follow the spec" → "No code without a FR/AC of the active spec that asks for it" |
| Logic apart from interface | a folder or module that must not import another | "Keep logic separate" → "`app/core/` imports nothing from `app/cli/`" |
| Tests first | tool, what each AC gets, failing before code | "Write good tests" → "Every AC has a pytest test that fails before it is implemented" |
| Data persistence | where data lives, its format, what is excluded | "Store data properly" → "One local JSON file; no database" |
| Language of code and messages | the language per area | "Use consistent languages" → "Code, tests and commits in English; user messages in the product's language" |

## From Spec-Kit's articles

Offer one when the project clearly calls for it; never add them by default.

| Topic | What makes it verifiable | Example |
|---|---|---|
| No speculative abstraction | no layer or wrapper without a second real use | "No interface or wrapper with a single implementation" |
| Realistic integration tests | what runs for real instead of mocks | "API tests run against a real SQLite file, not mocks" |
| Observability | what errors and logs must show, where they go | "Every error prints its cause to stderr and exits non-zero" |
| Text interface | input/output contract of the tool | "Every command accepts `--json` and writes only JSON to stdout" |
| Versioning and breaking changes | the scheme and what a breaking change requires | "Public CLI follows semver; a breaking change needs a MAJOR and a note in the README" |
| Security and secrets | where secrets live, what never leaves the machine | "Secrets only in `.env`, which git ignores; no secret in logs" |

## Boundaries

- Framework rules (spec lifecycle, EARS, MoSCoW, ISO 25010, stage gates) are already enforced by think-spec; a principle never restates them.
- AGENTS.md facts (commands, paths) are pointed at, not copied. A principle that matches an AGENTS.md rule says the same thing, never something different.
- One rule per principle. Two rules that need an "and" are two principles, or one is cut.
