# Contributing

think-spec is v0.1.0 and has not been exercised end to end in real Claude Code sessions. The most useful contribution is to try it on a small feature and report what happened.

- **Test it.** Run `/think-spec:init` in a scratch project and go as far as you can. Open a field report or bug report issue with the stage, what you expected and what happened.
- **Suggest changes.** Use the feature request template and say which stage it touches.
- **Send a pull request.** For anything beyond a typo, open an issue first.

Before a pull request:

1. Read [think-spec/CONVENTIONS.md](think-spec/CONVENTIONS.md).
2. Plugin files are in English. Scripts use Node 18+ and the standard library only.
3. If you touch an example artifact, lint it with `node think-spec/scripts/validate.mjs check` from a project that contains it.
4. Add a line to [think-spec/CHANGELOG.md](think-spec/CHANGELOG.md).
5. If you adapt text from another project, record it in [think-spec/THIRD_PARTY_NOTICES.md](think-spec/THIRD_PARTY_NOTICES.md).

Contributions are released under the [MIT license](LICENSE).
