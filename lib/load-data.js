'use strict';

const fs = require('fs');
const path = require('path');

// Data files are flat JSON arrays of records. The filename is the type
// name in singular kebab-case. Records are loaded from the primary schema
// directory and from every merged domain directory: for each type, the
// data file is sought across those directories in order (primary first,
// then each domain as given) and loaded from the first one that has it.
// The validated record set is the union. A type with no data file in any
// directory leaves records null (the load-priority rules report it); a
// malformed file is recorded as a parse error naming the resolved file.
function loadData(loadedSchema) {
  const records = {};
  const files = {};
  const parseErrors = [];
  const dataDir = loadedSchema.dataDir || path.join(loadedSchema.schemaDir, 'data');
  const domainDirs = Array.isArray(loadedSchema.domainDirs) ? loadedSchema.domainDirs : [];
  const dataDirs = [dataDir, ...domainDirs.map((d) => path.join(d, 'data'))];

  for (const t of loadedSchema.types) {
    const filename = toKebabCase(t.name) + '.json';

    // First match wins, primary directory first then each domain in order.
    let filepath = null;
    for (const dir of dataDirs) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate)) {
        filepath = candidate;
        break;
      }
    }

    if (filepath === null) {
      // Absent everywhere: keep the primary path so findings read as before.
      files[t.name] = path.join(dataDir, filename);
      records[t.name] = null;
      continue;
    }

    files[t.name] = filepath;

    const raw = fs.readFileSync(filepath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      records[t.name] = null;
      parseErrors.push({ typeName: t.name, file: filepath, message: e.message });
      continue;
    }

    records[t.name] = unwrapArray(parsed, t.name);
  }

  return { records, files, parseErrors, dataDir, dataDirs };
}

function toKebabCase(typeName) {
  return typeName.toLowerCase().replace(/\s+/g, '-');
}

// Unwrap common JSON wrapper formats:
//   - Plain array: [...]
//   - { "TypeName": [...] }  (keyed by the schema type name)
//   - { objects: [...] }
//   - { values: [...] }
//   - { singleKey: [...] }   (any single-key object wrapping an array)
function unwrapArray(parsed, typeName) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed[typeName])) return parsed[typeName];
    if (Array.isArray(parsed.objects)) return parsed.objects;
    if (Array.isArray(parsed.values)) return parsed.values;
    const keys = Object.keys(parsed);
    if (keys.length === 1 && Array.isArray(parsed[keys[0]])) return parsed[keys[0]];
  }
  return [];
}

module.exports = { loadData, toKebabCase };
