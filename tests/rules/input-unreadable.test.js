'use strict';

const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');
const { validate } = require('../../lib');
const { runRule, emittedIds, fixturePath } = require('../helpers');

test('input.unreadable fires on the positive fixture (malformed data file)', () => {
  const result = runRule('input-unreadable-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('input.unreadable'), `expected 'input.unreadable' to fire; got: ${[...ids].join(', ')}`);
});

test('input.unreadable does not fire on the negative fixture', () => {
  const result = runRule('input-unreadable-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('input.unreadable'), `expected 'input.unreadable' not to fire; got: ${[...ids].join(', ')}`);
});

test('a missing schema directory yields an error record, not a thrown exception', () => {
  let result;
  assert.doesNotThrow(() => {
    result = validate({ schemaDir: fixturePath('__no_such_fixture_dir__') });
  });
  assert.strictEqual(result.exitCode, 1);
  assert.ok(emittedIds(result).has('input.unreadable'));
});
