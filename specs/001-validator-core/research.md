# Phase 0 Research: Validator Core

## Scope

No NEEDS CLARIFICATION items. The spec's clarification session pinned the dual-output-format question; the rest is settled by Constitution v1.0.0 plus FR-006's enumerated rule set. This file consolidates the design decisions that shape Phase 1 and that future readers benefit from finding in one place.

## Decisions

### Decision: Port the eleven domain-neutral rules from cmdb-kit's existing validator behavior

- **Decision**: kit-validator v0.1.0 implements eleven rules whose semantics match cmdb-kit's current `tools/validate.js`: structure duplicates, parent references, attribute reference types, attribute-on-unknown-type, LOAD_PRIORITY completeness, data file existence, data reference resolution, data unknown-field, data null-value, data boolean format, data date format. cmdb-kit's behavior is treated as the authoritative reference; any deviation is a deliberate decision documented per-rule.
- **Rationale**: cmdb-kit has lived production exercise of these rules. Re-deriving them would add risk for no benefit. Severity assignments match cmdb-kit's existing severities.
- **Alternatives considered**:
  - Re-derive each rule from constitutional principles fresh. Rejected: would risk semantic drift from a production implementation that already works.
  - Drop the data-format rules (boolean, date, null) as too prescriptive. Rejected: they ship with cmdb-kit today and are already constitutional via the camelCase/Title Case discipline pattern. Removing them would break cmdb-kit on adoption.

### Decision: Drop cmdb-kit's JSM-specific 70-character description-length warning

- **Decision**: The "description length ≤ 70 chars" warning that cmdb-kit's validator carries is dropped at v0.1.0.
- **Rationale**: The 70-character limit comes from Atlassian Assets schema constraints, not from the constitutional schema-kit pattern. kit-validator is consumer-agnostic; bundling Assets-specific limits violates Constitution I.
- **Alternatives considered**:
  - Keep it as an opt-in warning enabled by a config flag. Rejected: adds a config key for one specific consumer's platform. Belongs in cmdb-kit's overlay, not in kit-validator.
  - Drop it but provide a `customRules` config key so consumers can add their own rules. Rejected: extension model is out of scope for v0.1.0; defer to a future MINOR.

### Decision: Add three new rules at v0.1.0 to enforce the constitutional naming conventions

- **Decision**: v0.1.0 adds `attribute.casing`, `type.title-case`, and `file.kebab-case` as new error-severity rules. cmdb-kit's existing validator does not enforce these; cmdb-kit and hr-kit constitutions both require them (Schema Integrity principle in each).
- **Rationale**: Schema Integrity is constitutional in every consuming kit. cmdb-kit's existing convention discipline is contributor-honor-system; enforcing via the validator is what the constitution actually says ("Convention enforced by tooling is the only convention that survives.").
- **Alternatives considered**:
  - Ship as warnings (matches cmdb-kit's other naming-style rules' severity). Rejected: convention rules are constitutional MUSTs; warnings get muted in CI. Errors force compliance.
  - Defer to v0.2.0 with the option to suppress per-rule. Rejected: hr-kit's spec FR-013 expects these rules at the integration's first run; no value in delaying.

### Decision: One file per rule under `lib/rules/`

- **Decision**: Each rule lives in its own file (e.g., `lib/rules/attribute-casing.js`) exporting a single function. `lib/index.js` iterates the registry and dispatches to each rule.
- **Rationale**: Per-rule files map cleanly to the rule registry (Constitution VII), make rule-specific tests trivial to organize, and keep diffs small when adding or modifying rules. The constitution says "Each rule lands as its own commit when practical"; per-file organization makes that the natural shape.
- **Alternatives considered**:
  - Single `lib/rules.js` with all rules. Rejected: every rule change touches the same file; merge conflicts proliferate.
  - Per-category bundling (`lib/rules/structure.js`, `lib/rules/data.js`, etc.). Rejected: blurs the rule-registry-to-file mapping.

### Decision: Rule registry as static JSON, not generated

- **Decision**: `lib/rules/registry.json` is a hand-maintained JSON file. Each rule's per-file source links the registry entry implicitly (via the identifier string used in emitted records). A registry-coverage test (SC-004) ensures sync.
- **Rationale**: A static JSON file is greppable, diffable, and consumable by external tools without execution. Generating it from rule source files would require a build step, which adds machinery for no benefit at v0.1.0 scale.
- **Alternatives considered**:
  - Generate from rule files at test time. Rejected: build step adds complexity; the registry is small enough to maintain by hand; the coverage test catches drift.
  - Inline the registry inside `lib/index.js` as an object literal. Rejected: harder to consume from external tools, and Constitution II requires the registry to be published as a file consumers can grep.

