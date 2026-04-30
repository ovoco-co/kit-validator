'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('load-priority.missing-type fires on the positive fixture (empty loadPriority)', () => {
  const result = runRule('load-priority-missing-type-positive', { loadPriority: [] });
  const ids = emittedIds(result);
  // empty loadPriority means the rule does not fire (rule only fires when loadPriority is non-empty
  // and is missing some type). With empty loadPriority, the rule has no expectation to compare against
  // and should not flag anything.
  assert.ok(
    !ids.has('load-priority.missing-type'),
    `with empty loadPriority, the rule should not fire; got: ${[...ids].join(', ')}`
  );
});

test('load-priority.missing-type fires when a declared type is missing from a non-empty loadPriority', () => {
  // Add an "Other" type to loadPriority but leave "Sample" out, so "Sample" should be flagged.
  const result = runRule('load-priority-missing-type-positive', { loadPriority: ['Other'] });
  const ids = emittedIds(result);
  assert.ok(
    ids.has('load-priority.missing-type'),
    `expected 'load-priority.missing-type' to fire when 'Sample' is missing from non-empty loadPriority; got: ${[...ids].join(', ')}`
  );
});

test('load-priority.missing-type does not fire on the negative fixture (Sample in loadPriority)', () => {
  const result = runRule('load-priority-missing-type-negative', { loadPriority: ['Sample'] });
  const ids = emittedIds(result);
  assert.ok(
    !ids.has('load-priority.missing-type'),
    `expected 'load-priority.missing-type' not to fire; got: ${[...ids].join(', ')}`
  );
});
