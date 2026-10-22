# Interface contracts

Read this when the feature exposes or consumes an interface outside its own code: a CLI that scripts call, an HTTP API, events, a library API, or a file format other programs read or write. The contract is the agreement each side can be built and tested against without knowing the other's internals.

## What the interface contract section holds

Match the depth to the interface: a small CLI needs commands, outputs and exit codes; a public API may need a schema plus examples. Cover:

- **Inputs**: accepted arguments, fields and formats, with their validation rules.
- **Outputs**: what a success returns or prints, and where (stdout, body, file).
- **Errors**: each failure the spec names (the `[unwanted]` FRs), how it is reported, and its exit or status code.
- **Guarantees**: idempotency (does a retry create a second record?), ordering, timeouts, atomic writes; a schema alone does not say these.
- **Compatibility**: version the interface when other programs depend on it, and what a change may break.

Describe observable behaviour only; internal tables and private functions stay out unless they are the public interface.

## Ownership

One side owns each contract, usually the one that exposes it. When the other side lives elsewhere (another service, another repository), record in the plan where the authoritative contract lives and which version this feature relies on; a copy is read-only input.

## Tests

The test strategy names a contract test for each interface: the provider meets the contract, including the negative cases (invalid input, each error code), and a consumer test against a stub does not replace verifying the real provider.
