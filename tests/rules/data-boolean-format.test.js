'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.boolean-format fires on the positive fixture', () => {
  const result = runRule('data-boolean-format-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.boolean-format'), `expected 'data.boolean-format' to fire; got: ${[...ids].join(', ')}`);
});

test('data.boolean-format does not fire on the negative fixture', () => {
  const result = runRule('data-boolean-format-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.boolean-format'), `expected 'data.boolean-format' not to fire; got: ${[...ids].join(', ')}`);
});
