---
name: init
description: think-spec stage 1 (init). Sets up spec-driven development in a project by writing its AGENTS.md (with the think-spec state keys) and the CLAUDE.md import. Use when the user wants to start or adopt think-spec in a project, or to refresh its AGENTS.md.
argument-hint: "[project purpose or notes]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" *), PowerShell(node *think-spec*scripts*agent-context.mjs*)
---

# think-spec init

Prepare the current project root for think-spec. `AGENTS.md` is the project's main agent document and single source of truth: short and to the point, read first on every request. `CLAUDE.md` only imports it with `@AGENTS.md`. AGENTS.md carries the think-spec **state keys**. Besides those two files, init writes only the permission rules the user accepts (step 6): `specify` creates `specs/` with the first spec, and the constitution (`docs/constitution.md`) is the next stage's work.

User notes: $ARGUMENTS

## Ground rules

- **Language.** Until the docs language is settled, talk in the language the user writes in; afterwards, in the first tag of `docs-language`. AGENTS.md prose and headings are written in that language.
- **User content is the user's.** Existing text stays byte-identical unless the user approves that specific change.
- **Questions.** One per message, each with a recommended answer the user can accept in one word. Ask only what files, `$ARGUMENTS` or existing state keys cannot answer.
- **Short and to the point.** AGENTS.md holds only what an agent cannot find out by itself: exact commands, conventions, limits, the mandatory end-of-task check. Point to README or docs instead of restating them. A fact nobody knows yet is written as "pending; defined in the plan" (in the docs language); its section stays.
- **State keys** are hidden comments at the end of a line, `<!-- ts:<key> <value> -->`, holding a language-neutral value while the visible text is in the docs language. Keys: `version`, `code-language`, `docs-language`, `ui-language` (only when there is a UI), `active-spec`, `stage`, `constitution`. Language keys take comma-separated BCP 47 tags (`es`, `es,en`).
- **The script checks the keys.** Run it from the project root as `node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs" <command>`; it prints JSON. `status` inspects (read-only); `scaffold` adds `@AGENTS.md` to `CLAUDE.md`, creating the file if needed; `set key=value … [key.text=<visible text>]` validates and rewrites keys, and fills `version` from the plugin. A non-zero exit means stop and show the user the message.

## Steps

### 1. Inspect

Run `status`. Done when you know: `mode` (greenfield or brownfield), which of `AGENTS.md` / `CLAUDE.md` exist and whether `CLAUDE.md` imports AGENTS.md, which state keys exist (`agentsMd.keys`, `missing`, `duplicates`, `invalid`), and whether `docs/constitution.md` exists.

- `duplicates` or `invalid` non-empty: show them to the user, ask them to fix those lines, and stop.
- All required keys present means a **re-run**: their values are settled. Keep them, skip the questions they answer, and limit the run to what is missing or stale.

### 2. Survey (brownfield only)

Read `${CLAUDE_SKILL_DIR}/references/brownfield.md` and follow it. Done when every survey section holds evidence-backed facts or an explicit "unknown".

Greenfield: read `README*` and `docs/` if `status.docs` lists them; nothing else to survey.

### 3. Ask

In this order, skipping any question the evidence, `$ARGUMENTS` or existing keys already settle:

1. **Name and purpose**: the project name and 2–3 sentences on what it is, for whom, its architecture and technologies. Recommend text drawn from `$ARGUMENTS`, the README or the survey; with none of those, ask openly. Unknown architecture or technology stays "pending".
2. **Languages**, one answer for all areas: code (identifiers, comments, docstrings, test names, commits), docs (documentation, constitution, specs, plans) and interface. Recommend code in English and docs and interface in the language the user writes in; in brownfield, recommend what the survey's LANGUAGES section shows. Several languages in one area are a list (`es,en`). No interface means no `ui-language` line.
3. **Only CLAUDE.md exists with content**: move that content into AGENTS.md, leaving `CLAUDE.md` as just `@AGENTS.md`? Recommend yes. On no, the content stays in CLAUDE.md under the import line.
4. **AGENTS.md exists and does not follow the template**: show the restructured file (see `references/brownfield.md`); apply it? Recommend yes when nothing is lost.
5. **Rules**: show the template's default rules in the docs language and ask the user to accept or edit them, and to add project-specific limits (what not to touch, what not to add without asking). Recommend the defaults plus any limits the survey found.
6. **When you finish any task**: show the template's default checks, with the real test and lint commands or "pending"; accept or edit? Recommend the defaults.

Done when every applicable question has an answer.

### 4. Write AGENTS.md

- **No AGENTS.md, or restructure approved**: fill `${CLAUDE_SKILL_DIR}/templates/agents.md`. Replace every `{{…}}` in the docs language, translating headings and labels. Keep each state-key comment at the end of its line, with these values: `version` = `status.pluginVersion`, the language tags from question 2, `active-spec none`, `stage init` (visible: init plus the next command `/think-spec:constitution`), `constitution none`. Drop the `ui-language` line when there is no interface, and any command bullet with no counterpart in the project.
- **Moving CLAUDE.md content** (question 3 yes): place it in AGENTS.md under the sections it fits, words unchanged (no translation), then reduce CLAUDE.md to `@AGENTS.md`.
- **Existing AGENTS.md kept as is** (question 4 no): add the state-key lines it lacks, shaped as in the template: language lines under its style section, the others under its rules section, and at the end when it has no such section; plus the `version` comment under its title.

Done when no `{{` remains in AGENTS.md and every fact in it comes from evidence or the user.

### 5. Scaffold and check the keys

Run `scaffold`, then `set` with the values you wrote (`code-language=… docs-language=… stage=init active-spec=none constitution=none`, plus `ui-language=…` when present). On a re-run, pass only keys that changed; when `stage` shows a later stage, leave it.

Done when a final `status` shows `missing`, `duplicates` and `invalid` empty and `claudeMd.importsAgents` true.

### 6. Permissions

A skill's `allowed-tools` covers its script calls only in the turn that invokes it; every later turn would prompt for each `node … think-spec … .mjs` call. When `.claude/settings.json` lacks them, offer these two entries for its `permissions.allow` array, shown as they will be written (recommend yes):

```
"Bash(node *think-spec*scripts*.mjs*)",
"PowerShell(node *think-spec*scripts*.mjs*)"
```

On yes, add them, creating the file, the `permissions` object or the `allow` array as needed; every other setting stays as it was. On no, mention that the README lists them for later.

### 7. Report and hand off

In the docs language, briefly:

- files created or changed, one line each;
- brownfield: the guardrail candidates for the constitution and the survey's unknowns;
- ask: start the constitution now? Recommend yes. On yes, invoke the `think-spec:constitution` skill, passing the guardrail candidates as its argument when there are any. On no, the handoff below is the way back.

End with the handoff as the final line, `Next` in the docs language:

```
Next: /think-spec:constitution
```
