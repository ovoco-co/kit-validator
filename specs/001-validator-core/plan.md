# Implementation Plan: Validator Core

**Branch**: `001-validator-core` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-validator-core/spec.md`

## Summary

kit-validator v0.1.0 ships a Node.js library exposing `validate(config)` plus a `kit-validate` CLI. The library enforces 14 schema-discipline rules drawn from cmdb-kit's existing validator behavior (11 rules ported, 1 dropped as JSM-specific) plus three new naming-convention rules (camelCase attribute names, Title Case display names, kebab-case data file names) sourced from the schema-kit constitutional pattern that cmdb-kit and hr-kit both follow. Output is structured records validated by a published JSON Schema; rule identities live in a published rule registry. The CLI prints human-readable text by default and `--format json` for programmatic consumers. Tests use synthetic fixtures only; no consuming-kit dependencies.

The release unblocks hr-kit's 002-schema-validator-integration (which is currently pinned to `git+...#v0.1.0`) and is also adoptable by cmdb-kit (which today owns its own embedded validator) without modification.

## Technical Context

**Language/Version**: Node.js 18+. Uses only the standard library plus the built-in `node --test` test runner. No transpilation; CommonJS modules.

**Primary Dependencies**: None at runtime. The library has zero `dependencies` in `package.json` per Constitution VI and FR-012. Dev-time may include a JSON Schema validator for testing the output-schema (chosen during implementation; `ajv` is the obvious candidate since it is the de-facto Node JSON Schema implementation).

**Storage**: Filesystem only. The library reads schema/data files from the path supplied by `config.schemaDir`. No databases, no caches, no temporary files.

**Testing**: `node --test` (built-in). Synthetic fixtures live in `tests/fixtures/`. Each rule has at least one positive (rule fires) and one negative (rule does not fire) fixture per SC-001.

**Target Platform**: Cross-platform (Linux, macOS, Windows). Anywhere Node.js 18+ runs. No platform-specific code.

**Project Type**: Library + CLI. The library is the substance; the CLI is a thin wrapper.

**Performance Goals**: Validator completes in under 5 seconds on a development laptop against an hr-kit-sized schema (low tens of types, low hundreds of records). Performance is not a major design constraint at v0.1.0; the rules are linear in input size and inputs are small.

**Constraints**:

- Constitutional Principle I: zero kit-specific logic; FR-011 grep returns zero matches across `lib/`, `bin/`, `tests/`.
- Constitutional Principle II: stable output contract; output records validate against `docs/output-schema.json`; shape changes are MAJOR.
- Constitutional Principle III: strict semver; new rules are MINOR additive, severity escalation is MAJOR.
- Constitutional Principle IV: CLI symmetry; the binary exposes every capability of the function API.
- Constitutional Principle V: every rule traces to a constitutional source via `lib/rules/registry.json`.
- Constitutional Principle VI: tests use synthetic fixtures only; no consumer-kit content.
- Constitutional Principle VII: every rule has a stable identifier; renames are MAJOR.
- Constitutional Principle VIII: deterministic output; no network, no clock, no random sampling, no env-var-driven behavior beyond `KIT_VALIDATE_NO_COLOR`.

**Scale/Scope**: 14 rules at v0.1.0. Roughly 150-300 lines of rule-specific code total (each rule is small). The CLI is under 100 lines. Tests are 1-2 fixtures per rule plus a small number of integration fixtures. Rule registry is a static JSON file. Output schema is a static JSON Schema file. Total v0.1.0 codebase target: under 2,000 lines.

No NEEDS CLARIFICATION items. The clarification session pinned the dual-output-format question (text + `--format json`); all other taxonomy categories are clear.

## Constitution Check

GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.

Constitution v1.0.0 (ratified 2026-04-29). Each principle, evaluated against this feature:

- **I. Kit-Agnostic Core** — FR-011 enforces zero kit-specific logic by name-based grep. SC-003 verifies it in CI. PASS, satisfies.
- **II. Stable Output Contract** — FR-007, FR-008, SC-005 commit to a published JSON Schema for output records. The function-API return shape is documented and tested. PASS.
- **III. Strict Semver** — Versioning policy is set by the constitution; this feature is the first release (v0.1.0) governed by it. PASS.
- **IV. CLI Symmetry** — FR-004 requires the binary to expose every capability of the function API. SC-002 verifies via shared test suite. PASS.
- **V. Rules Are Constitutionally Sourced** — FR-006 names every rule's constitutional source. FR-007 mandates the registry includes the source. SC-004 verifies registry coverage. PASS.
- **VI. Self-Contained Testing** — FR-012 forbids consumer kits in `dependencies` or `devDependencies`. Synthetic fixtures only. PASS.
- **VII. Documented Rule Identity** — FR-006 lists every rule by stable identifier. FR-007 mandates the registry. SC-004 verifies. PASS.
- **VIII. Deterministic Output** — FR-010 codifies the determinism predicates (no network, no clock, no random, only `KIT_VALIDATE_NO_COLOR` env-var). SC-007 verifies. PASS.

