'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('structure.duplicate-type fires on the positive fixture', () => {
  const result = runRule('structure-duplicate-type-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('structure.duplicate-type'), `expected 'structure.duplicate-type' to fire; got: ${[...ids].join(', ')}`);
});

test('structure.duplicate-type does not fire on the negative fixture', () => {
  const result = runRule('structure-duplicate-type-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('structure.duplicate-type'), `expected 'structure.duplicate-type' not to fire; got: ${[...ids].join(', ')}`);
});
