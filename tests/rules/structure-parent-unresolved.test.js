'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('structure.parent-unresolved fires on the positive fixture', () => {
  const result = runRule('structure-parent-unresolved-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('structure.parent-unresolved'), `expected 'structure.parent-unresolved' to fire; got: ${[...ids].join(', ')}`);
});

test('structure.parent-unresolved does not fire on the negative fixture', () => {
  const result = runRule('structure-parent-unresolved-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('structure.parent-unresolved'), `expected 'structure.parent-unresolved' not to fire; got: ${[...ids].join(', ')}`);
});