**Quality Gates** (constitution):

- "`npm test` passes before any merge" — CI requirement; satisfied at implementation time. PASS.
- "Every rule has a registry entry" — FR-007. PASS.
- "Every error and warning record validates against published JSON Schema" — FR-008, SC-005. PASS.
- "Zero runtime dependencies on consuming kits" — FR-012. PASS.
- "Every new rule ships with at least one positive and one negative fixture test" — SC-001. PASS.
- "CLI binary and function API exercised by the same test suite" — SC-002. PASS.

Constitution Check: PASS. No violations to justify in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-validator-core/
├── plan.md                      # This file
├── research.md                  # Phase 0 output
├── data-model.md                # Phase 1 output
├── quickstart.md                # Phase 1 output
├── contracts/                   # Phase 1 output
└── tasks.md                     # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
kit-validator/
├── package.json                 # Existing; main, bin, engines.node already set
├── lib/
│   ├── index.js                 # validate(config) entry point
│   ├── load-schema.js           # Reads schema-structure.json, schema-attributes.json
│   ├── load-data.js             # Reads data/*.json with wrapper-format detection
│   ├── format-output.js         # Text and JSON output rendering
│   ├── rules/
│   │   ├── registry.json        # Published registry: id, description, severity, source
│   │   ├── structure-duplicate-type.js
│   │   ├── structure-parent-unresolved.js
│   │   ├── attributes-reference-type-unresolved.js
│   │   ├── attributes-unknown-type.js
│   │   ├── load-priority-missing-type.js
│   │   ├── load-priority-missing-data-file.js
│   │   ├── data-reference-unresolved.js
│   │   ├── data-unknown-field.js
│   │   ├── data-null-value.js
│   │   ├── data-boolean-format.js
│   │   ├── data-date-format.js
│   │   ├── attribute-casing.js
│   │   ├── type-title-case.js
│   │   └── file-kebab-case.js
├── bin/
│   └── kit-validate.js          # CLI wrapper: parses argv, calls validate(), prints, exits
├── docs/
│   └── output-schema.json       # Published JSON Schema for ErrorRecord and WarningRecord
├── tests/
│   ├── fixtures/                # Synthetic kit-shaped directories
│   │   ├── clean/                       # Passes all rules
│   │   ├── attribute-casing-bad/        # Fails attribute.casing
│   │   ├── type-title-case-bad/         # Fails type.title-case
│   │   ├── file-kebab-case-bad/         # Fails file.kebab-case
│   │   ├── duplicate-type/              # Fails structure.duplicate-type
│   │   ├── reference-unresolved/        # Fails data.reference.unresolved
│   │   └── (one positive + one negative fixture per rule)
│   ├── api.test.js              # Tests validate(config) against fixtures
│   ├── cli.test.js              # Tests bin/kit-validate.js against fixtures (text + json)
│   ├── registry.test.js         # Verifies registry coverage (SC-004)
│   ├── output-schema.test.js    # Verifies records validate against schema (SC-005)
│   ├── kit-agnostic.test.js     # Implements the kit-agnostic grep (SC-003)
│   └── determinism.test.js      # Runs validate twice, asserts identical output (SC-007)
├── CLAUDE.md                    # Updated by update-agent-context.sh
├── README.md                    # Existing
└── LICENSE                      # Existing (MIT)
```

**Structure Decision**: One file per rule under `lib/rules/`. Each rule exports a single function `(context) => Array<ErrorRecord | WarningRecord>`. The dispatcher in `lib/index.js` iterates the registry and calls each rule with shared context (loaded schema, loaded data, config, etc.). This keeps rule code small, self-contained, and trivially mappable to its registry entry. Tests are organized by surface (api/cli) plus cross-cutting test files for SC-003, SC-004, SC-005, SC-007.

## Implementation Sequencing

The 14 rules can be ordered by dependency. The first chunk is infrastructure that every rule needs:

1. `lib/load-schema.js` and `lib/load-data.js` — read inputs into a normalized in-memory shape.
2. `lib/index.js` — dispatcher that iterates registry, calls each rule, aggregates output.
3. `lib/format-output.js` — text rendering and JSON rendering.
4. `bin/kit-validate.js` — argv parsing, calls into lib/index.js.
5. `docs/output-schema.json` — JSON Schema for output records (informs rule implementations).
6. Rules, in order of internal dependency:
   - Structure rules first (`structure-*`, `attributes-*`).
   - Lookup rules (`load-priority-*`).
   - Naming-convention rules (`attribute-casing`, `type-title-case`, `file-kebab-case`).
   - Data rules (`data-*`).
7. Per-rule fixtures and tests as each rule lands.
8. Cross-cutting tests (`kit-agnostic.test.js`, `registry.test.js`, `output-schema.test.js`, `determinism.test.js`).
9. v0.1.0 tag and push.

## Complexity Tracking

No violations. Section intentionally empty.
