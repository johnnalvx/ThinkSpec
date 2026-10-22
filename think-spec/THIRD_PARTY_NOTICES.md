# Third-party notices

## GitHub Spec-Kit

think-spec adapts ideas, workflow structure and some text from [GitHub Spec-Kit](https://github.com/github/spec-kit), commit `f6e72bc8523de8ec8368129cbdea78d45f27cef8`.

| think-spec file | Adapted from (Spec-Kit path) | How |
|---|---|---|
| `scripts/agent-context.mjs` | `extensions/agent-context/scripts/python/update_agent_context.py` | Only the idea of a tool-managed section in the agent context file; think-spec uses its own per-line state keys, written from scratch in Node |
| `skills/init/SKILL.md`, `skills/init/references/brownfield.md` | `docs/guides/existing-projects.md`, `extensions/agent-context/README.md` | Brownfield adoption sequence (baseline → guardrails → bounded first change) and multi-file context sync; rewritten |
| `skills/constitution/SKILL.md`, `skills/constitution/references/versioning.md` | `templates/commands/constitution.md` | Scope guard with deferred next actions, semver bump rules for governance, ratified / last-amended dates and the amendment impact report; rewritten, report moved to chat |
| `skills/constitution/templates/constitution.md` | `templates/constitution-template.md` | Principles → governance → version skeleton and the governance wording; reduced to one-line principles with frontmatter metadata |
| `skills/constitution/references/principles-menu.md` | `spec-driven.md` (the nine articles), `.specify/memory/constitution.md` | Optional principle topics (simplicity, anti-abstraction, integration testing, text interface, observability, versioning) and "fix the spec, not the principle"; rewritten as one-line examples |
| `skills/specify/SKILL.md` | `templates/commands/specify.md`, `templates/commands/checklist.md`, `docs/concepts/spec-of-specs.md` | Short-name generation, informed defaults recorded as assumptions, the 3-marker cap and its priority order (scope > security > UX > details), WHAT/WHY-not-HOW, the requirements-quality self-check, and proposing to split an epic into independent parts; rewritten, questions moved before drafting, checklist kept inside the skill |
| `skills/specify/templates/spec.md` | `templates/spec-template.md` | User stories, Given/When/Then acceptance scenarios, assumptions and optional sections dropped when empty; reduced and restructured around EARS FRs, ISO 25010 NFRs and frontmatter |
| `scripts/spec.mjs` | `scripts/python/create_new_feature.py` | Only the idea of computing the next `NNN` from existing spec folders; written from scratch in Node, no branches |
| `skills/specify/references/requirements.md` | `templates/commands/specify.md` (Success Criteria Guidelines) | Measurable, user-facing, technology-agnostic quality targets; rewritten as NFR guidance |
| `skills/clarify/SKILL.md` | `templates/commands/clarify.md` | At most 5 questions asked one at a time, each with a recommended option, a "why it matters" line and an options table; write-back after every answer with a one-line Q → A log; stop early; deferred items in the report; rewritten around the doc-reviewer findings, without session headings or the coverage table |
| `skills/clarify/references/spec-taxonomy.md` | `templates/commands/clarify.md` | The ambiguity taxonomy with Clear / Partial / Missing status and the impact × uncertainty ranking; reduced to WHAT/WHY categories and mapped to think-spec sections |
| `agents/doc-reviewer.md` | `templates/commands/analyze.md`, `templates/commands/checklist.md` | Read-only detection passes (duplication, ambiguity, underspecification, constitution alignment, inconsistency), the severity heuristic, and "test the requirements, not the implementation"; rewritten as a compact capped findings list |
| `skills/plan/SKILL.md` | `templates/commands/plan.md`, `presets/lean/commands/speckit.plan.md` | Technical context with unknowns marked, the constitution check before and after design with justified exceptions, decisions with rationale and rejected alternatives, data model / contracts / validation scenarios; rewritten as one plan.md with optional sections, ADRs instead of research.md, questions instead of a hard error, no hooks or branches |
| `skills/plan/templates/plan.md` | `templates/plan-template.md` | Summary, technical context fields, constitution check, project structure and complexity tracking (violation / why / simpler alternative rejected); reduced and extended with FR/NFR per module, NFR response, decision lines and test strategy |
| `skills/plan/references/contracts.md` | `docs/guides/contract-driven-development.md` | What a contract defines (inputs, outputs, errors, guarantees such as idempotency, compatibility), one authoritative owner, provider and consumer tests with negative cases; condensed to a single-repository reference |
| `skills/clarify/references/plan-taxonomy.md` | `templates/commands/clarify.md`, `templates/commands/analyze.md` | Clear / Partial / Missing scan with impact × uncertainty ranking (clarify) and the coverage and constitution passes (analyze), applied to the plan; categories written for think-spec |
| `skills/tasks/SKILL.md` | `templates/commands/tasks.md`, `presets/lean/commands/speckit.tasks.md`, `docs/concepts/complex-features.md` | Checklist task format with ID, `[P]` and file path; phases Setup → Foundational → one per user story → Polish; tests before models before services; data-model constraints quoted in tasks; MVP first; scoping big features; rewritten with FR/NFR citations, `[test]` tasks, done-when lines and traceability |
| `skills/tasks/templates/tasks.md` | `templates/tasks-template.md` | Phase skeleton with a checkpoint per phase and story phases marked MVP; reduced, sample tasks and strategy sections dropped |
| `skills/clarify/references/tasks-taxonomy.md`, `agents/doc-reviewer.md` (`tasks` mode) | `templates/commands/analyze.md` | Coverage gaps (requirements without tasks, tasks without requirements), tasks naming files the plan lacks, task-ordering contradictions; rewritten as think-spec categories and passes |
| `skills/implement/SKILL.md` | `templates/commands/implement.md`, `presets/lean/commands/speckit.implement.md`, `docs/concepts/complex-features.md` | Pre-flight gate, artifact load order, phase-by-phase execution in task order, `[P]` tasks together only on different files, tests before code, halt on failure while successful parallel tasks stand, mark `[x]` per task, resume from the first unchecked task, a task range or phase per run, per-task delegation to sub-agents; rewritten with test-designer / implementer roles, self-verified red → green, traceability evidence and gap routing, without checklists, ignore files or hooks |
| `skills/validate/SKILL.md`, `agents/code-validator.md` | `templates/commands/converge.md` | Code assessed against spec, plan, tasks and constitution as the sole source of intent; requirement inventory; gap types `missing` / `partial` / `contradicts` / `unrequested`; severity by gap and requirement weight; "completion claims are not evidence"; append-only remediation tasks in a new phase, never rewriting existing ones; byte-for-byte no-op when nothing remains; rewritten with test runs per requirement, a verdict, traceability evidence and closing the spec |
| `skills/validate/templates/validation.md`, `skills/validate/SKILL.md` | `extensions/bug/commands/speckit.bug.test.md` | Verification report with a verdict and a checks table (command, result), checks that could not run recorded as such with a reason instead of a fabricated result, no over-claiming; reduced to think-spec's requirement table |
| `agents/security-auditor.md` | `extensions/bug/commands/speckit.bug.assess.md` (URL Trust Policy) | Refused schemes, loopback, link-local, private ranges and cloud metadata hosts, and fetched content treated as data, never instructions; turned from the agent's own fetch policy into an audit criterion for the project's code |
| `skills/maintain/SKILL.md` | `docs/guides/evolving-specs.md`, `docs/concepts/spec-persistence.md` | The flow-forward / living / flow-back persistence models and the rule that accepted changes go back into the artifacts before delivery; reduced to one mixed rule (change in place, new capability, superseding rewrite) |
| `skills/maintain/SKILL.md` (bug path) | `extensions/bug/README.md`, `extensions/bug/commands/speckit.bug.assess.md`, `speckit.bug.fix.md` | Assess → fix → test separation, symptom / expected / reproduction / suspected code paths, no invented reproduction steps, a test that locks the fix in, minimal change; rewritten as a fix phase in `tasks.md` run by implement and validate, without per-bug report files |
| `skills/maintain/SKILL.md` (new feature) | `extensions/assess/README.md`, `extensions/assess/commands/speckit.assess.intake.md`, `speckit.assess.decide.md` | A discovery gate before specify with a go / needs-clarification / kill verdict, evidence against the idea and the cost of inaction; reduced to at most three chat questions, no files |
| `skills/maintain/templates/roadmap.md`, `skills/specify/SKILL.md` (roadmap rows) | `docs/concepts/spec-of-specs.md` | The roadmap of independently specified parts with stable IDs, intent, scope boundary, dependencies and a link to each sub-spec; status column dropped (derived from the spec) |

Stages added later append rows here.

### License

```
MIT License

Copyright GitHub, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

"Spec Kit" and GitHub are names of their owners; think-spec is not affiliated with or endorsed by GitHub.
