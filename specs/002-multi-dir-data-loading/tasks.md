---
description: "Task list for Multi-Directory Data Loading"
---

# Tasks: Multi-Directory Data Loading

**Input**: Design documents from `/specs/002-multi-dir-data-loading/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/data-loading.md, quickstart.md

**Tests**: Tests are required. The constitution mandates self-contained testing (Principle VI) and the spec's success criteria depend on them, so each story includes test tasks run with `node --test tests/`.

**Organization**: Tasks are grouped by user story. The single loader change in US1 is what delivers the behavior; US2 and US3 are verification slices over the same change plus the CLI that already forwards domains.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1, US2, US3

## Path Conventions

Single library. Source under `lib/`, CLI under `bin/`, tests and fixtures under `tests/`.

---

## Phase 1: Setup

**Purpose**: Build the fixture every later test needs.

- [X] T001 Create a layered fixture under `tests/fixtures/layered/`: a `base/` tier (`schema-structure.json`, `schema-attributes.json`, and `data/` with at least one record of a base type) and a `domain/` tier (`schema-structure.json` adding a domain type, `schema-attributes.json`, and `data/` with a record that references a base record by Name). Keep it minimal and self-contained.

---

## Phase 3: User Story 1 - Validate a domain layered on a base (Priority: P1)

**Goal**: The loader reads data from the primary directory and every additional directory, validating the union, so cross-directory references resolve and the filename-casing rule covers every directory.

**Independent Test**: Validate the base with the domain passed as an additional directory; the domain's records validate, the cross-directory reference resolves, and the run reports zero errors, while the base validated alone is unchanged.

- [X] T002 [US1] In `lib/load-data.js`, build the ordered list `dataDirs = [schemaDir/data, ...domainDirs/data]` from the loaded schema. For each type, search the directories in order and load its data file from the first that has it; set `records[type]` to the array (or null if absent in all), `files[type]` to the resolved path (the primary path when absent), and push parse errors naming the resolved file. Return `dataDirs` alongside the existing `dataDir` (the primary). When `domainDirs` is empty, behavior is identical to v0.2.1 (FR-001, FR-002, FR-004, FR-005, FR-006, FR-007).
- [X] T003 [US1] In `lib/rules/file-kebab-case.js`, scan every directory in `ctx.data.dataDirs` (fall back to `[ctx.data.dataDir]`) for non-kebab `.json` filenames. Keep the rule id and message. Make the reported path name the owning file consistently for base and domain directories (FR-011).
- [X] T004 [P] [US1] In `tests/multi-dir.test.js`, test that validating the base plus the domain loads the domain's records (a domain-only type is validated, not reported as a missing data file) and the domain record's reference to the base record resolves with zero `data.reference.unresolved` findings (FR-001, FR-002, FR-003).
- [X] T005 [P] [US1] In `tests/multi-dir.test.js`, test that the base validated alone, with no additional directories, produces output identical to the prior behavior in errors and warnings and their order (FR-004, SC-002).
- [X] T006 [P] [US1] In `tests/multi-dir.test.js`, test that a non-kebab data filename placed in the domain directory yields exactly one `file.kebab-case` finding naming that domain file (FR-011, SC-003).
- [X] T007 [P] [US1] In `tests/multi-dir.test.js`, test the duplicate-file guard: place the same type's data file in both the base and the domain directory with different records, validate base plus domain, and assert the base copy's records win (first-match-wins, primary first) with no extra finding emitted (FR-007, contract C7).

**Checkpoint**: Layered validation works, references resolve, casing is checked across directories, the duplicate guard is deterministic, single-directory runs are unchanged.

---

## Phase 4: User Story 2 - Findings name the owning directory (Priority: P2)

**Goal**: Confirm that every finding names the file its record actually came from, base or domain.

**Independent Test**: Inject a fault into a domain data file and confirm the finding names the domain file; inject one into the base file and confirm it names the base file.

- [X] T008 [US2] In `tests/multi-dir.test.js`, test that a fault injected into the domain data file produces a finding whose `file` is the domain file, and a fault in the base data file produces a finding naming the base file (FR-005, contract C5).

**Checkpoint**: Findings are traceable to the right directory.

---

## Phase 5: User Story 3 - CLI and programmatic parity (Priority: P3)

**Goal**: Confirm the command line and the programmatic call produce the same result on a layered input, with no CLI code change (the CLI already forwards `--domain`).

**Independent Test**: Run the same base-plus-domain validation through the CLI and through `validate()` and compare results.

- [X] T009 [US3] In `tests/multi-dir.test.js`, test that `bin/kit-validate.js --schema <base> --domain <domain>` and `validate({ schemaDir: <base>, domainDirs: [<domain>] })` report the same errors and warnings on the fixture (FR-009, contract C8).

**Checkpoint**: The two entry points are in lockstep.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T010 [P] Bump the version in `package.json` from 0.2.1 to 0.3.0 (FR-008, contract C9).
- [X] T011 [P] Update documentation, `README.md` and any data-shape or loading notes, to describe multi-directory data loading: data loads from the primary and every additional directory, first-match-wins in search order, single-directory behavior unchanged.
- [X] T012 Run the full suite with `node --test tests/` and confirm all prior 48 tests pass plus the new ones, then walk through `quickstart.md` end to end (SC-002, SC-003, SC-004, SC-005, SC-006).

---

## Dependencies

- T001 (fixture) before every test task.
- T002 (loader) is the core change; T004, T005, T006, T007, T008, T009 all depend on it.
- T003 (kebab rule) depends on T002 exposing `dataDirs`; T006 depends on T003.
- US2 (T008) and US3 (T009) depend on US1's T002.
- Polish (T010, T011, T012) last; T012 depends on all test tasks.

## Parallel Execution Examples

- The test tasks T004 through T009 all edit the same `tests/multi-dir.test.js`, so they are written together in one pass rather than in parallel; the [P] marks reflect logically independent cases within that file.
- In polish, T010 and T011 touch different files (`package.json` vs docs) and run in parallel.

## Implementation Strategy

The MVP is US1: the loader change plus the kebab-rule widening delivers layered validation, and it is independently shippable and testable. US2 and US3 are verification slices over the same change and the already-symmetric CLI. Land US1, confirm US2 and US3, then bump the version, update docs, and run the full suite as the backward-compatibility gate.
