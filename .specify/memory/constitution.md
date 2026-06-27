<!--
Sync Impact Report
Version change: provisional (unversioned) -> 1.0.0
Bump rationale: MAJOR. First ratified version. Promotes the eight provisional
principles to non-negotiable rules, formalizes Quality Gates and Governance,
and establishes the semver discipline this library owes its consumers.
Modified principles:
  - I. Kit-Agnostic Core (tightened to MUST, added compliance test)
  - II. Stable Output Contract (added bump-class table)
  - III. Strict Semver (codified deprecation cycle)
  - IV. CLI Symmetry (tightened)
  - V. Rules Are Constitutionally Sourced (made the rule registry mandatory)
  - VI. Self-Contained Testing (made dependency forbidding explicit)
  - VII. Documented Rule Identity (made registry publishing mandatory)
  - VIII. Deterministic Output (codified determinism's enforceable predicates)
Added sections:
  - Quality Gates
  - Coordination With Consuming Kits
  - Governance
Removed sections:
  - "Notes" (placeholder no longer needed)
Templates requiring updates:
  - .specify/templates/plan-template.md (OK, Constitution Check is dynamic)
  - .specify/templates/spec-template.md (OK, no principle-specific content)
  - .specify/templates/tasks-template.md (OK, no principle-specific content)
  - .specify/templates/constitution-template.md (OK, source template unchanged)
Follow-up TODOs: none. The first feature spec (001-validator-core) operates
under this constitution from the start.
-->

# kit-validator Constitution

## Core Principles

### I. Kit-Agnostic Core

The library MUST NOT contain kit-specific logic. Every rule, helper, and
constant is parameterized through `validate(config)`. The compliance test is
that cmdb-kit and hr-kit both consume the published package without forking.
Any logic that varies between consuming kits belongs in their config or in
their entry-point script, not here.

Rationale: Two kits already depend on this library; a third may follow. Any
kit-specific drift defeats the reason the library exists.

### II. Stable Output Contract

`validate(config)` MUST return `{ errors, warnings, exitCode }` with
documented record shapes. Breaking the output shape is a MAJOR bump. Adding
fields to existing records is a MINOR bump. The output contract is published
as a JSON Schema file alongside each release so consumers can validate against
it programmatically.

Rationale: Consumer CI gates, IDE integrations, and downstream tooling all
depend on the output shape. Silently changing it breaks consumer pipelines.

### III. Strict Semver

Versioning MUST follow these rules:

- New rules ship as MINOR (additive).
- Severity escalation, including warning to error, is MAJOR (breaks consumer CI).
- Rule removal is MAJOR.
- Rule-identifier rename is MAJOR.
- Patches fix bugs without changing rule outcomes.
- Deprecation cycle: one MINOR with a deprecation warning carrying the rule
  identifier MUST precede any MAJOR that removes or renames the rule.

Rationale: Consumers pin to specific tagged releases. Surprise breakage is the
single fastest way to destroy a library's trust.

### IV. CLI Symmetry

`bin/kit-validate.js` MUST expose every capability of the function API. No
CLI-exclusive features and no programmatic-only features. Both surfaces are
covered by the same tests.

Rationale: Kits should be free to call the library programmatically (in their
own tests, in editor integrations) without losing functionality available only
in the CLI binary.

### V. Rules Are Constitutionally Sourced

Every rule MUST trace back to a constitutional clause in at least one
consuming kit. A rule registry (committed at `lib/rules/registry.json` or
equivalent) maps each rule identifier to its constitutional source. The
library does not invent discipline; it implements discipline that already
exists in the schema-kit pattern.

Adding a new rule requires either an existing constitutional citation or
coordination with consuming kits to add one in the same release window.

Rationale: Without this, the library accretes rules that no kit has actually
agreed to follow, and consumers spend their CI budgets on enforcement that
nobody decided was important.

### VI. Self-Contained Testing

Tests MUST run against synthetic fixtures shaped like the kit pattern. The
library MUST NOT pull cmdb-kit, hr-kit, or any consuming kit as a test
dependency. Fixtures live in `tests/fixtures/` and exercise one or two rules
each.

Rationale: A library whose tests depend on a consumer cannot be released
without the consumer being in a known-good state. That is a ship-blocker
disguised as a quality measure.

### VII. Documented Rule Identity

Every rule MUST have:

- A stable identifier (for example `attribute.casing`,
  `data.reference.unresolved`).
- A one-line description.
- A link to its originating constitutional clause.

Rule identifiers MUST be published in the rule registry with each release.
Renaming a rule identifier is a MAJOR bump.

Rationale: Consumers grep for specific rule codes in CI, suppress specific
rules during migrations, and trace failures back to constitutional basis.
Identifiers are part of the contract.

### VIII. Deterministic Output

Same schema and data MUST produce the same errors, warnings, and exit code,
in the same order, on every run. Implicit consequences:

- No network calls.
- No system-clock dependencies.
- No random sampling.
- No environment-variable-driven behavior beyond an explicitly documented
  allowlist (e.g., `KIT_VALIDATE_NO_COLOR`).

Rationale: CI is the single most important consumer use case. Flaky tools
get muted, then ignored, then ripped out.

## Writing and Documentation Standards

- No em dashes. Use hyphens or commas.
- No ampersands as "and" (proper acronyms are fine).
- No horizontal rules.
- No numbered sections. Use header levels.
- No tables of contents.
- No bold in table cells.
- Title is plain text. First header is H1.
- Ground explanations in actual rule code and the rule registry, not abstract
  examples.

## Development Workflow

- Main branch: `main`. All work merges to main.
- Each rule lands as its own commit when practical.
- Tag releases as `v0.1.0`, `v0.2.0`, etc., per Principle III.
- `npm test` MUST pass before any merge.
- Public API changes MUST update the rule registry, the changelog, and bump
  the version per Principle III.
- Output-shape changes MUST update the JSON Schema for output records and
  bump the version per Principle II.

## Quality Gates

- `npm test` passes before any merge.
- Every rule has a registry entry with identifier, description, and
  constitutional source.
- Every error and warning record validates against the published JSON
  Schema for output records.
- The library has zero runtime dependencies on cmdb-kit, hr-kit, or any
  other consuming kit.
- New rules ship with at least one positive (rule fires) fixture and one
  negative (rule does not fire) fixture.
- The CLI binary and the function API are exercised by the same test suite.

## Coordination With Consuming Kits

When a new rule lands or a rule changes severity, consuming kits MUST be
notified in the release notes by repository name plus a pointer to the
constitutional clause that motivated the rule. Consuming kits then either
update their constitutions in the same release window or pin to the prior
MAJOR. The release notes for any rule-affecting bump call out which kits the
maintainer notified and how.

## Governance

This constitution supersedes other practices in the kit-validator repository.
Amendments require updating this document and any consumer-facing
documentation in the same pull request when the change affects the output
contract, the rule registry, or the CLI surface.

Versioning of this constitution follows semantic versioning for governance:

- MAJOR for backward-incompatible principle removals or redefinitions.
- MINOR for new principles or materially expanded guidance.
- PATCH for clarifications, wording, and non-semantic refinements.

The constitution version is independent of the library version. Library
version 0.1.0 is the first release governed by constitution v1.0.0.

**Version**: 1.0.0 | **Ratified**: 2026-04-29 | **Last Amended**: 2026-04-29
