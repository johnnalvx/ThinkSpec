# EARS notation

Every FR is one sentence in one of the six EARS patterns (Easy Approach to Requirements Syntax). The line carries the pattern's tag: `- FR-001 [event] [must] WHEN …, THE SYSTEM SHALL ….` Keywords are written in capitals, in the docs language.

## Patterns

| Tag | Use for | Shape (English) |
|---|---|---|
| `ubiquitous` | always true, no trigger | THE SYSTEM SHALL <response>. |
| `event` | a response to a trigger | WHEN <trigger>, THE SYSTEM SHALL <response>. |
| `state` | behaviour while a state lasts | WHILE <state>, THE SYSTEM SHALL <response>. |
| `unwanted` | errors, invalid input, edge cases | IF <unwanted condition>, THEN THE SYSTEM SHALL <response>. |
| `optional` | only when a feature or configuration is present | WHERE <feature is present>, THE SYSTEM SHALL <response>. |
| `complex` | a combination of the above | WHILE <state>, WHEN <trigger>, THE SYSTEM SHALL <response>. |

`THE SYSTEM` may be replaced by the product's name; use the same subject in every FR of the spec.

## Keywords by language

| Language | System + obligation | event | state | unwanted | optional |
|---|---|---|---|---|---|
| `en` | THE SYSTEM SHALL | WHEN | WHILE | IF … THEN | WHERE |
| `es` | EL SISTEMA DEBERÁ | CUANDO | MIENTRAS | SI … ENTONCES | DONDE |
| `pt` | O SISTEMA DEVERÁ | QUANDO | ENQUANTO | SE … ENTÃO | ONDE |
| `fr` | LE SYSTÈME DOIT | LORSQUE | TANT QUE | SI … ALORS | LÀ OÙ |
| `de` | DAS SYSTEM MUSS | WENN | SOLANGE | FALLS … DANN | SOFERN |

Another language: pick the closest equivalent once and use it in every spec of the project. The tag stays English whatever the language.

## Examples

| Tag | Good | Bad, and why |
|---|---|---|
| `ubiquitous` | THE SYSTEM SHALL show the total minutes studied this week. | The system should be user-friendly. — vague, not checkable |
| `event` | WHEN the user saves a session, THE SYSTEM SHALL add it to today's total. | WHEN the user saves, THE SYSTEM SHALL write a row to the `sessions` table. — implementation (HOW) |
| `state` | WHILE a timer is running, THE SYSTEM SHALL show the elapsed time every second. | WHILE a timer is running, THE SYSTEM SHALL show the time and block other timers. — two behaviours: split into two FRs |
| `unwanted` | IF the duration is 0 or negative, THEN THE SYSTEM SHALL reject the session and show the reason. | THE SYSTEM SHALL handle errors properly. — no condition, no response |
| `optional` | WHERE reminders are enabled, THE SYSTEM SHALL notify at the configured time. | WHERE possible, THE SYSTEM SHALL notify. — "possible" is not a feature |
| `complex` | WHILE offline, WHEN the user saves a session, THE SYSTEM SHALL keep it and sync it on reconnection. | WHEN offline or slow, THE SYSTEM SHALL work quickly. — vague state and response |

## Edge cases become `unwanted` FRs

Each edge case the spec covers is its own `[unwanted]` FR with its AC: the condition after IF, the observable response after THEN. "Show an error" is a response only when the requirement says what the user sees or what state is kept.
