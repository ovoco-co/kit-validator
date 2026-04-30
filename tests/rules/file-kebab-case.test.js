'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('file.kebab-case fires on the positive fixture', () => {
  const result = runRule('file-kebab-case-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('file.kebab-case'), `expected 'file.kebab-case' to fire; got: ${[...ids].join(', ')}`);
});

test('file.kebab-case does not fire on the negative fixture', () => {
  const result = runRule('file-kebab-case-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('file.kebab-case'), `expected 'file.kebab-case' not to fire; got: ${[...ids].join(', ')}`);
});
