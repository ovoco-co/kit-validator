# Implementation Plan: Multi-Directory Data Loading

**Branch**: `002-multi-dir-data-loading` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-multi-dir-data-loading/spec.md`

## Summary

Make the validator load data records from the primary schema directory and from every merged domain directory, not only the primary, so a domain validated on top of a base resolves its cross-directory references. The change is localized to the data loader. The record-validating rules already operate on the combined record set, so they need no change. One rule that scans a data directory directly for filename casing must be extended to scan all data directories. The command line already forwards domains, so it inherits the behavior. The release is a backward-compatible minor bump to v0.3.0.

## Technical Context

**Language/Version**: Node.js >=18, CommonJS. Unchanged.  
**Primary Dependencies**: None. Node standard library only (`fs`, `path`). Unchanged.  
**Storage**: JSON files on disk read by the loader. No database.  
**Testing**: `node --test tests/`. Self-contained fixtures under `tests/fixtures`. 48 tests pass today; this feature adds tests and keeps all existing ones green.  
**Target Platform**: Node library plus a CLI (`bin/kit-validate.js`), consumed by schema kits.  
**Project Type**: Single library.  
**Performance Goals**: Not applicable. Loading a handful of small JSON files.  
**Constraints**: Backward compatible. Single-directory runs must be byte-identical to v0.2.1 in their reported errors and warnings, in the same order.  
**Scale/Scope**: Two source files change (`lib/load-data.js`, `lib/rules/file-kebab-case.js`), plus a fixture, tests, docs, and the version.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I, Kit-Agnostic Core: The loader change is generic multi-directory loading. No cmdb-kit or any kit-specific logic enters the package. Pass.
- Principle II, Stable Output Contract: Single-directory output is unchanged. Multi-directory runs produce additional findings only where domain data is now actually loaded, which is the intended new behavior, not a contract break. Pass.
- Principle III, Strict Semver: A backward-compatible capability addition. Minor bump to v0.3.0. Pass.
- Principle IV, CLI Symmetry: The CLI already forwards `--domain` into `domainDirs` and calls the same `validate` path, so it inherits multi-directory loading with no divergence. Pass.
- Principle V, Rules Are Constitutionally Sourced: No rule is added or removed. The registry is unchanged. Pass.
- Principle VII, Documented Rule Identity: The `file-kebab-case` rule keeps its id and meaning; only its scan widens from one data directory to all of them. No id change. Pass.
- Principle VI, Self-Contained Testing: New fixture and tests are self-contained under `tests/`. Pass.
- Principle VIII, Deterministic Output: Directories are searched in a fixed order (primary, then domains as given); identical inputs yield identical output. Pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-multi-dir-data-loading/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── data-loading.md
├── checklists/
│   └── requirements.md
└── tasks.md   # /speckit.tasks output, not created here
```

### Source Code (repository root)

```text
lib/
├── load-data.js          # CHANGE: search [schemaDir/data, ...domainDirs/data]; first-match-wins; expose dataDirs.
├── load-schema.js        # unchanged; already returns schemaDir and domainDirs.
├── index.js              # unchanged; validate() passes loadedSchema to loadData.
└── rules/
    └── file-kebab-case.js  # CHANGE: scan all data directories, not just dataDir.

bin/
└── kit-validate.js       # unchanged; already forwards --domain.

tests/
├── fixtures/
│   └── layered/          # NEW: base/ + domain/ where domain data references a base record.
└── multi-dir.test.js     # NEW: union loading, cross-dir refs, file paths, kebab-case across dirs, backward-compat.

package.json              # version 0.2.1 -> 0.3.0.
```

**Structure Decision**: Single library, existing layout. The change is two source files plus a fixture, tests, docs, and the version. No new modules, no new directories beyond the test fixture.

## Complexity Tracking

| Item | Why Needed | Note |
|------|------------|------|
| `file-kebab-case.js` changes, against the spec's "no change to existing rule logic" line | The rule reads a single data directory to flag non-kebab filenames. In a layered run it would silently skip domain directories and lose coverage. Widening its scan to all data directories is required for the rule to keep doing its job. | Not a new rule and not an id change. The spec scope line needs a small carve-out, tracked below. |

## Spec reconciliation (completed)

The `/speckit-clarify` pass on 2026-06-27 folded the `file-kebab-case` finding into `spec.md`, so the spec and this plan now agree:

- FR-002 narrowed to "every record-validating rule," with the filename-casing rule called out as the single exception.
- FR-011 added: the filename-casing rule scans the primary and every additional data directory, keeping its id and meaning.
- An edge case and SC-003 now cover a non-kebab filename caught in an additional directory.
