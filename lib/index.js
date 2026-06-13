'use strict';

const path = require('path');
const { loadSchema } = require('./load-schema');
const { loadData } = require('./load-data');
const { formatText, formatJson } = require('./format-output');
const registry = require('./rules/registry.json');

function validate(config) {
  if (!config) {
    throw new TypeError('validate(config): config is required');
  }
  if (!config.schemaDir) {
    throw new TypeError('validate(config): config.schemaDir is required');
  }

  let schema;
  let data;
  try {
    schema = loadSchema(config.schemaDir, config.domainDirs);
    data = loadData(schema);
  } catch (err) {
    return {
      errors: [{
        ruleId: 'input.unreadable',
        severity: 'error',
        message: err.message,
        file: null,
        recordName: null,
        field: null,
      }],
      warnings: [],
      exitCode: 1,
    };
  }

  const ctx = {
    schema,
    data,
    config,
  };

  const all = [];

  for (const entry of registry) {
    if (entry.id === 'input.unreadable') continue;
    const moduleFile = entry.id.replace(/\./g, '-') + '.js';
    const modulePath = path.join(__dirname, 'rules', moduleFile);
    const ruleFn = require(modulePath);
    const fn = typeof ruleFn === 'function' ? ruleFn : ruleFn.run;
    if (typeof fn !== 'function') {
      throw new Error(`Rule module ${entry.id} does not export a callable`);
    }
    const out = fn(ctx) || [];
    for (const r of out) {
      all.push(normalizeRecord(r, entry));
    }
  }

  if (data.parseErrors && data.parseErrors.length > 0) {
    for (const e of data.parseErrors) {
      all.push({
        ruleId: 'input.unreadable',
        severity: 'error',
        message: `Failed to parse JSON: ${e.message}`,
        file: e.file,
        recordName: null,
        field: null,
      });
    }
  }

  all.sort(compareRecords);

  const errors = all.filter((r) => r.severity === 'error');
  const warnings = all.filter((r) => r.severity === 'warning');
  return {
    errors,
    warnings,
    exitCode: errors.length === 0 ? 0 : 1,
  };
}

function normalizeRecord(r, entry) {
  return {
    ruleId: r.ruleId || entry.id,
    severity: r.severity || entry.severity,
    message: r.message || '',
    file: r.file === undefined ? null : r.file,
    recordName: r.recordName === undefined ? null : r.recordName,
    field: r.field === undefined ? null : r.field,
  };
}

function compareRecords(a, b) {
  return (
    cmp(a.ruleId, b.ruleId) ||
    cmp(a.file, b.file) ||
    cmp(a.recordName, b.recordName) ||
    cmp(a.field, b.field) ||
    cmp(a.message, b.message)
  );
}

function cmp(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (a < b) return -1;
  return 1;
}

module.exports = { validate, formatText, formatJson };
