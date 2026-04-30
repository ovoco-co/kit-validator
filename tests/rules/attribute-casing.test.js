'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('attribute.casing fires on the positive fixture', () => {
  const result = runRule('attribute-casing-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('attribute.casing'), `expected 'attribute.casing' to fire; got: ${[...ids].join(', ')}`);
});

test('attribute.casing does not fire on the negative fixture', () => {
  const result = runRule('attribute-casing-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('attribute.casing'), `expected 'attribute.casing' not to fire; got: ${[...ids].join(', ')}`);
});
