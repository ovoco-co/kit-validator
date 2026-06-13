# Feature Specification: Validator Core

**Feature Branch**: `001-validator-core`
**Created**: 2026-04-29
**Status**: Draft
**Input**: User description: "Validator core: function API plus CLI binary plus the v0.1.0 rule set. The library exports validate(config) returning { errors, warnings, exitCode } and ships a bin/kit-validate.js wrapper. v0.1.0 ports the eleven domain-neutral rules from cmdb-kit's existing validator, drops cmdb-kit's JSM-specific 70-character description warning, and adds three new constitutional naming-convention rules (camelCase attribute names, Title Case display names, kebab-case data file names) that cmdb-kit's validator does not currently enforce. The release ships a rule registry mapping each rule identifier to its constitutional source, a JSON Schema for output records, and synthetic test fixtures in tests/fixtures/. After this release, hr-kit's 002-schema-validator-integration can install via the v0.1.0 git tag and unblock its pending tasks."

## Clarifications

### Session 2026-04-29

- Q: What output format does v0.1.0 ship? → A: Both human-readable text and `--format json`. Default is human-readable text (errors to stderr, warnings to stdout, ANSI color when stdout is TTY, color off when `KIT_VALIDATE_NO_COLOR` is set). The `--format json` flag emits the function's return value as JSON.

### Session 2026-06-12

- Q: What is the constitutional source for the 11 ported rules in the registry? → A: Match `lib/rules/registry.json`. Nine ported rules cite `kit-validator/Constitution V` (originally cmdb-kit existing validator behavior). The two pure integrity rules `data.reference.unresolved` and `load-priority.missing-type` cite cmdb-kit + hr-kit `Constitution III: Schema Integrity`. The three new naming rules also cite cmdb-kit + hr-kit `Constitution III: Schema Integrity`.

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Consuming kit installs and runs the validator (Priority: P1)

