# Example: habits-cli, spec 001

A CLI to log study habits and compute streaks; `docs-language` is `en`, constitution 1.0.0. The request was "I want to log study sessions and see my streak". Two questions were asked (duplicate sessions, what breaks a streak); everything else became an assumption. Use it to calibrate length and tone, never as content for another project.

```markdown
---
id: 001-session-logging
title: Session logging
status: draft
constitution_version: 1.0.0
created: 2026-10-16
updated: 2026-10-16
---
# Spec 001 — Session logging

## Context and goal

People who study on their own lose consistency because they cannot see their progress. Logging each session and seeing the streak of consecutive days gives them a daily reason to come back.

**Users:** one person who studies alone and uses the terminal.

## User stories

- US-001 As a student I want to log a session with its subject and duration so that I keep track of what I study.
- US-002 As a student I want to see my current streak so that I stay consistent.

## Functional requirements

- FR-001 [event] [must] WHEN the user logs a session with a subject and a duration in minutes, THE SYSTEM SHALL save it with today's date.
- FR-002 [event] [must] WHEN the user asks for their streak, THE SYSTEM SHALL show the number of consecutive days with at least one session, ending today or yesterday.
- FR-003 [unwanted] [must] IF the duration is not an integer between 1 and 600, THEN THE SYSTEM SHALL reject the session and state the valid range.
- FR-004 [unwanted] [should] IF a session with the same subject already exists today, THEN THE SYSTEM SHALL add the duration to that session instead of creating another one.

## Non-functional requirements

- NFR-001 [reliability] [must] No saved session is lost if the program is interrupted while logging.

## Acceptance criteria

- AC-001 (FR-001) Given there are no sessions today When I log "math" 30 Then today has one math session of 30 minutes.
- AC-002 (FR-002) Given sessions yesterday, the day before and today When I ask for my streak Then it shows 3 days.
- AC-003 (FR-002) Given sessions only 3 and 2 days ago When I ask for my streak Then it shows 0 days.
- AC-004 (FR-003) Given any state When I log "history" 0 Then nothing is saved and the range 1–600 is shown.
- AC-005 (FR-004) Given an english session of 20 minutes today When I log "english" 15 Then today has a single english session of 35 minutes.

## Assumptions

- The day is counted in the machine's local time.
- One person uses each installation.

## Out of scope

- Editing or deleting past sessions.
- Per-subject statistics and charts.

## Done criteria

- Every AC has a passing test.
- Manual demo: log three sessions and see the streak.
```

No open questions remained, so that section is absent; so would be Non-functional requirements or Assumptions if none applied.
