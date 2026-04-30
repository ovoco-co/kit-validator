'use strict';

const path = require('path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const assert = require('node:assert');

const BIN = path.resolve(__dirname, '..', 'bin', 'kit-validate.js');
const FIXTURES = path.resolve(__dirname, 'fixtures');

function run(args, env) {
  return spawnSync('node', [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...(env || {}) },
  });
}

test('CLI exits 0 with no output on a clean fixture (text mode)', () => {
  const r = run(['--schema', path.join(FIXTURES, 'attribute-casing-negative')], { KIT_VALIDATE_NO_COLOR: '1' });
  assert.strictEqual(r.status, 0, `expected exit 0; stderr=${r.stderr}`);
  assert.strictEqual(r.stdout, '', `expected empty stdout; got: ${r.stdout}`);
  assert.strictEqual(r.stderr, '', `expected empty stderr; got: ${r.stderr}`);
});

test('CLI exits 1 and writes errors to stderr on a failing fixture (text mode)', () => {
  const r = run(['--schema', path.join(FIXTURES, 'attribute-casing-positive')], { KIT_VALIDATE_NO_COLOR: '1' });
  assert.strictEqual(r.status, 1, 'expected exit 1');
  assert.match(r.stderr, /attribute\.casing/, 'stderr should contain the rule identifier');
  assert.strictEqual(r.stdout, '', 'stdout should be empty when the only output is an error');
});

test('CLI --format json writes the result object to stdout', () => {
  const r = run(['--schema', path.join(FIXTURES, 'attribute-casing-positive'), '--format', 'json']);
  assert.strictEqual(r.status, 1, 'expected exit 1');
  // Last non-empty stdout line is the JSON (a usage message would not contain JSON)
  const parsed = JSON.parse(r.stdout.trim());
  assert.ok(Array.isArray(parsed.errors), 'JSON result has errors array');
  assert.ok(Array.isArray(parsed.warnings), 'JSON result has warnings array');
  assert.strictEqual(typeof parsed.exitCode, 'number', 'JSON result has numeric exitCode');
  assert.ok(parsed.errors.some((e) => e.ruleId === 'attribute.casing'), 'json output mentions the rule');
});

test('CLI --help exits 0 and prints usage', () => {
  const r = run(['--help']);
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /kit-validate/);
  assert.match(r.stdout, /--schema/);
});

test('CLI rejects missing --schema with non-zero exit', () => {
  const r = run([]);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /--schema/);
});

test('CLI rejects unknown arguments with non-zero exit', () => {
  const r = run(['--schema', path.join(FIXTURES, 'attribute-casing-negative'), '--mystery-flag']);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /unrecognized argument|--mystery-flag/);
});

test('KIT_VALIDATE_NO_COLOR suppresses ANSI codes in text-mode output', () => {
  const r = run(['--schema', path.join(FIXTURES, 'attribute-casing-positive')], { KIT_VALIDATE_NO_COLOR: '1' });
  // No ANSI escape codes anywhere
  assert.ok(!/\x1b\[/.test(r.stderr), `stderr should be ANSI-free under KIT_VALIDATE_NO_COLOR; got: ${r.stderr}`);
  assert.ok(!/\x1b\[/.test(r.stdout), `stdout should be ANSI-free under KIT_VALIDATE_NO_COLOR; got: ${r.stdout}`);
});
