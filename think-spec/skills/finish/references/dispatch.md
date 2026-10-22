# Dispatch prompts

What the finish skill sends each agent, and the result block it asks back. Fill the `<…>` parts; give spec paths, never whole specs (the agents read them). Both go out together, as two dispatches in one message. Pass `model` / `effort` only when the user named them.

## `think-spec:code-validator` — every closed spec

```
Validate the whole project against its closed specs. Run everything; claim nothing you did not run.
Project root: <path>. Docs language: <tag>. Code language: <tag>.
Closed specs (read each spec.md, plan.md, traceability.md): <specs/NNN-short-name/ paths>
Superseded specs (ignore their requirements): <ids, or none>
Constitution principles: <numbered lines, or none>
Test command: <command>. Lint command: <command, or none>. Dependency audit: <command, or none>
Requirements the test runner cannot reach: <spec › IDs and why, or none>
For every FR and NFR except [wont] of every closed spec: its test exists, asserts its AC, and passes. For every spec: its done criteria are met, and its spec and plan still describe the code: a requirement the code does differently, or a plan structure path or decision the code no longer follows, is `contradicts`; code no spec or plan asks for is `unrequested`.
Return at most 40 lines, exactly:
Result: pass | fail
Suite: <command> → <passing>/<total> passing; failing: <test names, or none>
Lint: <pass | fail | not run — reason>. Audit: <pass | fail | not run — reason>
Specs:
- <spec id> — <passing>/<live> requirements pass — criteria <met | not met: which>
Manual: none | - <spec id › ID> — <steps to verify by hand>
Gaps: none | - [HIGH|MEDIUM|LOW] <missing|partial|contradicts|unrequested> <spec id › ID, plan path or code path> — <problem>
```

## `think-spec:security-auditor` — all the code

```
Audit the whole project's code for security. Read only; report, never fix.
Project root: <path>. Docs language: <tag>.
Code in scope: <every path of every closed spec's plan structure, plus other source folders>
Specs to read for [unwanted] FRs and [security] NFRs: <specs/NNN-short-name/spec.md paths of the closed specs>
Constitution principles on security: <lines, or none>
Dependency manifests and lockfiles: <paths, or none>
Return at most 40 lines, exactly:
Result: clean | findings
Findings: none | - [HIGH|MEDIUM|LOW] <path:line or spec id › ID> — <risk, one clause> — <suggested fix>
```
