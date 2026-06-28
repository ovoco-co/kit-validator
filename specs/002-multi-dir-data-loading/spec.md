# Feature Specification: Multi-Directory Data Loading

**Feature Branch**: `002-multi-dir-data-loading`  
**Created**: 2026-06-27  
**Status**: Draft  
**Input**: User description: "Load validation data from the primary schema directory and from every merged domain directory, so a domain validated on a base resolves cross-tier references. Backward-compatible minor release to v0.3.0."

## Clarifications

### Session 2026-06-27

- Q: When the same type's data file appears in more than one directory, which wins? → A: First-match-wins in search order, the primary directory first then each additional directory in the order given; later duplicates are ignored with no message and no new rule (FR-007).
- Q: The record-validating rules work on the combined set unchanged, but the filename-casing rule scans a single data directory. How is it handled? → A: That one rule is widened to scan every data directory so a non-kebab filename in an additional directory is still flagged. It keeps its id and meaning; this is the only existing rule whose logic changes (FR-011).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate a domain layered on a base (Priority: P1)

A consuming kit validates a domain that sits on top of a base schema. It points the validator at the base as the primary schema and passes the domain as an additional directory. The validator already merges the domain's structure and attributes with the base. It must also load the domain's data records, so the combined record set is validated as one. A domain record that references a base record then resolves, because both halves are loaded.

**Why this priority**: This is the entire purpose of the feature. Without it, a layered schema cannot be validated at all: the domain's records are silently skipped and any reference from a domain record to a base record is reported as broken. It is the single capability that unblocks consuming kits with a layered schema, and it is independently shippable.

**Independent Test**: Validate a base directory plus one domain directory whose data references a base record. The domain's records are validated, the cross-directory reference resolves, and the run reports zero errors. The same base validated alone behaves exactly as it did before.

**Acceptance Scenarios**:

1. **Given** a base directory and a domain directory whose data file references a record defined in the base data, **When** the consumer validates the base with the domain passed as an additional directory, **Then** the domain records are validated and the cross-directory reference resolves with no error.
2. **Given** the same base validated with no additional directories, **When** the consumer validates it, **Then** the result is identical to the prior release, byte for byte in the reported errors and warnings.
3. **Given** a domain directory that introduces a type the base does not define, **When** the consumer validates base plus domain, **Then** that type's records are loaded from the domain directory and validated.

---

### User Story 2 - Errors point at the directory that owns the file (Priority: P2)

A consumer fixes a problem the validator reports in a layered run. Each finding names the actual file the record came from, whether that file lives in the base directory or a domain directory, so the consumer can open the right file without guessing.

**Why this priority**: The capability in Story 1 is usable without this, but findings that point at the wrong directory waste the consumer's time. It is a quality refinement on top of the core behavior.

**Independent Test**: Introduce a fault in a domain data file, validate base plus domain, and confirm the finding names the domain file, not a base file.

**Acceptance Scenarios**:

1. **Given** a faulty record in a domain data file, **When** the consumer validates base plus domain, **Then** the finding names the domain file path.
2. **Given** a faulty record in the base data file, **When** the consumer validates base plus domain, **Then** the finding names the base file path.

---

### User Story 3 - The command line behaves like the programmatic call (Priority: P3)

A consumer who runs the validator from the command line with a base and one or more domain directories gets the same multi-directory data loading as a consumer who calls the validator programmatically. The two entry points stay in lockstep.

**Why this priority**: It preserves the constitution's command-line symmetry principle. It depends on Story 1 being in place, so it follows.

**Independent Test**: Run the same base-plus-domain validation through the command line and through the programmatic call and confirm both report the same result.

**Acceptance Scenarios**:

1. **Given** a base and a domain directory, **When** the consumer validates them from the command line, **Then** the result matches the programmatic call on the same inputs.

---

### Edge Cases