A consuming kit (cmdb-kit, hr-kit, or any future kit following the schema-kit pattern) declares `@ovoco/kit-validator` as a dependency via git URL pinned to v0.1.0. They run `npm install`, then run `node tools/validate.js --schema schema/core` (a thin wrapper that calls the library's exported `validate(config)`). They get either zero errors and zero warnings on a constitutionally clean schema, or a precise list of violations with rule identifiers, file paths, and offending fields.

**Why this priority**: This is the workflow every consumer relies on. Without it, no consuming kit can enforce its constitutional discipline.

**Independent Test**: A test consumer (a synthetic fixture in `tests/fixtures/`) installs the package, runs the binary against a clean fixture and a deliberately-broken fixture, and observes the documented output shape and exit code in each case.

**Acceptance Scenarios**:

1. **Given** a consuming kit with a clean schema and complete LOAD_PRIORITY, **When** it calls `validate(config)`, **Then** the function returns `{ errors: [], warnings: [], exitCode: 0 }`.
2. **Given** a schema with a deliberately introduced violation (e.g., a PascalCase attribute name), **When** `validate(config)` runs, **Then** the function returns at least one error record with the rule identifier `attribute.casing`, a file path, and the offending field name.
3. **Given** the same input passed to the CLI binary `kit-validate --schema <dir>`, **When** the binary runs, **Then** it produces output equivalent to the function call and exits with the same status code.

### User Story 2 - Library is kit-agnostic (Priority: P1)

The library has zero kit-specific logic. cmdb-kit and hr-kit both consume v0.1.0 without modification, and any future kit following the schema-kit pattern can be added as a consumer by supplying its own LOAD_PRIORITY. No file in the library mentions cmdb-kit, hr-kit, OvocoCRM, Keystone Recruiting, Hireology, or any consumer-specific concept.

**Why this priority**: Constitutional Principle I. If kit-specific logic creeps in, the library becomes a maintenance nightmare and consumers fork it.

**Independent Test**: A grep across `lib/`, `bin/`, and `tests/` for the strings "cmdb-kit", "hr-kit", "OvocoCRM", "Keystone", "Hireology", "ServiceNow", "JSM", and "Atlassian" returns zero matches. Tests run against synthetic fixtures only; no consuming-kit content is referenced.

**Acceptance Scenarios**:

1. **Given** the library source tree, **When** the kit-agnostic grep runs, **Then** it returns zero matches.
2. **Given** the library tests, **When** they run, **Then** they pass without any cmdb-kit or hr-kit dependency in `package.json`'s `dependencies` or `devDependencies`.
3. **Given** a hypothetical third consuming kit that supplies its own LOAD_PRIORITY, **When** it calls `validate(config)`, **Then** the library executes the same rule set it runs for cmdb-kit and hr-kit.

### User Story 3 - Rule discoverability and traceability (Priority: P1)

A consumer encounters a rule failure and wants to understand it. They look up the rule identifier in the published rule registry. The registry tells them what the rule checks, what severity it has, and which constitutional clause in which consuming kit motivated it. They can grep for the identifier in their own CI configuration to suppress, log, or escalate.

**Why this priority**: Constitutional Principles V and VII. Rules without identity are invisible. Identifiers without constitutional sources are unmotivated.

**Independent Test**: For every rule the library enforces, the registry has an entry with `identifier`, `description`, `severity`, and `constitutionalSource` fields. Every rule identifier emitted by `validate(config)` appears in the registry.

**Acceptance Scenarios**:

1. **Given** the published v0.1.0 release, **When** a consumer reads `lib/rules/registry.json`, **Then** they find one entry per rule with the four required fields populated.
2. **Given** a rule that fires during validation, **When** the consumer searches the registry by the rule's identifier, **Then** they find the rule's documented purpose and constitutional source.
3. **Given** a release-time test, **When** the test compares rule identifiers in the code to entries in the registry, **Then** the two sets match exactly.

### Edge Cases

- The consumer passes a config with an unknown key (e.g., a typo for `loadPriority`). The library SHOULD ignore unknown keys and validate against the keys it recognizes; it MUST NOT error on unknown keys (so future MAJOR versions can add keys without breaking older consumers that pass through extra config).
- The consumer's schema directory has no schema-structure.json or schema-attributes.json. The library MUST emit a single clear error identifying the missing file, not a stack trace.
- The consumer's LOAD_PRIORITY contains a type that is not in schema-structure.json. The library treats this as informational; some consumers list types from multiple tiers in a single LOAD_PRIORITY array, only some of which are in the current --schema target.
- The consumer's data file is not valid JSON. The library MUST emit a single error identifying the file and the parse failure location, not a stack trace.
- A rule's constitutional source moves (a consuming kit reorganizes its constitution). The registry's `constitutionalSource` link can grow stale. Out of scope for v0.1.0; consumers will file kit-validator issues as they notice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The library MUST export a function named `validate` from its main module entry point (`lib/index.js`). The function takes a single `config` argument and returns synchronously.
- **FR-002**: The function's return value MUST be an object with at minimum the keys `errors` (array), `warnings` (array), and `exitCode` (integer). `exitCode` MUST be `0` when `errors` is empty and non-zero when `errors` is non-empty.
- **FR-003**: The library MUST ship a CLI binary at `bin/kit-validate.js` that accepts at minimum `--schema <dir>`, `--format <text|json>` (default `text`), and `--help`, builds an equivalent config from arguments, calls `validate(config)`, prints output, and exits with `result.exitCode`.
- **FR-003a**: In default text mode, the CLI MUST write error records to stderr (one per line) and warning records to stdout (one per line). Each line carries the rule identifier, the file path, the record name (when applicable), the field name (when applicable), and the message. ANSI color is on when stdout is a TTY and is suppressed when the environment variable `KIT_VALIDATE_NO_COLOR` is set (the only env-var-driven behavior allowed by Constitution VIII).
- **FR-003b**: In `--format json` mode, the CLI MUST write the function's return value (`{ errors, warnings, exitCode }`) to stdout as a single JSON document. Color and the `KIT_VALIDATE_NO_COLOR` toggle do not apply in JSON mode.
- **FR-004**: The CLI binary MUST expose every capability of the function API. No CLI-exclusive features; no programmatic-only features. The two output modes (text and JSON) wrap the same underlying call to `validate(config)`.
- **FR-005**: The function MUST accept these config keys: `schemaDir` (string, required), `loadPriority` (string array, optional with an empty default), `domainDirs` (string array, optional). Unknown config keys MUST be silently ignored to preserve forward compatibility.
- **FR-005a**: Data files MUST be flat JSON arrays of records. The data file name MUST be the type name in singular kebab-case (for example, `Workflow Status Set` maps to `workflow-status-set.json`). Self-referencing and circular types are supported: references resolve against the full record set for the referenced type, with no intra-type load ordering required.
- **FR-006**: The library MUST enforce 14 rules at v0.1.0. Each rule has a stable identifier, a one-line description, a severity (`error` or `warning`), and a documented constitutional source. The 14 rules:
  - `structure.duplicate-type`: schema-structure.json contains no duplicate `name` entries. Severity: error. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `structure.parent-unresolved`: every `parent` field references a type that exists in the same file. Severity: error. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `attributes.reference-type-unresolved`: every reference attribute's `referenceType` matches a type in schema-structure.json. Severity: error. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `attributes.unknown-type`: every type in schema-attributes.json appears in schema-structure.json. Severity: warning. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `load-priority.missing-type`: every importable type in schema-structure.json appears in `loadPriority`. Severity: warning. Constitutional source: cmdb-kit Constitution III, hr-kit Constitution III (Schema Integrity).
  - `load-priority.missing-data-file`: every type in `loadPriority` that should have a data file has one (kebab-case filename in the schema directory's `data/` subdirectory). Severity: warning. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `data.reference.unresolved`: every reference value in a data record matches an existing record's `Name` field (case-sensitive). Severity: error. Constitutional source: cmdb-kit Constitution III, hr-kit Constitution III (Schema Integrity).
  - `data.unknown-field`: every key in a data record is either declared in schema-attributes.json or is a recognized metadata key (`Name`, `name`, `description`). Severity: warning. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `data.null-value`: data records SHOULD omit a field rather than set it to `null`. Severity: warning. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `data.boolean-format`: boolean-typed attributes hold `true` or `false`, not the strings `"true"` or `"false"`. Severity: warning. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `data.date-format`: date-typed attributes hold ISO `YYYY-MM-DD` strings. Severity: warning. Constitutional source: kit-validator Constitution V (originally cmdb-kit existing validator behavior).
  - `attribute.casing`: every attribute name in schema-attributes.json matches `^[a-z][a-zA-Z0-9]*$` (camelCase). Severity: error. Constitutional source: cmdb-kit Constitution III, hr-kit Constitution III.
  - `type.title-case`: every type's `name` in schema-structure.json is Title Case (each space-separated word starts with an uppercase letter; allows acronyms in all-caps). Severity: error. Constitutional source: cmdb-kit Constitution III, hr-kit Constitution III.
  - `file.kebab-case`: every data file name is kebab-case (`^[a-z][a-z0-9]*(-[a-z0-9]+)*\.json$`). Severity: error. Constitutional source: cmdb-kit Constitution III, hr-kit Constitution III.
- **FR-006a**: The registry MUST also carry `input.unreadable` (severity `error`), the identifier emitted when a schema file is missing or a data file is not a flat JSON array. It is produced by the loader path rather than a rule module, so `validate(config)` returns the result contract instead of throwing (Constitution II).
- **FR-007**: The library MUST publish a rule registry at `lib/rules/registry.json` listing every rule identifier, description, severity, and constitutional source. The set of identifiers in the registry MUST match the set emitted by `validate(config)` exactly.
- **FR-008**: The library MUST publish a JSON Schema for the error record shape and the warning record shape, located at `docs/output-schema.json`. Each error and warning record returned by `validate(config)` MUST validate against the schema.
- **FR-009**: At minimum, every error record MUST contain: `ruleId` (string), `message` (string), `severity` (string, equal to `error`), and a source-location triple: `file` (string path), `recordName` (string, when applicable), and `field` (string, when applicable).
- **FR-010**: The library MUST be deterministic per Constitution VIII: the same config produces the same `{ errors, warnings, exitCode }` (record contents AND order) on every run. No network calls, no system-clock dependencies, no random sampling, no environment-variable-driven behavior beyond `KIT_VALIDATE_NO_COLOR`.
- **FR-011**: The library MUST contain no kit-specific logic per Constitution I. A grep across `lib/`, `bin/`, and `tests/` for `cmdb-kit`, `hr-kit`, `OvocoCRM`, `Keystone`, `Hireology`, `ServiceNow`, `JSM`, or `Atlassian` MUST return zero matches.
- **FR-012**: Tests MUST use synthetic fixtures only per Constitution VI. The library MUST NOT have cmdb-kit, hr-kit, or any consuming kit declared in `dependencies` or `devDependencies`.
- **FR-013**: The library's `package.json` `main` field MUST point at `lib/index.js`. The `bin` field MUST map `kit-validate` to `bin/kit-validate.js`. Both files MUST exist at v0.1.0.
- **FR-014**: The library MUST drop cmdb-kit's JSM-specific 70-character description-length rule. That rule existed because of an Atlassian Assets constraint and is not constitutional.

### Key Entities

- **`validate(config)` function**: the library's only programmatic entry. Synchronous. Reads from filesystem, returns the result object, writes nothing.
- **CLI binary `kit-validate`**: at `bin/kit-validate.js`. Parses argv, builds config, calls `validate(config)`, writes human-readable output, exits with `result.exitCode`.
- **Rule**: a single check with stable identifier, description, severity, and constitutional source. Each rule is one file in `lib/rules/`. Each rule has positive (rule fires) and negative (rule does not fire) fixture tests.
- **Rule registry** (`lib/rules/registry.json`): the published map from rule identifier to rule metadata. Authoritative for consumer CI gating.
- **Output records** (`ErrorRecord`, `WarningRecord`): the shapes inside `errors[]` and `warnings[]`. Validated by the published JSON Schema.
- **Synthetic fixture**: a small kit-shaped directory (schema-structure.json + schema-attributes.json + data/*) under `tests/fixtures/`, hand-crafted to exercise one or two rules. Never references real consuming kits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm test` against the v0.1.0 codebase passes. All 14 rules have at least one positive and one negative fixture test.
- **SC-002**: The function-API and the CLI binary are exercised by the same test suite. Verifiable: each rule's tests run through both surfaces, and the CLI is exercised in both `text` and `--format json` modes.
- **SC-003**: The kit-agnostic grep (against `cmdb-kit`, `hr-kit`, `OvocoCRM`, `Keystone`, `Hireology`, `ServiceNow`, `JSM`, `Atlassian`) returns zero matches across `lib/`, `bin/`, and `tests/`. Verifiable in CI with a static check.
- **SC-004**: `lib/rules/registry.json` lists every rule identifier emitted by `validate(config)`, with no missing entries and no orphan entries. Verifiable by an automated registry-coverage test.
- **SC-005**: Every error and warning record produced by the test suite validates against `docs/output-schema.json`. Verifiable by an automated schema-validation test.
- **SC-006**: hr-kit's 002-schema-validator-integration succeeds at `npm install` against the published `v0.1.0` tag, and `node tools/validate.js --schema schema/core` runs to completion against hr-kit's Core schema (whatever its content is at the moment of installation, including the empty-schema scaffold case).
- **SC-007**: Determinism: running the test suite twice in succession produces identical output (same records, same order, same exit codes) given the same fixtures.

## Assumptions

- Node.js 18 or newer is available wherever the library runs. The `package.json` declares this in `engines.node`.
- The library is consumed via npm git URL with `#tag` syntax. Once consumer adoption justifies registry friction, the library may publish to the public npm registry; that is out of scope for v0.1.0.
- cmdb-kit's existing validator behavior is the authoritative source for what the eleven ported rules do. Any divergence between this library's implementation and cmdb-kit's existing implementation is a deliberate decision documented in `research.md` during planning.
- The three new constitutional naming-convention rules (`attribute.casing`, `type.title-case`, `file.kebab-case`) take their constitutional source from BOTH cmdb-kit's Constitution III and hr-kit's Constitution III, because those rules are stated identically in both. The registry records both citations.
- Synthetic fixtures live in `tests/fixtures/` as small directory trees. Each fixture covers at most a handful of rules. Naming convention: `tests/fixtures/<rule-or-scenario>-<positive|negative>/`.

## Dependencies

- kit-validator Constitution v1.0.0 (ratified 2026-04-29). Principles I through VIII govern this feature.
- cmdb-kit Constitution (existing) for the constitutional source of three of the new naming-convention rules.
- hr-kit Constitution v1.0.0 (ratified 2026-04-24) for the constitutional source of three of the new naming-convention rules.
- No runtime dependencies on cmdb-kit or hr-kit (per Constitution I, FR-011, SC-003).
- Node.js 18+ test runner (`node --test`). No additional test framework introduced.
