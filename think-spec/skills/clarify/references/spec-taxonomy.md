# Spec ambiguity taxonomy

Scan the spec against each category and mark it **Clear**, **Partial** or **Missing**. A Partial or Missing category becomes a candidate question only when its answer changes a requirement, an AC or a test. Rank candidates by impact × uncertainty: one unresolved security question outranks two cosmetic ones.

| Category | Look for | An answer goes to |
|---|---|---|
| Scope | the goal and who benefits; what is excluded; roles that behave differently | context and goal, user stories, out of scope |
| Behaviour | each user action and the system response; states and transitions the user sees | an FR (new or reworded) and its AC |
| Edge cases | empty, duplicate, invalid or corrupt input; limits; concurrent actions; an unavailable dependency; permissions | an `[unwanted]` FR with its AC |
| Qualities | speed, capacity, availability, recovery, accessibility, privacy, compliance the user would notice | an NFR with a number, standard or testable condition |
| External exchange | data the feature imports or exports, formats the user handles, outside services it relies on and what happens when they fail | an FR, or an assumption |
| Terminology | one concept with two names; a term used before it is defined | every occurrence normalized to one term |
| Acceptance | ACs without concrete values or an observable result; done criteria that cannot be checked | the AC or done criterion, rewritten |
| Leftovers | `[CLARIFY` markers, `TODO`, `???`, vague words (*fast, quick, easy, intuitive, user-friendly, simple, robust, secure, scalable, flexible, appropriate, properly, as needed, etc., and/or*) | the line it sits on |

## think-spec checks

Each failure is a finding; the format ones are fixed without a question when meaning does not change.

- **EARS**: one sentence, one behaviour, keywords in capitals matching the tag (`[event]` has WHEN/CUANDO, `[unwanted]` has IF … THEN / SI … ENTONCES, and so on); the same subject in every FR.
- **MoSCoW**: every FR and NFR tagged; `[wont]` moves to out of scope. When every FR is `must`, ask which ones the user could ship without.
- **NFR**: measurable, and its ISO 25010 tag fits what it measures.
- **AC↔FR**: every FR has an AC; no AC adds behaviour its FR lacks (new behaviour is a new FR).
- **Constitution**: no requirement contradicts a principle. On a stale spec, check against the current constitution.

## Out of bounds

Data models, storage, stack, architecture and task breakdown belong to the plan: note them for the report, never ask them here.
