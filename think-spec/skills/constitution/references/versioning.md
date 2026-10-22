# Versioning and amendments

Read when `docs/constitution.md` already exists.

## Version bump

Compare the approved draft with the current file, principle by principle:

| Bump | When | Example |
|---|---|---|
| MAJOR | a principle is removed or redefined, so something that complied before may not comply now | "No dependencies" → "Dependencies allowed from the approved list" |
| MINOR | a principle is added, or an existing one is tightened or expanded | add "Every error exits non-zero" |
| PATCH | wording only: every project that complied before still complies, and vice versa | fix a typo, rename a principle without changing its rule |

- Several changes at once: the largest bump wins.
- Ambiguous: propose the type with its reason and let the user confirm.
- Principle numbers never change: new principles go at the end, and a removed principle's number is not reused (the list skips it), so plans and specs that cite "principle N" keep their meaning.
- The Governance section and the context line follow the same table.

## Dates

- `ratified`: the first adoption date; it never changes.
- `amended`: today on every written change (the creation date on 1.0.0).
- Nothing approved to change: the file stays byte-identical, version and `amended` included.

## Impact report (chat only)

After writing an amendment, tell the user in the docs language:

- version old → new, bump type and its one-line reason;
- what changed, one line per principle (added / changed / removed);
- `staleSpecs` from `constitution.mjs status`: open specs written under an older MAJOR.MINOR. Suggest `/think-spec:clarify spec` for the active one; the others are reviewed when they become active. On a PATCH there are none;
- `unversionedSpecs`, when not empty: open specs with no valid `constitution_version`;
- topics left out because they are still undecided.

The report is never written into the constitution file.
