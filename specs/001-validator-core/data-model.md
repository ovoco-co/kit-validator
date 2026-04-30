# Phase 1 Data Model: Validator Core

This file describes the runtime data shapes the library produces and consumes. All shapes are plain JSON-serializable objects. Field names use camelCase (matching the CLI's argv conventions and the published JSON Schema).

## Input: `config` (parameter to `validate(config)`)

Plain JavaScript object. Documented keys at v0.1.0:

| Key | Type | Required | Notes |
|----|----|----|----|
| `schemaDir` | `string` | yes | Filesystem path to a tier root containing `schema-structure.json`, `schema-attributes.json`, and a `data/` subdirectory. May be relative or absolute. |
| `loadPriority` | `string[]` | yes | Type names in dependency order (referenced types before referencing types). |
| `nestedTypes` | `string[]` | yes (may be empty) | Type names whose data files use the nested-wrapper format `{ "TypeName": [...] }` rather than a plain array. |
| `attrNameMap` | `Record<string,string>` | yes (may be empty) | camelCase-to-Title-Case overrides for attribute display names whose default conversion is wrong. |
| `domainDirs` | `string[]` | optional | Filesystem paths to additional domain tiers that overlay the `schemaDir` tier. Each domain's schema-structure.json and schema-attributes.json merge into the loaded model. |

Unknown keys are silently ignored (FR-005, Edge Cases). Future MINOR versions can add keys without breaking existing consumers.

## Output: `ValidateResult` (return value of `validate(config)`)

```js
{
  errors: ErrorRecord[],
  warnings: WarningRecord[],
  exitCode: integer,  // 0 when errors is empty, non-zero otherwise
}
```

`exitCode` is derived purely from `errors.length`; the function does not call `process.exit` itself. The CLI binary calls `process.exit(result.exitCode)`.

### `ErrorRecord` and `WarningRecord`

Same shape; severity field distinguishes. Both validate against `docs/output-schema.json`.

| Field | Type | Required | Notes |
|----|----|----|----|
| `ruleId` | `string` | yes | Stable rule identifier (e.g., `attribute.casing`). Matches an entry in `lib/rules/registry.json`. |
| `severity` | `"error" \| "warning"` | yes | The fixed severity from the registry; never overridden per-record. |
| `message` | `string` | yes | Human-readable explanation of this specific violation. |
| `file` | `string \| null` | yes | Filesystem path to the offending file relative to `schemaDir`. `null` when the rule is not file-scoped (rare). |
| `recordName` | `string \| null` | yes | The `Name` field of the offending record. `null` for type-level or file-level rules. |
| `field` | `string \| null` | yes | The offending attribute name. `null` when the rule does not point at a specific attribute. |

Optional fields (`file`, `recordName`, `field`) are explicitly `null` when not applicable, never omitted. This keeps the JSON Schema simple and consumers don't have to handle absent-vs-null cases.

## In-memory model: loaded schema and data

The dispatcher in `lib/index.js` loads input files once and passes a normalized model to each rule. Internal shape (not part of any public contract):

### `LoadedSchema`

```js
{
  types: [
    { name: "Source Channel", parent: null, description: "..." },
    { name: "Application", parent: null, description: "..." },
    // ...
  ],
  attributes: {
    "Source Channel": { description: { type: 0 }, /* ... */ },
    "Application": { candidate: { type: 1, referenceType: "Candidate" }, /* ... */ },
    // ...
  },
  schemaDir: string,
  domainDirs: string[],
}
```

### `LoadedData`

```js
{
  records: {
    "Candidate": [
      { Name: "Jane Doe", email: "jane@example.com", /* ... */ },
      // ...
    ],
    "Application": [/* ... */],
    // ...
  },
  files: {
    "Candidate": "schema/core/data/candidate.json",
    "Application": "schema/core/data/application.json",
    // ...
  },
}
```

### Rule dispatch context

Each rule receives:

```js
{
  schema: LoadedSchema,
  data: LoadedData,
  config: <the original config>,
}
```

Each rule returns `Array<ErrorRecord | WarningRecord>`. The dispatcher concatenates and sorts the combined list deterministically (per Constitution VIII, SC-007) before returning.

## Rule registry shape (`lib/rules/registry.json`)

Top-level: array of rule entries. Each entry:

```json
{
  "id": "attribute.casing",
  "description": "Every attribute name in schema-attributes.json matches /^[a-z][a-zA-Z0-9]*$/.",
  "severity": "error",
  "constitutionalSource": [
    "cmdb-kit/Constitution III: Schema Integrity",
    "hr-kit/Constitution III: Schema Integrity"
  ]
}
```

`id` is the stable identifier. `description` is the one-line summary. `severity` matches what the rule emits. `constitutionalSource` is an array of citations (one consuming kit per entry); minimum length 1.

## State Transitions

The library is stateless. `validate(config)` is a pure function of `config` and the current filesystem state. Multiple invocations with the same input produce identical output (Constitution VIII, SC-007).

The only "transition" is at upgrade time: when a new version of kit-validator publishes, consumers update their pin in `package.json`. The upgrade mechanism lives entirely in the consuming kit; this library has no upgrade-side responsibilities beyond shipping a clean release.
