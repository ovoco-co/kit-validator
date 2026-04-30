---

description: "Task list for Validator Core (v0.1.0)"
---

# Tasks: Validator Core

**Input**: Design documents from `/specs/001-validator-core/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/api-and-cli.md`, `quickstart.md`

**Tests**: Tests ARE in scope. FR-006 requires positive and negative fixtures per rule; SC-001 mandates them; SC-002 requires the function API and CLI to share a test suite. Each rule task ships its module, its fixtures, AND its per-rule test file in the same task.

**Organization**: Tasks are grouped by user story so each story is independently verifiable. The bulk of the work is the 14 rules in Phase 3 (User Story 1); Phases 4 and 5 add cross-cutting tests that verify properties (User Story 2 and User Story 3 respectively).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3) for tasks in user-story phases
- File paths are absolute under `/home/admin1/ovoco/kit-validator/`

## Phase 1: Setup

- [X] T001 Verify `/home/admin1/ovoco/kit-validator/package.json`: `dependencies` is empty or absent (no runtime deps per FR-012); `main` is `lib/index.js`; `bin.kit-validate` is `bin/kit-validate.js` per FR-013; `engines.node` is `>=18`. NOTE: original task wording proposed adding `ajv` to `devDependencies` for the output-schema test. Implementation chose to hand-roll the schema validation in `tests/output-schema.test.js` instead, keeping `devDependencies` empty too. Both runtime and dev dependency lists are empty in v0.1.0.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the infrastructure every rule depends on.

- [X] T002 Create `/home/admin1/ovoco/kit-validator/docs/output-schema.json`: a JSON Schema (draft 2020-12 or similar) for `ErrorRecord` and `WarningRecord` per `data-model.md`. Required fields on each record: `ruleId` (string), `severity` (string, enum [error, warning]), `message` (string), `file` (string|null), `recordName` (string|null), `field` (string|null). The schema is referenced by `tests/output-schema.test.js`.
- [X] T003 Create `/home/admin1/ovoco/kit-validator/lib/load-schema.js`: exports `loadSchema(schemaDir, domainDirs)` returning `LoadedSchema` per `data-model.md`. Reads `schema-structure.json` and `schema-attributes.json` from `schemaDir`; if `domainDirs` is non-empty, reads each domain's structure and attributes and merges (concatenate types, merge attributes by type name with later domains overriding earlier). Returns a normalized object; throws an error record (not a JS exception) when required files are missing or unparseable per Edge Cases.
- [X] T004 [P] Create `/home/admin1/ovoco/kit-validator/lib/load-data.js`: exports `loadData(loadedSchema)` returning `LoadedData` per `data-model.md`. For each type in `loadedSchema.types`, computes the kebab-case data file name and reads `data/<kebab>.json` if present. Handles wrapper formats: plain array, `{objects: [...]}`, `{values: [...]}`, `{TypeName: [...]}`. Stores per-type record arrays. Records missing data files in `loadedData.files` as null entries.
- [X] T005 Create `/home/admin1/ovoco/kit-validator/lib/format-output.js`: exports `formatText({errors, warnings})` and `formatJson(result)`. Text mode: errors to stderr, warnings to stdout, one record per line, format `<severity> <ruleId> <file>:<recordName>:<field> - <message>`, ANSI color when the target stream is a TTY, color suppressed when `process.env.KIT_VALIDATE_NO_COLOR` is set. JSON mode: writes `JSON.stringify(result)` to stdout.
- [X] T006 [P] Create `/home/admin1/ovoco/kit-validator/lib/rules/registry.json`: a JSON array of 14 rule entries, one per rule in spec FR-006. Each entry has `id`, `description`, `severity`, `constitutionalSource` (array of citations). Entries in spec-order: `structure.duplicate-type`, `structure.parent-unresolved`, `attributes.reference-type-unresolved`, `attributes.unknown-type`, `load-priority.missing-type`, `load-priority.missing-data-file`, `data.reference.unresolved`, `data.unknown-field`, `data.null-value`, `data.boolean-format`, `data.date-format`, `attribute.casing`, `type.title-case`, `file.kebab-case`. The three naming-convention rules cite both cmdb-kit and hr-kit constitutions.
- [X] T007 Create `/home/admin1/ovoco/kit-validator/lib/index.js`: exports `validate(config)`. Loads schema (via T003), loads data (via T004), iterates `lib/rules/registry.json` (loaded via require), maps each `id` to a module path (e.g., `attribute.casing` -> `lib/rules/attribute-casing.js`), `require`s and calls each rule with the dispatch context `{schema, data, config}`. Concatenates returned records, sorts deterministically by `(ruleId, file, recordName, field)`, splits into errors and warnings by severity, computes `exitCode = errors.length === 0 ? 0 : 1`, returns `{errors, warnings, exitCode}`. Silently ignores unknown config keys (FR-005). Validates that `config.schemaDir` is provided; emits a single error record if missing. Depends on T002-T006.
- [X] T008 [P] Create `/home/admin1/ovoco/kit-validator/bin/kit-validate.js`: shebang `#!/usr/bin/env node`. Parses `process.argv` for `--schema <dir>`, `--domain <dir>` (repeatable), `--format <text|json>` (default `text`), `--help`/`-h`. Builds config (schemaDir, domainDirs, plus loadPriority/nestedTypes/attrNameMap as empty defaults that consumers override via thin wrappers per `quickstart.md`). Calls `validate(config)` from T007. Routes output through `formatText` or `formatJson` from T005 based on `--format`. Calls `process.exit(result.exitCode)`. Make executable: `chmod +x bin/kit-validate.js`. Depends on T005, T007.

