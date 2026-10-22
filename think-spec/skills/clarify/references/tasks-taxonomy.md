# Tasks ambiguity taxonomy

Scan `tasks.md` and `traceability.md` against each category and mark it **Clear**, **Partial** or **Missing**. A Partial or Missing category becomes a candidate question only when its answer changes a task, its order, its done-when line or a phase. Rank candidates by impact × uncertainty: a `must` FR without a task outranks a vague done-when on a polish task.

| Category | Look for | An answer goes to |
|---|---|---|
| Coverage | an FR, NFR, AC or plan structure line with no task; a task citing nothing it really serves | a new task in the phase of its story, or the task's IDs |
| Test first | an AC or NFR without a `[test]` task; a `[test]` task after the code it covers in its phase | a new `[test]` task, the order |
| Size | a task beyond about 30 minutes, with two goals or two paths; a done-when nobody can check | the task, split; its done-when line |
| Dependencies and `[P]` | a task needing one that comes later; a cycle; `[P]` tasks next to each other sharing a path or needing one still pending; a cross-story need without a dependency line | the order, the `[P]` tag, the dependencies section |
| Plan fidelity | a path outside the plan's structure; a task contradicting a plan decision, contract or ADR; a technology the plan does not name | a plan gap when the plan lacks the design (see below); otherwise the task, rewritten |
| Spec fidelity | a task adding behaviour the spec lacks; a doubtful story ↔ FR mapping | a spec gap when a user would notice it (see below); otherwise the phase the FR sits in |
| MVP and checkpoints | a first story phase that cannot be used on its own; a checkpoint that names no observable result; `TODO`, `???` or vague words | the phase order, the checkpoint line |

## think-spec checks

Each failure is a finding; the format ones are fixed without a question when meaning does not change.

- **Format**: `tasks.mjs check` errors (frontmatter, task line format, IDs that do not exist in the spec, missing done-when lines, coverage, test order, `[P]` paths, dependency lines, traceability rows, marker count).
- **Traceability**: one row per FR and NFR except `[wont]`, rebuilt from the `matrix` of `tasks.mjs check` after every edit to `tasks.md`; evidence cells stay as they are unless the row's tasks changed.

## Spec and plan gaps

A question whose answer a user would notice as behaviour belongs to the spec; one that needs a module, decision, contract or test layer the plan lacks belongs to the plan. Never ask either here: report it and recommend `/think-spec:clarify spec` or `/think-spec:clarify plan`. A HIGH or MEDIUM gap blocks the tasks' approval until the upstream artifact is settled and `/think-spec:tasks` updates the list. A question that builds on a gap's answer waits for it.
