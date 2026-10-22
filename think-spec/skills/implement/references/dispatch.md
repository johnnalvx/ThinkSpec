# Dispatch prompts

What the implement skill sends each agent, and the result block it asks back. Fill the `<…>` parts; copy spec lines verbatim; give plan lines, never the whole plan. Pass `model` / `effort` only when the user named them.

## `think-spec:test-designer` — the `[test]` tasks of one phase

```
Write the tests of these [test] tasks and confirm they are red.
Project root: <path>. Docs language: <tag>. Code language: <tag>.
Tasks:
<each task line with its done-when line>
Requirements and acceptance criteria:
<the FR/NFR/AC lines the tasks cite>
Plan (applicable lines): <test strategy, structure, contract, data-model lines>
Test command: <command>
Tests already written: <paths, or none>
Return at most 40 lines, exactly:
Result: red | blocked
Tests:
- T-### <path> — <test names> — fails: <missing behaviour, one clause> | covered: <AC it asserts> (only when the done-when says the behaviour already exists)
Suite: <command> → <failing> failing, <passing> passing
Issues: none | - [spec|plan|task] <ID> — <problem> — <question>?
```

## `think-spec:implementer` — one code task

```
Implement this task until it is green.
Project root: <path>. Docs language: <tag>. Code language: <tag>.
Task:
<task line with its done-when line>
Requirements and acceptance criteria:
<the FR/NFR/AC lines it cites, and the AC its tests cover>
Plan (applicable lines): <structure line, decisions, ADR paths, data model, algorithm, contract>
Tests that cover it: <paths and test names, or none (setup)>
Test command: <command>. Lint command: <command, or none>
Protected paths (read-only): <every [test] task path>, specs/
Return at most 40 lines, exactly:
Result: done | blocked
Files: <path> (created|edited), …
Suite: <command> → <passing>/<total> passing; failing: <test names, or none>
Done-when: met | not met — <why>
Issues: none | - [test|spec|plan|task] <ID or path> — <problem> — <question>?
```

Several `[P]` code tasks next to each other go out as separate dispatches in one message.
