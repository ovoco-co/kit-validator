'use strict';

const fs = require('fs');
const path = require('path');

const NESTED_WRAPPER_KEYS = ['objects', 'values'];

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

    records[t.name] = unwrap(parsed, t.name);
  }

  return { records, files, parseErrors, dataDir };
}

function toKebabCase(typeName) {
  return typeName.toLowerCase().replace(/\s+/g, '-');
}

function unwrap(parsed, typeName) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed[typeName])) return parsed[typeName];
    for (const k of NESTED_WRAPPER_KEYS) {
      if (Array.isArray(parsed[k])) return parsed[k];
    }
    const keys = Object.keys(parsed);
    if (keys.length === 1 && Array.isArray(parsed[keys[0]])) return parsed[keys[0]];
  }
  return [];
}

module.exports = { loadData, toKebabCase };