- A type's data file is absent from every directory. The existing missing-data behavior is unchanged: the record set for that type is empty and the load-priority rules report it as before.
- A type's data file is malformed in a domain directory. It is reported as a parse error naming the domain file, exactly as a malformed base file is today.
- A data filename in an additional directory is not kebab-case. It is flagged with a finding that names that file, the same as a non-kebab filename in the primary directory (FR-011).
- The same type's data file appears in more than one directory. The first in search order wins (primary, then each additional directory in order); later duplicates are ignored, per FR-007.
- A domain directory has no `data` subdirectory. It contributes structure and attributes only, as it does today, and contributes no records.
- A domain record references another domain's record, with both domains passed in the same run. The reference resolves, because all passed directories' data is in the combined set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The validator MUST load data records for each type in the merged schema from the primary schema directory and from every additional directory passed for that run, not only from the primary directory.
- **FR-002**: The validated record set MUST be the union of records found across the primary directory and all additional directories, so every record-validating rule operates on the combined set with no change to its logic. The one rule that scans a data directory for filename casing is the single exception, widened by FR-011.
- **FR-003**: A record in an additional directory that references a record defined in the primary directory MUST resolve, and the reverse MUST resolve as well.
- **FR-004**: When no additional directories are passed, data loading MUST be identical to the prior release: only the primary directory's data is read, and the reported errors and warnings are unchanged.
- **FR-005**: Each loaded type MUST retain the path of the actual file its records came from, so findings name the directory that owns the file.
- **FR-006**: Directories MUST be searched in a defined, deterministic order: the primary directory first, then each additional directory in the order it was given. Identical inputs MUST produce identical output in identical order.
- **FR-007**: When the same type's data file exists in more than one directory, the validator MUST load the first one found in search order, the primary directory first and then each additional directory in the order given, and ignore any later duplicate. No new rule or message is emitted. Consuming kits are expected to keep each type's data in exactly one directory, so this is a deterministic guard, not a routine path.
- **FR-008**: The change MUST be backward compatible and released as a minor version (v0.3.0). No existing behavior for single-directory validation changes.
- **FR-009**: The command-line entry point MUST load multi-directory data the same way the programmatic call does, so the two stay in lockstep.
- **FR-010**: The package MUST contain no kit-specific logic. Multi-directory data loading is generic and works for any consumer that passes a base plus additional directories.
- **FR-011**: The filename-casing rule MUST check data filenames across the primary directory and every additional directory, and a non-kebab-case filename in any of them MUST be flagged with a finding that names that file. The rule keeps its existing identifier and meaning; only its scan widens from one directory to all of them. This is the only existing rule whose logic changes.

### Key Entities *(include if feature involves data)*

- **Primary directory**: The base schema directory a run is pointed at. Its data is loaded today; it continues to load.
- **Additional directory**: A directory merged into a run alongside the primary. Its structure and attributes already merge; its data now loads too.
- **Merged type set**: The set of types from the primary and all additional directories. Each type's data file is sought across all directories.
- **Record set**: The union of all loaded records across all directories. The input every rule validates.
- **Resolved file path**: The single file a type's records were loaded from, retained per type for findings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A base validated with a domain whose data references a base record reports zero errors, where the prior release would drop the domain data or report the reference as broken.
- **SC-002**: A base validated alone produces output identical to the prior release across every example in the existing test suite.
- **SC-003**: The full existing test suite passes unchanged, plus new tests covering base-plus-domain loading, cross-directory reference resolution, the file-path-in-findings behavior, and filename-casing checked across an additional directory.
- **SC-004**: Across repeated runs on the same inputs, the reported errors and warnings are identical in content and order.
- **SC-005**: The command-line and programmatic entry points produce the same result on the same base-plus-domain inputs.
- **SC-006**: The released version is a minor bump to v0.3.0, and no consumer pinned to single-directory use needs any change.

## Assumptions

- The merged schema already includes the types contributed by additional directories. Structure and attribute merging is existing behavior and is not changed by this feature.
- Each consuming kit keeps a given type's data in exactly one directory, so the duplicate-file case (FR-007) is a guard, not a routine path.
- Data files remain flat JSON arrays of records in singular kebab-case filenames. This feature changes where files are sought, not their shape.
- The reference and load-priority rules need no change: once the combined record set is loaded, they resolve cross-directory references naturally.
- The consuming kit that motivates this, cmdb-kit, adopts the new version in a separate downstream feature. That adoption is out of scope here.
