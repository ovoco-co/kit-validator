'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.reference.unresolved fires on the positive fixture', () => {
  const result = runRule('data-reference-unresolved-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.reference.unresolved'), `expected 'data.reference.unresolved' to fire; got: ${[...ids].join(', ')}`);
});

test('data.reference.unresolved does not fire on the negative fixture', () => {
  const result = runRule('data-reference-unresolved-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.reference.unresolved'), `expected 'data.reference.unresolved' not to fire; got: ${[...ids].join(', ')}`);
});

test('data.reference.unresolved resolves each element of a multi-valued reference', () => {
  const result = runRule('data-reference-unresolved-positive');
  const fields = [...result.errors, ...result.warnings]
    .filter((r) => r.ruleId === 'data.reference.unresolved')
    .map((r) => r.field);
  assert.ok(fields.includes('tags'), `expected the unresolved element of multi-valued 'tags' to be reported; got fields: ${fields.join(', ')}`);
});

test('data.reference.unresolved splits a semicolon-delimited multi-valued reference', () => {
  const result = runRule('data-reference-unresolved-semicolon');
  const unresolved = [...result.errors, ...result.warnings]
    .filter((r) => r.ruleId === 'data.reference.unresolved');
  // The resolvable elements (LinkedIn, Referral) do not fire; only the bad
  // element (Ghost) is reported, per element, on the 'tags' field.
  assert.strictEqual(unresolved.length, 1, `expected exactly one unresolved element; got: ${unresolved.map((r) => r.message).join(' | ')}`);
  assert.strictEqual(unresolved[0].field, 'tags');
  assert.ok(unresolved[0].message.includes('Ghost'), `expected the 'Ghost' element to be reported; got: ${unresolved[0].message}`);
});
