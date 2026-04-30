'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('attributes.reference-type-unresolved fires on the positive fixture', () => {
  const result = runRule('attributes-reference-type-unresolved-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('attributes.reference-type-unresolved'), `expected 'attributes.reference-type-unresolved' to fire; got: ${[...ids].join(', ')}`);
});

test('attributes.reference-type-unresolved does not fire on the negative fixture', () => {
  const result = runRule('attributes-reference-type-unresolved-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('attributes.reference-type-unresolved'), `expected 'attributes.reference-type-unresolved' not to fire; got: ${[...ids].join(', ')}`);
});
