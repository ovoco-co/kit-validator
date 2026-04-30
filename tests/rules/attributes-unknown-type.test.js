'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('attributes.unknown-type fires on the positive fixture', () => {
  const result = runRule('attributes-unknown-type-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('attributes.unknown-type'), `expected 'attributes.unknown-type' to fire; got: ${[...ids].join(', ')}`);
});

test('attributes.unknown-type does not fire on the negative fixture', () => {
  const result = runRule('attributes-unknown-type-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('attributes.unknown-type'), `expected 'attributes.unknown-type' not to fire; got: ${[...ids].join(', ')}`);
});
