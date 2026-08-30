'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('data.reference.case-mismatch fires when a reference resolves only by folding case', () => {
  const result = runRule('data-reference-case-mismatch-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.reference.case-mismatch'),
    `expected the rule to fire; got: ${[...ids].join(', ')}`);
});

test('data.reference.case-mismatch does not fire when the case already matches', () => {
  const result = runRule('data-reference-case-mismatch-negative');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.reference.case-mismatch'),
    `expected no finding; got: ${[...ids].join(', ')}`);
});

test('a reference that only matches by folding case is not also called unresolved', () => {
  const result = runRule('data-reference-case-mismatch-positive');
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.reference.unresolved'),
    'the target resolves it, so failing the run would be a false failure');
});

test('the case mismatch is a warning rather than an error', () => {
  const result = runRule('data-reference-case-mismatch-positive');
  assert.ok(result.warnings.some((r) => r.ruleId === 'data.reference.case-mismatch'));
  assert.equal(result.exitCode, 0,
    'the load this file was written for succeeds. It fails only against a case '
    + 'sensitive target, and the caller knows which it has.');
});
