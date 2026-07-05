'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule } = require('../helpers');

test('nested JSON wrapper { "TypeName": [...] } is unwrapped correctly', () => {
  const result = runRule('data-nested-wrapper-negative');
  const dataErrors = result.errors.filter((e) => e.ruleId.startsWith('data.'));
  assert.strictEqual(dataErrors.length, 0, `expected no data errors; got: ${JSON.stringify(dataErrors)}`);
});