### Decision: Output records use a flat shape; the JSON Schema is the contract

- **Decision**: Every error record has fields: `ruleId`, `message`, `severity`, `file`, `recordName`, `field`. Some fields are nullable when the rule is type-level rather than record-level (e.g., `recordName` is null for `structure.duplicate-type` since it's a global check). The shape is published as `docs/output-schema.json`.
- **Rationale**: Flat is simpler to validate against JSON Schema and simpler for consumers to render. Optional fields are explicitly nullable rather than absent so consumers don't have to handle two missing-vs-null cases.
- **Alternatives considered**:
  - Per-rule-category record shapes (a structure-rule shape, a data-rule shape, etc.). Rejected: forces consumers to learn multiple shapes; complicates the JSON Schema.
  - Nested location object: `{ ruleId, message, severity, location: { file, recordName, field } }`. Reasonable but adds nesting for no benefit at v0.1.0; flat is fine.

### Decision: CLI text mode writes errors to stderr, warnings to stdout

- **Decision**: In default text mode, `bin/kit-validate.js` writes error records to stderr and warning records to stdout, one per line. ANSI color is on by default when stdout is a TTY and is suppressed by the environment variable `KIT_VALIDATE_NO_COLOR` (the only env-var-driven behavior allowed by Constitution VIII).
- **Rationale**: Standard Unix convention: errors go to stderr so they survive stdout redirection. Warnings on stdout means a `>/dev/null 2>&1` runs cleanly when only checking exit status. Color-on-TTY is the modern Node CLI default.
- **Alternatives considered**:
  - All output to stdout. Rejected: breaks the convention; consumers piping output for processing have to filter manually.
  - `--quiet` flag to suppress warnings. Rejected: adds a flag for a use case CI tools already handle (redirect stdout to /dev/null). v0.1.0 stays narrow.

### Decision: CLI JSON mode emits the function's return value verbatim

- **Decision**: In `--format json` mode, the CLI writes `JSON.stringify(result)` to stdout where `result` is the `validate(config)` return value. Single document, no wrapping, no streaming.
- **Rationale**: Simplest possible mapping from function API to JSON CLI. No new shape to specify; the existing JSON Schema for output records covers the JSON output too.
- **Alternatives considered**:
  - Newline-delimited JSON (NDJSON), one record per line. Rejected for v0.1.0: more complex parsing for consumers, no immediate benefit; can be added in a future MINOR.

### Decision: No customRules / extension API at v0.1.0

- **Decision**: The library does not accept user-defined rules at v0.1.0. The 14 rules are the entire rule set. Adding a customRules extension point is deferred to a future MINOR if a real consumer use case appears.
- **Rationale**: YAGNI. Extension APIs are notoriously hard to design without real consumer feedback. Better to ship the 14-rule core, learn what consumers actually want, and design extension cleanly.
- **Alternatives considered**:
  - Ship a `customRules` array config key from day one. Rejected: speculative; once the API ships, it's MAJOR-bump-locked.

### Decision: ajv as the dev-time JSON Schema validator (likely)

- **Decision**: Tests that validate output records against `docs/output-schema.json` (per SC-005) need a JSON Schema validator. `ajv` is the de-facto Node choice. Final selection deferred to implementation but `ajv` is the baseline.
- **Rationale**: Built-in Node has no JSON Schema validator; a dependency is required for testing. Constitution VI forbids consuming-kit dependencies, not all dev dependencies.
- **Alternatives considered**:
  - Hand-write a minimal JSON Schema validator for our specific output shape. Rejected: re-deriving JSON Schema semantics is error-prone; ajv is widely used and well-tested.
  - Use a different schema format (Joi, Zod). Rejected: JSON Schema is what FR-008 specifies; using another format would require translating.

## Open Coordination Items

- cmdb-kit must update its existing `tools/validate.js` to consume `@ovoco/kit-validator` post-v0.1.0. That is its own project's concern, not part of v0.1.0's scope, but the kit-validator release notes for v0.1.0 should call it out as the obvious next step for cmdb-kit.
- hr-kit's 002-schema-validator-integration is currently pinned to `git+...#v0.1.0`. The moment v0.1.0 publishes, hr-kit's `npm install` succeeds and its blocked tasks (T004 through T009 in 002, plus most of 001's Phase 4-6) become runnable. No coordination needed beyond tagging and pushing v0.1.0.
- Future consumer kits beyond cmdb-kit and hr-kit do not exist yet; the constitution's "any future kit" framing is forward-looking, not pinned to a specific consumer.
