'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.date-format fires on the positive fixture', () => {
  const result = runRule('data-date-format-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.date-format'), `expected 'data.date-format' to fire; got: ${[...ids].join(', ')}`);
});

test('data.date-format does not fire on the negative fixture', () => {
  const result = runRule('data-date-format-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.date-format'), `expected 'data.date-format' not to fire; got: ${[...ids].join(', ')}`);
});
