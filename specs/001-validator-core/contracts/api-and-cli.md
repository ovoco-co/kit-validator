# Contract: Public API and CLI Surface

This file documents the surfaces kit-validator exposes to consumers at v0.1.0. Anything outside these surfaces is internal and may change without bumping the version. Anything inside these surfaces is governed by Constitution III (semver discipline).

## Function API

### `validate(config)`

Module entry: `lib/index.js`. Imported as `const { validate, formatText, formatJson } = require('@ovoco/kit-validator');`. Three named exports at v0.1.0: `validate` (the validation function), `formatText` (renders a result for human reading), and `formatJson` (renders a result as a single JSON document). Consumers that wrap the function API in their own thin entry point use the formatters to surface output without having to re-implement format conventions.

Signature:

```js
validate(config: ValidateConfig): ValidateResult
```

Synchronous. No callback variant. No promise variant.

Inputs and outputs are documented in `data-model.md`.

#### Behavior contract

- `validate(config)` reads files from `config.schemaDir` and (if provided) `config.domainDirs`. It does not write anything.
- It returns a result object; it does not call `process.exit`.
- It is deterministic per Constitution VIII: same `config` plus same filesystem state produces same `result` (record contents and order).
- Unknown `config` keys are silently ignored (FR-005). This forward-compatibility lets future MINOR versions add keys without breaking existing consumers.
- When required files are missing, the function returns an error record (with `ruleId: "config.missing-file"` or similar; final identifier pinned during implementation) rather than throwing.
- The function MUST NOT throw on malformed JSON in input files; it returns an error record describing the parse failure.

## CLI Surface

### Binary `kit-validate`

Mapped to `bin/kit-validate.js` in `package.json` `bin` field. Invoked as `kit-validate <args>` after `npm install`, or as `node bin/kit-validate.js <args>` from within the repository.

#### Arguments

| Flag | Type | Default | Notes |
|----|----|----|----|
| `--schema <dir>` | path | required | Maps to `config.schemaDir`. |
| `--domain <dir>` | path | none | Repeatable. Maps to `config.domainDirs`. |
| `--format <text\|json>` | enum | `text` | Output format. See FR-003a (text) and FR-003b (json). |
| `--help`, `-h` | flag | off | Prints usage to stdout and exits 0. |

Other config keys (loadPriority, nestedTypes, attrNameMap) are not CLI flags; consumers supply them by passing through the function API in their own thin entry point. The CLI binary's primary use case is "from a consuming kit's tools/validate.js wrapper" rather than direct shell use, so the kit-side wrapper supplies kit-specific config and the CLI supplies the schema-directory dispatch.

#### Output streams

In `--format text` (default):

- Errors: stderr, one per line. Format: `error <ruleId> <file>:<recordName>:<field> - <message>`. ANSI red color when stderr is a TTY; suppressed when `KIT_VALIDATE_NO_COLOR` is set.
- Warnings: stdout, one per line. Format: `warning <ruleId> <file>:<recordName>:<field> - <message>`. ANSI yellow color when stdout is a TTY; same suppression rule.
- Successful run with zero errors and zero warnings: silent; nothing written to either stream.

In `--format json`:

- The function's return value is written as a single JSON document to stdout.
- Color codes do not apply in JSON mode regardless of TTY status.
- Successful run: `{"errors":[],"warnings":[],"exitCode":0}` (JSON-stringified, single line).

Exit codes in both modes: `result.exitCode` is passed to `process.exit`. `0` on success, `1` on any error record. (Future versions may use additional non-zero codes for distinct failure classes; v0.1.0 ships only 0 and 1.)

## Output Records

The shape of records inside `errors[]` and `warnings[]` is governed by `docs/output-schema.json` (a published JSON Schema file). See `data-model.md` for the field list. The schema is the canonical contract; if this prose and the schema disagree, the schema wins.

## Rule Registry

Located at `lib/rules/registry.json`. Top-level array of rule entries. Each entry has `id`, `description`, `severity`, `constitutionalSource`. See `data-model.md` for the entry shape.

The set of identifiers in the registry MUST equal the set of identifiers emitted by `validate(config)`. SC-004 enforces this with an automated test.

## Out of Surface

These are explicitly NOT part of the v0.1.0 contract:

- Internal module structure beyond `lib/index.js`. Consumers MUST NOT `require('@ovoco/kit-validator/lib/rules/some-rule')` directly.
- The exact text of error messages (only `ruleId`, `file`, `recordName`, `field` are stable contracts).
- The order of rules in `lib/rules/registry.json` (only the set is contracted).
- Implementation details of color rendering (ANSI codes, color choices).
- Performance characteristics beyond what FR and SC pin (no specific latency target beyond "under 5 seconds on a development laptop against an hr-kit-sized schema").

## Versioning Map

When a future release changes any of the following, the bump class is:

| Change | Bump class |
|----|----|
| Add a new rule to the registry | MINOR |
| Add a new config key (FR-005 lists v0.1.0 keys) | MINOR |
| Add a new field to ErrorRecord/WarningRecord | MINOR |
| Add a new CLI flag | MINOR |
| Add a new output format value (e.g., `--format ndjson`) | MINOR |
| Bug fix: rule produces correct output where it produced wrong output | PATCH |
| Bug fix: CLI argv parsing error corrected | PATCH |
| Severity escalation (warning to error) on any rule | MAJOR |
| Rule removal | MAJOR |
| Rule identifier rename | MAJOR |
| ErrorRecord/WarningRecord field rename or removal | MAJOR |
| `validate(config)` function-signature change | MAJOR |
| CLI flag removal or rename | MAJOR |
| Drop support for a Node.js major version | MAJOR |
