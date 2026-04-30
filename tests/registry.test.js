'use strict';

const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('./helpers');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'lib', 'rules', 'registry.json');

test('registry has the required fields on every entry', () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  assert.ok(Array.isArray(registry), 'registry must be an array');
  assert.ok(registry.length > 0, 'registry must not be empty');

  for (const entry of registry) {
    assert.strictEqual(typeof entry.id, 'string', `entry missing string id: ${JSON.stringify(entry)}`);
    assert.ok(entry.id.length > 0, `entry has empty id: ${JSON.stringify(entry)}`);
    assert.strictEqual(typeof entry.description, 'string', `entry ${entry.id} missing description`);
    assert.ok(entry.description.length > 0, `entry ${entry.id} has empty description`);
    assert.ok(
      ['error', 'warning'].includes(entry.severity),
      `entry ${entry.id} has invalid severity: ${entry.severity}`
    );
    assert.ok(
      Array.isArray(entry.constitutionalSource) && entry.constitutionalSource.length >= 1,
      `entry ${entry.id} must cite at least one constitutional source`
    );
    for (const cite of entry.constitutionalSource) {
      assert.strictEqual(
        typeof cite,
        'string',
        `entry ${entry.id} has non-string citation: ${JSON.stringify(cite)}`
      );
    }
  }
});

test('emitted ruleIds match registry ids exactly (SC-004)', () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const registryIds = new Set(registry.map((e) => e.id));

  // Each registry entry has a corresponding -positive fixture named after the
  // dotted id with dots converted to dashes. Run that fixture with config that
  // ensures the rule fires.
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const emittedAcrossAllPositives = new Set();

  const fixtureConfigByRule = {
    // Most rules fire with default config plus loadPriority including 'Sample'
    // so the load-priority rules behave as expected. The load-priority.missing-type
    // rule needs a non-empty loadPriority that does not include the schema's type.
    'load-priority.missing-type': { loadPriority: ['Other'] },
    'load-priority.missing-data-file': { loadPriority: ['Sample'] },
  };
  const defaultConfig = { loadPriority: ['Sample'] };

  for (const ruleId of registryIds) {
    const fxDir = ruleId.replace(/\./g, '-') + '-positive';
    const fxPath = path.join(fixturesDir, fxDir);
    assert.ok(
      fs.existsSync(fxPath),
      `Registry rule '${ruleId}' has no positive fixture at tests/fixtures/${fxDir}/ (SC-001)`
    );
    const config = fixtureConfigByRule[ruleId] || defaultConfig;
    const result = runRule(fxDir, config);
    for (const id of emittedIds(result)) emittedAcrossAllPositives.add(id);
  }

  // Forward direction: every emitted ruleId must be in the registry (no orphan emissions).
  const orphanInEmitted = [...emittedAcrossAllPositives].filter((id) => !registryIds.has(id));
  assert.deepStrictEqual(
    orphanInEmitted,
    [],
    `validator emitted ruleIds not present in the registry: ${orphanInEmitted.join(', ')}`
  );

  // Reverse direction: every registry ruleId must have been emitted by its positive fixture.
  const missingInEmitted = [...registryIds].filter((id) => !emittedAcrossAllPositives.has(id));
  assert.deepStrictEqual(
    missingInEmitted,
    [],
    `Registry rules with no fixture firing: ${missingInEmitted.join(', ')}`
  );
});

test('every registry rule has both a positive and a negative fixture (SC-001)', () => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const missing = [];
  for (const entry of registry) {
    const dashId = entry.id.replace(/\./g, '-');
    for (const variant of ['positive', 'negative']) {
      const fxPath = path.join(fixturesDir, `${dashId}-${variant}`);
      if (!fs.existsSync(fxPath)) {
        missing.push(`${dashId}-${variant}`);
      }
    }
  }
  assert.deepStrictEqual(missing, [], `missing fixtures: ${missing.join(', ')}`);
});
