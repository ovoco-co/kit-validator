'use strict';

const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');
const { runRule } = require('./helpers');

test('two successive validate(config) calls produce deeply equal results (Constitution VIII, SC-007)', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const fixtureNames = fs
    .readdirSync(fixturesDir)
    .filter((name) => fs.statSync(path.join(fixturesDir, name)).isDirectory());

  for (const fxName of fixtureNames) {
    let first;
    let second;
    try {
      first = runRule(fxName, { loadPriority: ['Sample'] });
      second = runRule(fxName, { loadPriority: ['Sample'] });
    } catch (e) {
      first = runRule(fxName, { loadPriority: [] });
      second = runRule(fxName, { loadPriority: [] });
    }
    assert.deepStrictEqual(
      second,
      first,
      `validate(config) is not deterministic for fixture ${fxName}`
    );
  }
});
