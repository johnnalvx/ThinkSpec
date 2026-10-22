# AGENTS.md — {{project name}}
<!-- ts:version {{think-spec version}} -->

## {{Project}}

{{2–3 sentences: what the project is and for whom, its architecture and technologies. Mark architecture or technology that is planned but not confirmed as such.}}

## {{Commands}}

- {{Run}}: `{{command}}`
- {{Tests}}: `{{command}}`
- {{Lint/format}}: `{{command}}`

## {{Style and conventions}}

- {{Language and version, naming conventions, other style rules backed by evidence or the user.}}
- **{{In <code language name>}}:** {{identifiers, comments, docstrings, test names and commit messages}}. <!-- ts:code-language {{tags}} -->
- **{{In <docs language name>}}:** {{documentation, constitution, specs and plans}}. <!-- ts:docs-language {{tags}} -->
- **{{Interface}}:** {{UI languages}}. <!-- ts:ui-language {{tags}} -->

## {{Rules}}

- {{Read `docs/constitution.md` and the active spec in `specs/` before touching code.}}
- **{{Active spec}}:** {{none}} <!-- ts:active-spec none -->
- **{{Current stage}}:** init; {{next}}: `/think-spec:constitution` <!-- ts:stage init -->
- **{{Constitution}}:** {{pending}} <!-- ts:constitution none -->
- {{Do not add dependencies or choose technologies without asking.}}
- {{Strict scope: deliver only what was asked; create no specs, plans, tasks or ADRs without an explicit request; implement nothing outside the active spec. Edit `specs/` only on request.}}
- {{Traceability: all code and every test references the FR/AC it implements (e.g. `FR-001`, `AC-002`).}}
- {{Project-specific limits: what not to touch, what not to add without asking.}}

## {{When you finish any task}}

- {{Run the tests and the lint; they must pass.}}
- {{Check the work against the active spec and its acceptance criteria; nothing may fall outside it.}}
- {{Report what you verified, what you did not, and what is still pending.}}
