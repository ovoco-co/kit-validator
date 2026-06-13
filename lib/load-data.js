'use strict';

const fs = require('fs');
const path = require('path');

// Data files are flat JSON arrays of records. The filename is the type
// name in singular kebab-case. A missing file leaves records null (the
// load-priority rules report it); a malformed file is recorded as a
// parse error.
function loadData(loadedSchema) {
  const records = {};
  const files = {};
  const parseErrors = [];
  const dataDir = path.join(loadedSchema.schemaDir, 'data');

  for (const t of loadedSchema.types) {
    const filename = toKebabCase(t.name) + '.json';
    const filepath = path.join(dataDir, filename);
    files[t.name] = filepath;

    if (!fs.existsSync(filepath)) {
      records[t.name] = null;
      continue;
    }

    const raw = fs.readFileSync(filepath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      records[t.name] = null;
      parseErrors.push({ typeName: t.name, file: filepath, message: e.message });
      continue;
    }

    records[t.name] = Array.isArray(parsed) ? parsed : [];
  }

  return { records, files, parseErrors, dataDir };
}

function toKebabCase(typeName) {
  return typeName.toLowerCase().replace(/\s+/g, '-');
}

module.exports = { loadData, toKebabCase };
