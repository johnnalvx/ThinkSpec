# Requirements, priorities and acceptance criteria

## FR or NFR

- **FR** (functional): something the system does in response to a trigger, a state or a condition. One behaviour per line, in EARS (`ears.md`).
- **NFR** (non-functional): a measurable quality of the whole feature (how fast, how available, how accessible). It is measurable: a number with a unit, a named standard, or a condition a test can check: "95% of searches answer in under 1 s", "meets WCAG 2.2 AA", "no saved session is lost after a crash". A quality that cannot be measured is quantified or dropped.

A quality that only one behaviour needs ("the export finishes in under 5 s") can stay in that FR's sentence; an NFR applies across the feature. The spec states the quality the user perceives; the plan decides the technology.

## ISO 25010:2023 categories (NFR tag)

| Tag | Covers | Example |
|---|---|---|
| `functional-suitability` | correctness and completeness of results | Totals match the sum of the sessions to the minute |
| `performance-efficiency` | time, resources, capacity | The weekly view opens in under 1 s with 5 years of data |
| `compatibility` | coexisting and exchanging data with other systems | Exports open in any spreadsheet as UTF-8 CSV |
| `interaction-capability` | learnability, operability, accessibility, error protection | Every action is reachable by keyboard |
| `reliability` | availability, fault tolerance, recoverability | No saved session is lost after a crash |
| `security` | confidentiality, integrity, authenticity, accountability | Only the owner can read their sessions |
| `maintainability` | modularity, testability, ease of change | Each AC has an automated test |
| `flexibility` | adapting to platforms, installing, scaling | Runs on Windows, macOS and Linux |
| `safety` | avoiding harm to people or the environment | A destructive action asks for confirmation |

## MoSCoW (tag on every FR and NFR)

| Tag | Meaning |
|---|---|
| `must` | without it the feature misses its goal; the iteration fails without it |
| `should` | important, but a workaround exists; may slip to the next iteration |
| `could` | desirable; the first to cut when time runs short |
| `wont` | agreed not to do now. specify writes exclusions in the out-of-scope section instead |

Most FRs of a well-scoped spec are `must`; when everything is `must`, ask which ones the user could live without.

## Acceptance criteria

- Line: `- AC-001 (FR-001) Given … When … Then …`, keywords in the docs language (table below), one line each.
- Every FR has at least one AC; an `[unwanted]` FR gets its own.
- An AC is a concrete example: real values ("Given 2 sessions of 30 min today"), one action, an observable result ("Then the total shows 60 min"). It is what test-designer turns into a test before code exists.
- An AC never adds behaviour its FR lacks; new behaviour is a new FR.

| Language | Given | When | Then | And |
|---|---|---|---|---|
| `en` | Given | When | Then | And |
| `es` | Dado | Cuando | Entonces | Y |
| `pt` | Dado | Quando | Então | E |
| `fr` | Étant donné | Quand | Alors | Et |
| `de` | Gegeben sei | Wenn | Dann | Und |

Other languages: the official Gherkin keywords of that language.

## Vague words

Replace each with the observable fact it stands for, or move the quality to an NFR with a number: *fast, quick, easy, intuitive, user-friendly, simple, robust, secure, scalable, flexible, appropriate, properly, as needed, etc., and/or*.
