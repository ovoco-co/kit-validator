'use strict';

const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');
const { runRule } = require('./helpers');

const SCHEMA_PATH = path.resolve(__dirname, '..', 'docs', 'output-schema.json');

test('output-schema.json exists and has the documented shape', () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  assert.strictEqual(schema.type, 'object');
  for (const required of ['ruleId', 'severity', 'message', 'file', 'recordName', 'field']) {
    assert.ok(
      Array.isArray(schema.required) && schema.required.includes(required),
      `output-schema.json must require '${required}'`
    );
    assert.ok(schema.properties[required], `output-schema.json must declare property '${required}'`);
  }
});

test('every emitted record validates against the published shape (SC-005)', () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const fixtureNames = fs
    .readdirSync(fixturesDir)
    .filter((name) => fs.statSync(path.join(fixturesDir, name)).isDirectory());

  for (const fxName of fixtureNames) {
    let result;
    try {
      result = runRule(fxName, { loadPriority: ['Sample'] });
    } catch (e) {
      result = runRule(fxName, { loadPriority: [] });
    }
    for (const r of [...result.errors, ...result.warnings]) {
      validateRecord(r, schema, fxName);
    }
  }
});

function validateRecord(record, schema, fxName) {
  // Required fields present
  for (const f of schema.required) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(record, f),
      `record from ${fxName} is missing required field '${f}': ${JSON.stringify(record)}`
    );
  }
  // No extra fields
  for (const k of Object.keys(record)) {
    assert.ok(
      schema.required.includes(k),
      `record from ${fxName} has unexpected field '${k}': ${JSON.stringify(record)}`
    );
  }
  // ruleId, message: strings
  assert.strictEqual(typeof record.ruleId, 'string', `ruleId must be string in ${fxName}`);
  assert.strictEqual(typeof record.message, 'string', `message must be string in ${fxName}`);
  // severity: enum
  assert.ok(
    ['error', 'warning'].includes(record.severity),
    `severity must be error|warning in ${fxName}, got ${record.severity}`
  );
  // file, recordName, field: string or null
  for (const f of ['file', 'recordName', 'field']) {
    assert.ok(
      record[f] === null || typeof record[f] === 'string',
      `${f} must be string|null in ${fxName}, got ${typeof record[f]}: ${JSON.stringify(record[f])}`
    );
  }
}
