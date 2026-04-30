'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { runRule, emittedIds } = require('../helpers');

test('load-priority.missing-data-file fires on the positive fixture', () => {
  const result = runRule('load-priority-missing-data-file-positive', { loadPriority: ['Sample'] });
  const ids = emittedIds(result);
  assert.ok(
    ids.has('load-priority.missing-data-file'),
    `expected 'load-priority.missing-data-file' to fire; got: ${[...ids].join(', ')}`
  );
});

test('load-priority.missing-data-file does not fire on the negative fixture', () => {
  const result = runRule('load-priority-missing-data-file-negative', { loadPriority: ['Sample'] });
  const ids = emittedIds(result);
  assert.ok(
    !ids.has('load-priority.missing-data-file'),
    `expected 'load-priority.missing-data-file' not to fire; got: ${[...ids].join(', ')}`
  );
});
