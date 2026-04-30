'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.reference.unresolved fires on the positive fixture', () => {
  const result = runRule('data-reference-unresolved-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.reference.unresolved'), `expected 'data.reference.unresolved' to fire; got: ${[...ids].join(', ')}`);
});

test('data.reference.unresolved does not fire on the negative fixture', () => {
  const result = runRule('data-reference-unresolved-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.reference.unresolved'), `expected 'data.reference.unresolved' not to fire; got: ${[...ids].join(', ')}`);
});