**Checkpoint**: Foundation ready. The dispatcher iterates the registry but no rule modules exist yet; first rule task lands the first rule and the dispatcher starts producing real output.

## Phase 3: User Story 1 - Consuming kit installs and runs the validator (Priority: P1) MVP

**Goal**: Implement all 14 rules so a consuming kit can `npm install` v0.1.0, run `kit-validate --schema ...`, and get either a clean exit or a precise list of violations with rule identifiers.

**Independent Test**: For each of the 14 rules, the positive fixture (rule fires) produces an error or warning record with the expected `ruleId`, and the negative fixture (rule does not fire) produces no record for that rule. Verifiable by running each rule's `tests/rules/<id>.test.js` via `node --test`.

### Implementation for User Story 1

Each task in this phase ships: the rule module under `lib/rules/`, a positive fixture (rule fires) under `tests/fixtures/<id>-positive/`, a negative fixture (rule does not fire) under `tests/fixtures/<id>-negative/`, and a per-rule test file at `tests/rules/<id>.test.js` that runs the validator against both fixtures and asserts on the emitted records. All 14 are mutually parallelizable since each touches a distinct set of files.

- [X] T009 [P] [US1] Implement `structure.duplicate-type` per spec FR-006. Module: `/home/admin1/ovoco/kit-validator/lib/rules/structure-duplicate-type.js`. Fixtures: `/home/admin1/ovoco/kit-validator/tests/fixtures/structure-duplicate-type-positive/` (schema-structure.json with two entries sharing the same `name`) and `/home/admin1/ovoco/kit-validator/tests/fixtures/structure-duplicate-type-negative/` (clean). Test: `/home/admin1/ovoco/kit-validator/tests/rules/structure-duplicate-type.test.js`. Severity: error.
- [X] T010 [P] [US1] Implement `structure.parent-unresolved`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/structure-parent-unresolved.js`. Fixtures + test in matching paths. Positive fixture: a type whose `parent` field references a name not in schema-structure.json. Severity: error.
- [X] T011 [P] [US1] Implement `attributes.reference-type-unresolved`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/attributes-reference-type-unresolved.js`. Positive fixture: an attribute with `type: 1` and `referenceType: "Nonexistent"`. Severity: error.
- [X] T012 [P] [US1] Implement `attributes.unknown-type`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/attributes-unknown-type.js`. Positive fixture: schema-attributes.json has an entry for "Mystery Type" not in schema-structure.json. Severity: warning.
- [X] T013 [P] [US1] Implement `load-priority.missing-type`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/load-priority-missing-type.js`. Positive fixture: schema-structure.json declares "Candidate" but `loadPriority` config does not include it. Severity: warning. Per Edge Cases, `loadPriority` containing types not in the current `--schema` target is informational and not a violation.
- [X] T014 [P] [US1] Implement `load-priority.missing-data-file`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/load-priority-missing-data-file.js`. Positive fixture: `loadPriority` includes "Candidate" but `data/candidate.json` does not exist. Severity: warning.
- [X] T015 [P] [US1] Implement `data.reference.unresolved`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/data-reference-unresolved.js`. Positive fixture: an Application record whose `candidate` field is "Nonexistent Person". Severity: error.
- [X] T016 [P] [US1] Implement `data.unknown-field`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/data-unknown-field.js`. Positive fixture: a record with a `mysteryField` key not declared in schema-attributes.json and not in the metadata-key allowlist (`Name`, `name`, `description`). Severity: warning.
- [X] T017 [P] [US1] Implement `data.null-value`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/data-null-value.js`. Positive fixture: a record with an attribute set to `null`. Severity: warning.
- [X] T018 [P] [US1] Implement `data.boolean-format`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/data-boolean-format.js`. Positive fixture: a record with a boolean-typed attribute holding the string `"true"` instead of the boolean `true`. Severity: warning.
- [X] T019 [P] [US1] Implement `data.date-format`. Module: `/home/admin1/ovoco/kit-validator/lib/rules/data-date-format.js`. Positive fixture: a record with a date-typed attribute holding `"01/15/2026"` instead of `"2026-01-15"`. Severity: warning.
- [X] T020 [P] [US1] Implement `attribute.casing` (NEW; constitutional). Module: `/home/admin1/ovoco/kit-validator/lib/rules/attribute-casing.js`. Match attribute names against `^[a-z][a-zA-Z0-9]*$`. Positive fixture: schema-attributes.json with an attribute named `SourceChannel` or `source_channel`. Severity: error. Constitutional source per registry: cmdb-kit Constitution III, hr-kit Constitution III.
- [X] T021 [P] [US1] Implement `type.title-case` (NEW; constitutional). Module: `/home/admin1/ovoco/kit-validator/lib/rules/type-title-case.js`. Each space-separated word starts with an uppercase letter; allow acronyms in all-caps. Positive fixture: schema-structure.json with a type named "source channel" or "Source channel". Severity: error.
- [X] T022 [P] [US1] Implement `file.kebab-case` (NEW; constitutional). Module: `/home/admin1/ovoco/kit-validator/lib/rules/file-kebab-case.js`. Match data file names against `^[a-z][a-z0-9]*(-[a-z0-9]+)*\.json$`. Positive fixture: a data directory containing `SourceChannel.json` or `source_channel.json`. Severity: error.

**Checkpoint**: All 14 rules implemented. The validator produces correct output for any schema. User Story 1 acceptance scenarios pass via `tests/rules/*.test.js`.

## Phase 4: User Story 2 - Library is kit-agnostic (Priority: P1)

**Goal**: Verify the kit-agnostic property by automated test.

**Independent Test**: A grep across `lib/`, `bin/`, and `tests/` for kit-specific strings returns zero matches.

### Implementation for User Story 2

- [X] T023 [US2] Create `/home/admin1/ovoco/kit-validator/tests/kit-agnostic.test.js`: a `node --test` test that walks `/home/admin1/ovoco/kit-validator/lib/`, `/home/admin1/ovoco/kit-validator/bin/`, and `/home/admin1/ovoco/kit-validator/tests/` (excluding the `tests/kit-agnostic.test.js` file itself, which by definition contains the search terms). For each file, reads the content and asserts that none of the strings `cmdb-kit`, `hr-kit`, `OvocoCRM`, `Keystone`, `Hireology`, `ServiceNow`, `JSM`, `Atlassian` appear. Implements SC-003 and FR-011.

**Checkpoint**: User Story 2's acceptance scenarios pass. The library is verifiably kit-agnostic.

## Phase 5: User Story 3 - Rule discoverability and traceability (Priority: P1)

**Goal**: Verify the registry contains every rule the validator emits, and every record the validator emits validates against the published JSON Schema.

**Independent Test**: `tests/registry.test.js` and `tests/output-schema.test.js` both pass.

### Implementation for User Story 3

- [X] T024 [P] [US3] Create `/home/admin1/ovoco/kit-validator/tests/registry.test.js`: loads `lib/rules/registry.json`, asserts every entry has `id`, `description`, `severity`, `constitutionalSource` (array, length >= 1). Then runs the validator against `tests/fixtures/` covering all rules; collects every distinct `ruleId` from emitted records. Asserts the set of registry IDs equals the set of emitted IDs (no missing entries; no orphan entries). Implements SC-004.
- [X] T025 [P] [US3] Create `/home/admin1/ovoco/kit-validator/tests/output-schema.test.js`: loads `docs/output-schema.json` and instantiates ajv. Runs the validator against `tests/fixtures/` covering all rules. For each emitted error and warning record, asserts the record validates against the schema. Implements SC-005.

**Checkpoint**: User Story 3's acceptance scenarios pass. Every rule has a registry entry; every output record validates against the published schema.

## Phase 6: Polish and Cross-Cutting

- [X] T026 [P] Create `/home/admin1/ovoco/kit-validator/tests/cli.test.js`: spawns `bin/kit-validate.js` as a child process with various argument combinations. Asserts: clean fixture produces empty stdout/stderr and exit 0; failing fixture produces non-empty stderr (error lines) and exit 1; `--format json` mode produces a single JSON document on stdout; `--help` exits 0 and prints usage; setting `KIT_VALIDATE_NO_COLOR=1` produces output without ANSI codes. Implements SC-002 (CLI side; the function-API side is implicit in T009-T022).
- [X] T027 [P] Create `/home/admin1/ovoco/kit-validator/tests/determinism.test.js`: runs `validate(config)` twice in succession against the same fixture and asserts the two return values are deeply equal (record contents AND order). Implements SC-007.
- [X] T028 Run `npm test` from `/home/admin1/ovoco/kit-validator/`. Confirm zero failures across all test files. Fix any. Verify SC-001: every rule has both fixtures present.
- [ ] T029 Tag and push v0.1.0: `git tag v0.1.0 && git push origin v0.1.0`. This is the moment hr-kit's `npm install` of `git+https://github.com/ovoco-co/kit-validator.git#v0.1.0` becomes resolvable.

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 (T001)**: no dependencies; can run immediately.
- **Phase 2 (T002-T008)**: T002, T003, T004, T005, T006 are mutually parallelizable (different files). T007 depends on T002-T006. T008 depends on T005 and T007.
- **Phase 3 (T009-T022)**: depends on Phase 2 complete (rules need the dispatcher and the registry). All 14 rule tasks are mutually parallelizable.
- **Phase 4 (T023)**: independent of Phase 3 (the test scans source files; can run as soon as the source structure exists). In practice run after Phase 3 to catch real coverage.
- **Phase 5 (T024, T025)**: depends on Phase 3 complete (need rules and fixtures to verify against). T024 and T025 are mutually parallelizable.
- **Phase 6 (T026, T027, T028, T029)**: T026 and T027 are mutually parallelizable. T028 depends on all earlier tasks. T029 depends on T028 (don't tag a release that fails tests).

### Parallel Opportunities

- All 14 rules in Phase 3 (T009-T022) can be authored in parallel. Each touches a distinct set of files (one rule module + two fixtures + one test file), no shared editing.
- T026 (CLI test), T027 (determinism test) are mutually parallel and can run with the late Phase 3 tasks if developers want overlap.
- Within Phase 2, T002 (output schema), T004 (load-data), T006 (registry) are file-independent and can run in parallel with each other.

## Implementation Strategy

### MVP scope

The MVP for v0.1.0 is the entire feature. Unlike a typical web app where US1 is a thin slice, kit-validator's three P1 stories are interlocking properties of the same shipped library. Skipping any of them means kit-validator fails its own constitution. The 14 rules + the kit-agnostic test + the registry coverage test + the output schema test are all required at v0.1.0.

### Incremental delivery shape

1. Phase 1, Phase 2: foundation in place. Dispatcher exists; can be exercised against fixtures but emits no records yet.
2. Phase 3: rules land one at a time (or in parallel). Each rule's tests exercise the dispatcher end-to-end. Coverage grows incrementally.
3. Phase 4: kit-agnostic test fires the moment rules and tests are written; catches any kit-specific drift early.
4. Phase 5: registry + output schema tests; ensures contract surfaces are coherent.
5. Phase 6: CLI test, determinism test, npm test green, tag.

### Notes on test runner

`node --test` discovers test files matching `*.test.js` recursively when run as `node --test tests/`. The `package.json` `scripts.test` is `node --test tests/`. No additional test framework is introduced.

### Notes on the rule registry

`lib/rules/registry.json` is hand-maintained per the research.md decision. T006 creates all 14 entries upfront so the dispatcher's iteration shape is set; rule tasks (T009-T022) verify their entry exists during their tests but do not modify the registry. If a rule's metadata changes during implementation (for instance, a phrasing fix to `description`), update the registry in the same task.

### Notes on naming convention rules (T020, T021, T022)

These three rules are NEW (not present in cmdb-kit's existing validator). They are constitutionally sourced from BOTH cmdb-kit Constitution III AND hr-kit Constitution III. Severity is `error` per FR-006 and per the research decision: convention rules are constitutional MUSTs; warnings would get muted in CI; errors enforce compliance.

### Notes on the output JSON Schema (T002)

The schema validates the shape of error and warning records (FR-008). Use JSON Schema draft 2020-12 (default for ajv) unless a specific reason dictates otherwise. Required fields per `data-model.md`: `ruleId`, `severity`, `message`, `file`, `recordName`, `field`. The latter three are nullable, not optional (always present, may be `null`).
