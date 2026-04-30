'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.null-value fires on the positive fixture', () => {
  const result = runRule('data-null-value-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.null-value'), `expected 'data.null-value' to fire; got: ${[...ids].join(', ')}`);
});

test('data.null-value does not fire on the negative fixture', () => {
  const result = runRule('data-null-value-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.null-value'), `expected 'data.null-value' not to fire; got: ${[...ids].join(', ')}`);
});
