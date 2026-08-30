'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

const IDENTITY = { identity: { 'Component Instance': ['component', 'buildNumber'] } };

test('data.identity.duplicate fires on two records sharing a Name', () => {
  const result = runRule('data-identity-duplicate-positive');
  const ids = emittedIds(result);
  assert.ok(ids.has('data.identity.duplicate'),
    `expected the rule to fire; got: ${[...ids].join(', ')}`);
});

test('data.identity.duplicate does not fire when every identity is distinct', () => {
  const result = runRule('data-identity-duplicate-negative', IDENTITY);
  const ids = emittedIds(result);
  assert.ok(!ids.has('data.identity.duplicate'),
    `expected no finding; got: ${[...ids].join(', ')}`);
});

test('the identity is the one the caller declares, not always Name', () => {
  // A and B carry different Names and the same component and buildNumber. A
  // check assuming Name passes them, which is why the identity is supplied.
  const withIdentity = runRule('data-identity-duplicate-positive', IDENTITY).errors
    .filter((r) => r.ruleId === 'data.identity.duplicate');
  const assumingName = runRule('data-identity-duplicate-positive').errors
    .filter((r) => r.ruleId === 'data.identity.duplicate');

  assert.equal(assumingName.length, 1, 'assuming Name finds only the Product pair');
  assert.equal(withIdentity.length, 2, 'the declared identity finds the Component Instance pair too');
  assert.ok(withIdentity.some((r) => /identified by component plus buildNumber/.test(r.message)),
    `expected the identity to be named; got: ${withIdentity.map((r) => r.message).join(' | ')}`);
});

test('the finding says what a load would do about it', () => {
  const [first] = runRule('data-identity-duplicate-positive').errors
    .filter((r) => r.ruleId === 'data.identity.duplicate');
  assert.match(first.message, /keeps one of them and reports success/);
});
