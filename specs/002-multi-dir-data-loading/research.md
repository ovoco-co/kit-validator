# Research: Multi-Directory Data Loading

**Feature**: 002-multi-dir-data-loading
**Date**: 2026-06-27

Findings that resolve the design before implementation. Each entry is Decision, Rationale, Alternatives considered.

## R1. The loader is the only place that decides where data comes from

**Decision**: Change `lib/load-data.js` to search a list of data directories, `[schemaDir/data, ...domainDirs/data]`, in order. For each type in the merged schema, load its data file from the first directory that has it, record that resolved path in `files[typeName]`, and put the records into `records[typeName]`. The validated record set is the union.

**Rationale**: `loadSchema` already returns `schemaDir` and `domainDirs` on the loaded schema (`load-schema.js:42-43`). `loadData` receives that object and today reads only `path.join(loadedSchema.schemaDir, 'data')` (`load-data.js:14`). Widening that single directory to the ordered list is the whole behavioral change. Everything downstream consumes `records` and `files`, so once the union is loaded, the rest follows.

**Alternatives considered**: Merging data inside each rule was rejected, since it would scatter the same logic across many rules and risk divergence. Changing `loadSchema` to also load data was rejected, since data loading already has its own module and the separation is clean.

## R2. Seven of the data rules already work on the union; one does not

**Decision**: Leave the record-validating rules untouched. Change exactly one rule, `file-kebab-case.js`, to scan all data directories.

**Rationale**: The rules `data.reference.unresolved`, `data.unknown-field`, `data.null-value`, `data.boolean-format`, `data.date-format`, and `load-priority.missing-data-file` all iterate `ctx.data.records` and read `ctx.data.files[typeName]`. Once `records` is the union and `files` holds resolved paths, these rules validate the combined set and name the right file with no change. `data.reference.unresolved` in particular resolves a domain record's reference to a base record automatically, because the base record is now in `records`. The exception is `file-kebab-case.js`, which reads `ctx.data.dataDir` directly and lists that one directory for non-kebab filenames. In a layered run it would only check the primary directory and miss a badly named file in a domain directory. It must iterate every data directory.

**Alternatives considered**: Leaving `file-kebab-case` scanning only the primary was rejected: it silently drops coverage on domain directories, which is a real gap. Splitting it into a new per-directory rule was rejected: it would add a rule and change the registry, against the feature's intent and Principle V.

## R3. Expose the directory list on the data object for the one rule that needs it

**Decision**: Have `loadData` return `dataDirs` (the ordered list of data directories) in addition to the existing `dataDir` (the primary). `file-kebab-case` iterates `dataDirs`. Keep `dataDir` so nothing that reads it breaks.

**Rationale**: The data object is internal, not the public output contract, so adding a field is safe. Keeping `dataDir` as the primary directory preserves any reader of it; adding `dataDirs` gives the kebab-case rule what it needs. In a single-directory run, `dataDirs` is `[dataDir]`, so behavior is identical.

**Alternatives considered**: Replacing `dataDir` outright was rejected as needless churn. Recomputing the directory list inside the rule from `ctx.schema` was rejected: the loader already knows the list, so it should own it.

## R4. The command line needs no change

**Decision**: Do not touch `bin/kit-validate.js`.

**Rationale**: The CLI already parses a repeatable `--domain` into a `domainDirs` array and calls `validate({ schemaDir, domainDirs })` (`bin/kit-validate.js:46-47, 67`). Once `validate` loads multi-directory data, the CLI inherits it with zero divergence, which is exactly the symmetry Principle IV requires.

**Alternatives considered**: None needed.

## R5. First-match-wins and the version

**Decision**: When a type's data file exists in more than one directory, the first in search order wins, primary then each domain as given, and later duplicates are ignored with no message. Release as v0.3.0.

**Rationale**: This matches the resolved clarification (FR-007) and the order cmdb-kit's own loader already uses. It adds no rule, stays deterministic, and consuming kits keep one file per type, so it is a guard, not a routine path. The change is a backward-compatible addition, so semver calls for a minor bump.

**Alternatives considered**: A warning or error on duplicates was rejected during specify, since it would add a rule and stretch the no-new-rules scope.

## R6. Backward compatibility is provable against the existing suite

**Decision**: Treat the 48 existing tests as the backward-compatibility oracle: they all pass unchanged, and any single-directory example produces identical output.

**Rationale**: When `domainDirs` is empty or absent, `dataDirs` is `[schemaDir/data]`, so the loader reads exactly what it read before, in the same order. The existing suite exercises single-directory validation, so its passing unchanged is the proof.

**Alternatives considered**: A separate golden-output snapshot was considered but is unnecessary; the existing deterministic tests already pin the output.
