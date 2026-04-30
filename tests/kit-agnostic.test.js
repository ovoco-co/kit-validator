'use strict';

const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['lib', 'bin', 'tests'];
const FORBIDDEN = [
  'cmdb-kit',
  'hr-kit',
  'OvocoCRM',
  'Keystone',
  'Hireology',
  'ServiceNow',
  'JSM',
  'Atlassian',
];
// This file legitimately mentions every forbidden string by virtue of being the kit-agnostic check.
const SELF = path.resolve(__filename);
// Constitutional sources in the rule registry cite cmdb-kit and hr-kit by name; the citation is
// the legitimate, intended use of those names per Constitution V.
const REGISTRY = path.resolve(ROOT, 'lib', 'rules', 'registry.json');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

test('library code contains no kit-specific strings (Constitution I, FR-011, SC-003)', () => {
  const offending = [];
  for (const sub of SCAN_DIRS) {
    const subRoot = path.join(ROOT, sub);
    if (!fs.existsSync(subRoot)) continue;
    for (const file of walk(subRoot)) {
      if (file === SELF) continue;
      if (file === REGISTRY) continue;
      const content = fs.readFileSync(file, 'utf8');
      for (const term of FORBIDDEN) {
        if (content.includes(term)) {
          offending.push({ file: path.relative(ROOT, file), term });
        }
      }
    }
  }
  assert.deepStrictEqual(
    offending,
    [],
    `kit-specific terms found in scanned files:\n${offending
      .map((o) => `  ${o.file}: ${o.term}`)
      .join('\n')}`
  );
});
