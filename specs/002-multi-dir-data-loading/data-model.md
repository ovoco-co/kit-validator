# Data Model: Multi-Directory Data Loading

**Feature**: 002-multi-dir-data-loading
**Date**: 2026-06-27

This feature has no schema entities of its own. The "model" here is the in-memory data object the loader produces and the rules consume.

## The loaded data object

`loadData(loadedSchema)` returns an object. The change adds `dataDirs` and widens how `records` and `files` are populated.

| Field | Before | After |
|---|---|---|
| `records` | `{ typeName: records[] or null }`, read from the primary `data/` only | Same shape, but populated as the union: each type's records come from the first directory in search order that has the file |
| `files` | `{ typeName: filepath }`, always under the primary `data/` | Same shape, but the path is the directory the file was actually found in |
| `dataDir` | the primary `schemaDir/data` | unchanged, still the primary `schemaDir/data` |
| `dataDirs` | absent | NEW: the ordered list `[schemaDir/data, ...domainDirs/data]` |
| `parseErrors` | `[{ typeName, file, message }]` for the primary | same, with `file` being the resolved path in whichever directory held the malformed file |

## Loading algorithm

```
dataDirs = [join(schemaDir, 'data'), ...domainDirs.map(d => join(d, 'data'))]
for each type t in loadedSchema.types:
    filename = toKebabCase(t.name) + '.json'
    resolved = first dir in dataDirs where join(dir, filename) exists
    if no resolved:
        records[t] = null            # unchanged missing-data behavior
        files[t]   = join(dataDirs[0], filename)   # primary path, as today
        continue
    files[t] = join(resolved, filename)
    parse the file; on success records[t] = array; on failure records[t] = null and push a parseError naming the resolved file
```

Search order is the primary directory first, then each domain directory in the order given (FR-006, FR-007). First match wins; later duplicates are ignored.

## Rule consumption

| Rule | Reads | Effect of the change |
|---|---|---|
| `data.reference.unresolved` | `records`, `files` | A domain record's reference to a base record now resolves, because both are in `records`. |
| `data.unknown-field`, `data.null-value`, `data.boolean-format`, `data.date-format` | `records`, `files` | Validate the union; each finding names the resolved file. No change. |
| `load-priority.missing-data-file` | `records`, `files` | A type whose data lives in a domain directory is no longer seen as missing. No change. |
| `file-kebab-case` | `dataDir` today, `dataDirs` after | CHANGE: iterate every data directory so a non-kebab filename in a domain directory is flagged, naming that file. |
| All other rules | `schema`, `attributes` | Untouched; structure and attribute merging is unchanged. |

## Invariants

- When `domainDirs` is empty, `dataDirs` is `[schemaDir/data]`, and `records`, `files`, `dataDir`, and `parseErrors` are identical to v0.2.1.
- `records` is the union across `dataDirs`, with first-match-wins per type.
- Every entry in `files` points at the directory the records were actually loaded from.
- Output order is deterministic and unchanged: the sort in `index.js` orders findings by ruleId, file, recordName, field, message.
