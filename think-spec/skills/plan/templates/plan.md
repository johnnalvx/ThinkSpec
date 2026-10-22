---
spec: {{NNN-short-name}}
status: draft
constitution_version: {{semver or none}}
created: {{YYYY-MM-DD}}
updated: {{YYYY-MM-DD}}
---
# {{Plan}} {{NNN}} — {{Feature name}}

## {{Summary}}

{{2–3 sentences: the technical approach and the shape of the solution.}}

## {{Technical context}}

- **{{Language/version}}:** {{…}}
- **{{Dependencies}}:** {{only what is added or relied on; "none" when none}}
- **{{Storage}}:** {{… or N/A}}
- **{{Testing}}:** {{framework and how tests run}}
- **{{Platform}}:** {{where it runs}}
- **{{Constraints}}:** {{limits from AGENTS.md, the constitution or the environment}}

## {{Constitution}}

- {{N. Principle name}}: {{complies — how}} | {{exception — why it is needed — simpler alternative rejected because …}}

## {{Structure}}

- `{{path}}` → {{responsibility}} ({{FR-###, NFR-###}})

## {{Data model}}

{{Entities, fields, validation rules and states, then one example.}}

## {{Key algorithms}}

{{Numbered pseudocode per algorithm, headed by the FR it serves.}}

## {{Interface contract}}

{{Commands, endpoints or file formats: inputs, outputs, errors, exit or status codes, guarantees.}}

## {{NFR response}}

- NFR-### → {{how the design meets it}} → {{how it is verified}}

## {{Decisions}}

- {{Decision}} — {{instead of <alternative>}} — {{because <reason>}} ({{FR-### or principle}}) {{[ADR-###]}}

## {{Test strategy}}

- **{{Layer}}** ({{tool}}): {{what it covers}} ({{AC-### or FR-###}})

## {{Open questions}}

- [CLARIFY: {{question}}] ({{FR-### or section}})
