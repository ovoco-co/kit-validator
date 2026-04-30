'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('type.title-case fires on the positive fixture', () => {
  const result = runRule('type-title-case-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('type.title-case'), `expected 'type.title-case' to fire; got: ${[...ids].join(', ')}`);
});

test('type.title-case does not fire on the negative fixture', () => {
  const result = runRule('type-title-case-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('type.title-case'), `expected 'type.title-case' not to fire; got: ${[...ids].join(', ')}`);
});
