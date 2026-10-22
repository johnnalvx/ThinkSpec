# Plan ambiguity taxonomy

Scan the plan and its ADRs against each category and mark it **Clear**, **Partial** or **Missing**. A Partial or Missing category becomes a candidate question only when its answer changes a module, a decision, a contract or a test. Rank candidates by impact × uncertainty: an unjustified constitution exception outranks two vague dependency versions.

| Category | Look for | An answer goes to |
|---|---|---|
| Technical unknowns | `[CLARIFY` lines; a language, version, dependency, storage or test tool left vague | technical context |
| Coverage | an FR or NFR with no module; an NFR with no design response or no verification | structure, NFR response |
| Decisions | a decision without the alternative it rejected or without a reason; a hard-to-reverse decision (architecture, storage, external dependency, public interface) without an ADR | decisions, a new `adr/` file |
| Constitution | a principle without its line; an exception without a reason or a rejected simpler alternative | constitution |
| Spec fidelity | behaviour the spec lacks, or a module that changes what an FR or AC says; two plan sections, or the plan and an ADR, that contradict each other | a spec gap when a user would notice it (see below); otherwise the plan line, rewritten |
| Dependencies and risks | an outside service without a failure path; a data migration; resource limits (size, time, memory) the design ignores | decisions, interface contract |
| Contract and data | an external interface without inputs, errors or exit/status codes; data without validation rules or an example | interface contract, data model |
| Testability | clock, randomness, network or file system the logic cannot receive as a parameter; an `[unwanted]` FR or an NFR without a test | test strategy, structure |
| Leftovers | `TODO`, `???`, vague words (*fast, simple, robust, scalable, appropriate, as needed, etc.*) | the line it sits on |

## think-spec checks

Each failure is a finding; the format ones are fixed without a question when meaning does not change.

- **Format**: `plan.mjs check` errors (frontmatter, IDs that do not exist in the spec, uncovered FR/NFR, ADR files and links, marker count).
- **Lines**: one line per module (`path → responsibility (IDs)`), per decision (`decision — instead of … — because … (ID or principle)`), per NFR response (`NFR → design → verification`), per test layer (tool and IDs).
- **ADR**: frontmatter `id`, `status`, `date`; context, decision, alternatives, consequences filled; a superseded ADR is kept and the new one names it.

## Spec gaps

A question whose answer a user would notice as behaviour and an AC would test (input the spec does not cover, a new message or result), or that changes a requirement or the out-of-scope section, belongs to the spec: never ask it here. Report it and recommend `/think-spec:clarify spec`; a HIGH or MEDIUM one blocks the plan's approval until the spec is settled and `/think-spec:plan` updates the plan. A question that builds on a spec gap's answer waits for it. Command names, file locations and formats the spec leaves open are design, asked here.
