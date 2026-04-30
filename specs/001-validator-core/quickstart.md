# Quickstart: Validator Core (v0.1.0)

How to install, run, and consume kit-validator. Aimed at a developer of a consuming kit (cmdb-kit, hr-kit, or a future kit) who has just picked it up.

## Install

In your consuming kit's `package.json`:

```json
{
  "dependencies": {
    "@ovoco/kit-validator": "git+https://github.com/ovoco-co/kit-validator.git#v0.1.0"
  }
}
```

Then:

```bash
npm install
```

This pulls v0.1.0 from the git tag. Bump the ref deliberately when adopting later releases.

## Run from the command line

```bash
kit-validate --schema schema/core
```

Or via Node directly when working inside the consuming kit:

```bash
node tools/validate.js --schema schema/core
```

The thin wrapper at `tools/validate.js` is the consumer's responsibility; it imports `validate` from `@ovoco/kit-validator`, supplies kit-specific config, calls validate, and exits with the returned exit code. See hr-kit's `tools/validate.js` for an example.

## Output

### Text mode (default)

A clean schema produces no output and exits with status 0. A schema with violations produces one line per record:

- Errors go to stderr, prefixed `error`, in red when stderr is a TTY.
- Warnings go to stdout, prefixed `warning`, in yellow when stdout is a TTY.
- Format: `<severity> <ruleId> <file>:<recordName>:<field> - <message>`

Set `KIT_VALIDATE_NO_COLOR=1` to suppress ANSI color in any environment.

### JSON mode

```bash
kit-validate --schema schema/core --format json
```

Writes a single JSON document to stdout:

```json
{"errors":[],"warnings":[],"exitCode":0}
```

Or with violations:

```json
{
  "errors": [
    {"ruleId":"attribute.casing","severity":"error","message":"...","file":"schema-attributes.json","recordName":null,"field":"SourceChannel"}
  ],
  "warnings": [],
  "exitCode": 1
}
```

## Use programmatically

Inside a test or another tool:

```js
const { validate } = require('@ovoco/kit-validator');

const result = validate({
  schemaDir: '/path/to/schema/core',
  loadPriority: ['Source Channel', 'Candidate', 'Application'],
  nestedTypes: [],
  attrNameMap: {},
});

if (result.exitCode !== 0) {
  for (const err of result.errors) {
    console.error(err);
  }
  process.exit(result.exitCode);
}
```

The function is synchronous and reads from the filesystem. It does not call `process.exit` itself; the caller decides what to do with the result.

## Add a new attribute to your kit's schema

This walkthrough applies to both consuming kits.

1. Add the attribute under the relevant type in your kit's `schema-attributes.json`. The attribute name MUST be camelCase.
2. If the attribute name's default Title Case rendering is wrong (acronyms, unusual word boundaries), add an entry to your kit's `tools/lib/constants.js` ATTR_NAME_MAP.
3. Optionally populate some or all data records in `schema/core/data/<type>.json` with values for the new attribute.
4. Run the validator. Fix any errors.

## Add a new rule (kit-validator side, not the consumer side)

This is for kit-validator maintainers, not consumers.

1. Open an issue against `ovoco-co/kit-validator` describing the rule and citing its constitutional source in at least one consuming kit. Per Constitution V, every rule MUST trace back to a constitutional clause.
2. Implement the rule as `lib/rules/<dotted-id>.js`. The file exports `(context) => Array<ErrorRecord | WarningRecord>`.
3. Add an entry to `lib/rules/registry.json` with `id`, `description`, `severity`, and `constitutionalSource`.
4. Add at least one positive and one negative fixture under `tests/fixtures/<rule-id>-{positive,negative}/`.
5. Run `npm test`. Both `registry.test.js` (SC-004) and `output-schema.test.js` (SC-005) MUST pass.
6. The new rule ships in the next MINOR release. Severity escalation (warning to error) is MAJOR; per Constitution III, deprecate first with one MINOR cycle of warnings before the MAJOR.

## Troubleshooting

- **`Cannot find module '@ovoco/kit-validator'`**: `npm install` did not complete, or the git URL ref does not exist. Re-run `npm install`. If the tag genuinely does not exist (e.g., typo), fix the ref in `package.json`.
- **A rule fires that you disagree with**: look up the rule identifier in `lib/rules/registry.json`. The `constitutionalSource` field tells you which consuming kit's constitution motivated the rule. If you think the rule is wrong, file an issue against `ovoco-co/kit-validator`; do not patch the rule out in your kit.
- **Validator output differs between runs given the same input**: that's a determinism bug per Constitution VIII. File an issue with the input that triggers it.
- **You want a custom rule for your kit only**: not supported at v0.1.0. Open a feature request describing the use case so the design conversation can happen for a future MINOR.

## What this library does NOT do

- It does not modify schema or data files. Read-only.
- It does not invent rules; every rule traces to a consuming kit's constitution (Constitution V).
- It does not depend on cmdb-kit, hr-kit, or any consumer at runtime (Constitution VI). Tests use synthetic fixtures only.
- It does not call out to the network. Validation is purely filesystem-and-stdlib (Constitution VIII).
- It does not provide a UI. CLI text and CLI JSON are the only interfaces; everything else is the function API.
