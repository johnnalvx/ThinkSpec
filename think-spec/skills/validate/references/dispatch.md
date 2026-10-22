# Dispatch prompts

What the validate skill sends each agent, and the result block it asks back. Fill the `<…>` parts; copy spec lines verbatim; give plan lines, never the whole plan. Both go out together, as two dispatches in one message. Pass `model` / `effort` only when the user named them.

## `think-spec:code-validator` — the whole feature

```
Validate the implementation of this spec against its requirements. Run everything; claim nothing you did not run.
Project root: <path>. Docs language: <tag>. Code language: <tag>.
Spec: specs/<id>/spec.md
Requirements and acceptance criteria (every FR and NFR except [wont]):
<the FR, NFR and AC lines>
Done criteria: <the spec's done-criteria bullets>
Constitution principles: <numbered lines, or none>
Plan (applicable lines): <structure, decisions, ADR paths, contract, test strategy>
Traceability rows: <the table rows>
Test command: <command>. Lint command: <command, or none>. Dependency audit: <command, or none>
Requirements the test runner cannot reach: <IDs and why (interface, mobile, visual), or none>
Return at most 40 lines, exactly:
Result: pass | fail
Suite: <command> → <passing>/<total> passing; failing: <test names, or none>
Lint: <pass | fail | not run — reason>. Audit: <pass | fail | not run — reason>
Requirements:
- <ID> — <test path › name | browser (desktop, mobile)> — pass | fail | missing | partial | not run — <evidence, one clause>
Manual: none | - <ID> — <steps to verify by hand>
Gaps: none | - [HIGH|MEDIUM|LOW] <missing|partial|contradicts|unrequested> <ID, principle or path> — <problem>
Trace: ok | - <ID> — <cell that does not match what ran>
```

## `think-spec:security-auditor` — the feature's code

```
Audit the code of this spec for security. Read only; report, never fix.
Project root: <path>. Docs language: <tag>.
Code in scope: <paths from the plan's structure and the tasks>
[unwanted] requirements: <FR lines, or none>
Security requirements: <NFR [security] lines, or none>
Constitution principles on security: <lines, or none>
Dependency manifests and lockfiles: <paths, or none>
Return at most 40 lines, exactly:
Result: clean | findings
Findings: none | - [HIGH|MEDIUM|LOW] <path:line or ID> — <risk, one clause> — <suggested fix>
Requirements: - <ID> — guarded | unguarded — <path:line>
```
