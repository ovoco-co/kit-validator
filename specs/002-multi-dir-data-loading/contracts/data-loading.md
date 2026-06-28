# Contract: Multi-Directory Data Loading

**Feature**: 002-multi-dir-data-loading
**Date**: 2026-06-27

The public surface, `validate(config)` and the `kit-validate` CLI, keeps its signature. The contract is the observable behavior. Each item is verifiable and becomes an acceptance check for `/speckit-tasks` and quickstart.

## C1. Signature unchanged

`validate(config)` still takes `{ schemaDir, domainDirs?, ... }` and returns `{ errors, warnings, exitCode }`. No parameter is added or removed.

Pass condition: existing callers compile and run with no change.

## C2. Single-directory behavior is byte-identical

With `domainDirs` empty or absent, the loaded data and the reported errors and warnings are identical to v0.2.1, in the same order.

Pass condition: all 48 existing tests pass unchanged, and a base validated alone reports the same findings as before.

## C3. Domain data is loaded and validated

With `domainDirs` non-empty, every type's records are loaded from the first directory in search order that has the file, and the validated set is the union.

Pass condition: a type whose data lives only in a domain directory has its records validated, and `load-priority.missing-data-file` does not report it as missing.

## C4. Cross-directory references resolve

A record in a domain directory that references a record defined in the primary directory resolves, and the reverse resolves too.

Pass condition: a fixture where a domain record references a base record reports zero `data.reference.unresolved` findings for that reference.

## C5. Findings name the owning directory

Each finding names the file the record actually came from, whether base or domain.

Pass condition: a fault injected into a domain data file produces a finding whose `file` is the domain file; a fault in the base file names the base file.

## C6. Filename casing is checked across all directories

`file-kebab-case` flags a non-kebab data filename in any data directory, base or domain, and names that file. The rule keeps its id.

Pass condition: a `Bad_Name.json` placed in a domain directory produces one `file.kebab-case` finding naming that file.

## C7. Search order and duplicates are deterministic

Directories are searched primary-first, then domains in the order given. If a type's file exists in more than one directory, the first wins and later duplicates are ignored with no message.

Pass condition: with the same file present in two directories, the records loaded are the first directory's, deterministically, with no extra finding.

## C8. CLI and programmatic parity

`kit-validate --schema base --domain d` produces the same result as `validate({ schemaDir: base, domainDirs: [d] })`.

Pass condition: both entry points report the same findings on the same inputs.

## C9. Minor version

The package is released as v0.3.0, a backward-compatible minor bump.

Pass condition: `package.json` version is `0.3.0`.
