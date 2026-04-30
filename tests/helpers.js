'use strict';

const path = require('path');
const { validate } = require('../lib');

function fixturePath(name) {
  return path.join(__dirname, 'fixtures', name);
}

function runRule(fixtureName, configOverrides) {
  const config = Object.assign(
    { schemaDir: fixturePath(fixtureName), loadPriority: [], nestedTypes: [], attrNameMap: {} },
    configOverrides || {}
  );
  return validate(config);
}

function emittedIds(result) {
  const ids = new Set();
  for (const r of result.errors) ids.add(r.ruleId);
  for (const r of result.warnings) ids.add(r.ruleId);
  return ids;
}

module.exports = { fixturePath, runRule, emittedIds };
