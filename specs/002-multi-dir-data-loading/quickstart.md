# Quickstart: Verifying Multi-Directory Data Loading

**Feature**: 002-multi-dir-data-loading
**Date**: 2026-06-27

Run from the kit-validator repository root after implementation. Each maps to a contract in `contracts/data-loading.md`.

## 1. Existing suite passes unchanged (C2)

```bash
npm test
```

Expect the same count as before plus the new tests, with zero failures. The unchanged single-directory tests are the backward-compatibility proof.

## 2. Domain data loads and cross-directory references resolve (C3, C4)

Using the new `tests/fixtures/layered` fixture (a base plus a domain whose data references a base record):

```bash
node bin/kit-validate.js --schema tests/fixtures/layered/base --domain tests/fixtures/layered/domain
```

Expect 0 errors. Without this feature the domain record's reference to the base record would be reported unresolved, or the domain records would not be validated at all.

## 3. Findings name the owning directory (C5)

Temporarily break a value in the domain fixture's data, re-run the command above, and confirm the reported file path is the domain file, not a base file. Revert.

## 4. Filename casing checked across directories (C6)

```bash
cp tests/fixtures/layered/domain/data/<a-file>.json tests/fixtures/layered/domain/data/Bad_Name.json
node bin/kit-validate.js --schema tests/fixtures/layered/base --domain tests/fixtures/layered/domain 2>&1 | grep -i 'kebab'
rm tests/fixtures/layered/domain/data/Bad_Name.json
```

Expect one `file.kebab-case` finding naming `Bad_Name.json` in the domain directory.

## 5. CLI and programmatic parity (C8)

```bash
node -e '
const { validate } = require("./lib");
const r = validate({ schemaDir: "tests/fixtures/layered/base", domainDirs: ["tests/fixtures/layered/domain"] });
console.log("errors:", r.errors.length, "warnings:", r.warnings.length);
'
```

Expect the same error and warning counts the CLI reported in step 2.

## 6. Version (C9)

```bash
node -e 'console.log(require("./package.json").version)'
```

Expect `0.3.0`.
