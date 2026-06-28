# CLAUDE.md

## Project Overview

kit-validator is a schema validator library for the ovoco schema-kit pattern. It is consumed by cmdb-kit, hr-kit, and any future kit that follows the same three-layer architecture. The library exports a single `validate(config)` function and ships a `bin/kit-validate.js` CLI that mirrors the function API.

## Architecture

The library has no kit-specific logic. Every rule is parameterized through `validate(config)`. Each consuming kit supplies its own `LOAD_PRIORITY`, nested-type list, attribute-name map, and schema/data files. The rule set, output shape, and error/warning record formats are owned by this repository and apply uniformly across all consumers.

```
kit-validator/
  lib/                Library entry point and rule implementations
    index.js          Exports validate(config)
    rules/            One file per rule
  bin/
    kit-validate.js   CLI wrapper around validate(config)
  tests/
    fixtures/         Synthetic schema/data fixtures (no cmdb-kit or hr-kit deps)
  docs/
```

## Constitutional Discipline

This library has its own constitution (see `.specify/memory/constitution.md`) covering API surface, release discipline, and the contract owed to consumers. The principles differ in kind from a kit's principles. Read the constitution before adding rules, changing the output shape, or shipping a new version.

Key rules:

- Every rule has a stable identifier (e.g. `attribute.casing`, `data.reference.unresolved`).
- Every rule traces back to a constitutional clause in at least one consuming kit.
- The output shape is a stable contract. Breaking the shape is a MAJOR bump.
- Tests use synthetic fixtures only. Never depend on cmdb-kit or hr-kit as test inputs.

## Commands

```bash
# Run tests
npm test

# Run the validator on a fixture
node bin/kit-validate.js --schema tests/fixtures/valid-schema
```

## Documentation Formatting Rules

- No em dashes (use hyphen or comma instead)
- No ampersands as "and" (proper acronyms are fine)
- No horizontal rules
- No numbered sections, just use header levels
- No tables of contents
- No bold in table cells

## Git Workflow

- Main branch: main
- Tag releases as `v0.1.0`, `v0.2.0`, etc., per the constitution's semver discipline
- Each rule lands as its own commit when practical

## Active Technologies
- Node.js 18+. Uses only the standard library plus the built-in `node --test` test runner. No transpilation; CommonJS modules. + None at runtime. The library has zero `dependencies` in `package.json` per Constitution VI and FR-012. Dev-time may include a JSON Schema validator for testing the output-schema (chosen during implementation; `ajv` is the obvious candidate since it is the de-facto Node JSON Schema implementation). (001-validator-core)
- Filesystem only. The library reads schema/data files from the path supplied by `config.schemaDir`. No databases, no caches, no temporary files. (001-validator-core)
- Node.js >=18, CommonJS. Unchanged. + None. Node standard library only (`fs`, `path`). Unchanged. (002-multi-dir-data-loading)
- JSON files on disk read by the loader. No database. (002-multi-dir-data-loading)

## Recent Changes
- 001-validator-core: Added Node.js 18+. Uses only the standard library plus the built-in `node --test` test runner. No transpilation; CommonJS modules. + None at runtime. The library has zero `dependencies` in `package.json` per Constitution VI and FR-012. Dev-time may include a JSON Schema validator for testing the output-schema (chosen during implementation; `ajv` is the obvious candidate since it is the de-facto Node JSON Schema implementation).
