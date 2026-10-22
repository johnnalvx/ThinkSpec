---
spec: {{NNN-short-name}}
verdict: {{pass | fail}}
validated: {{YYYY-MM-DD}}
---
# {{Validation}} {{NNN}} — {{Feature name}}

**{{Verdict}}:** {{met | not met}} — {{one line: why}}

## {{Checks}}

| {{Check}} | {{Command}} | {{Result}} |
|---|---|---|
| {{Suite}} | `{{test command}}` | {{passing}}/{{total}} |
| {{Lint}} | `{{lint command}}` | {{pass | fail | not run: reason}} |
| {{Artifacts}} | `validate.mjs check` | {{N errors}} |

## {{Requirements}}

| ID | {{Test}} | {{Result}} | {{Evidence}} |
|---|---|---|---|
| FR-### | {{test path › test name, or browser (desktop, mobile)}} | {{pass | fail | missing | partial | not run}} | {{one clause}} |

## {{Done criteria}}

- {{criterion from the spec}} — {{met | not met}} ({{IDs or check}})

## {{Findings}}

- [{{HIGH | MEDIUM | LOW}}] {{gap type or security}} {{ID or path:line}} — {{problem}}
