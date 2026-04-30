'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.unknown-field fires on the positive fixture', () => {
  const result = runRule('data-unknown-field-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.unknown-field'), `expected 'data.unknown-field' to fire; got: ${[...ids].join(', ')}`);
});

test('data.unknown-field does not fire on the negative fixture', () => {
  const result = runRule('data-unknown-field-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.unknown-field'), `expected 'data.unknown-field' not to fire; got: ${[...ids].join(', ')}`);
});
