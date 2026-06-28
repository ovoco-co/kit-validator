'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { fixturePath } = require('./helpers');
const { validate } = require('../lib');
const { loadSchema } = require('../lib/load-schema');
const { loadData } = require('../lib/load-data');

const BASE = fixturePath('layered/base');
const DOMAIN = fixturePath('layered/domain');
const DOMAIN_BADREF = fixturePath('layered/domain-badref');
const REPO_ROOT = path.join(__dirname, '..');

// US1 - the loader reads the union, and a domain record's reference to a base record resolves.
test('multi-dir: domain records load as a union and cross-directory references resolve', () => {
  const data = loadData(loadSchema(BASE, [DOMAIN]));

  assert.deepEqual(data.records.Product.map((r) => r.Name), ['CRM Core'], 'base records load');
  assert.deepEqual(data.records.License.map((r) => r.Name), ['CRM Core License'], 'domain records load');
  assert.ok(data.files.License.endsWith(path.join('domain', 'data', 'license.json')), 'License file resolves to the domain directory');
  assert.equal(data.dataDirs.length, 2, 'both data directories are searched');

  const result = validate({ schemaDir: BASE, domainDirs: [DOMAIN], loadPriority: [] });
  assert.equal(result.errors.length, 0, `cross-tier reference should resolve; got: ${result.errors.map((e) => e.message).join(' | ')}`);
});

// US1 - single-directory loading is unchanged.
test('multi-dir: single-directory loading is unchanged', () => {
  const data = loadData(loadSchema(BASE));

  assert.equal(data.dataDirs.length, 1, 'only the primary data directory is searched');
  assert.ok(data.dataDirs[0].endsWith(path.join('base', 'data')), 'the single data directory is the primary');
  assert.equal(data.dataDir, data.dataDirs[0], 'dataDir still points at the primary');

  const result = validate({ schemaDir: BASE, loadPriority: [] });
  assert.equal(result.errors.length, 0, 'the base validates clean on its own');
});

// US1 - the filename-casing rule covers domain directories.
test('multi-dir: a non-kebab data filename in a domain directory is flagged', () => {
  const badFile = path.join(DOMAIN, 'data', 'Bad_Name.json');
  fs.writeFileSync(badFile, '[]');
  try {
    const result = validate({ schemaDir: BASE, domainDirs: [DOMAIN], loadPriority: [] });
    const kebab = [...result.errors, ...result.warnings].filter((r) => r.ruleId === 'file.kebab-case');
    assert.equal(kebab.length, 1, 'exactly one kebab-case finding for the domain file');
    assert.ok(kebab[0].file.includes('Bad_Name.json'), 'the finding names the offending domain file');
  } finally {
    fs.unlinkSync(badFile);
  }
});

// US1 - duplicate data file resolves first-match-wins (primary).
test('multi-dir: a duplicate data file resolves to the primary directory', () => {
  const dupFile = path.join(DOMAIN, 'data', 'product.json');
  fs.writeFileSync(dupFile, JSON.stringify([{ Name: 'Shadowed Product', description: 'should be ignored' }]));
  try {
    const data = loadData(loadSchema(BASE, [DOMAIN]));
    assert.deepEqual(data.records.Product.map((r) => r.Name), ['CRM Core'], 'the primary copy wins');
    assert.ok(data.files.Product.endsWith(path.join('base', 'data', 'product.json')), 'Product resolves to the primary directory');

    const result = validate({ schemaDir: BASE, domainDirs: [DOMAIN], loadPriority: [] });
    assert.equal(result.errors.length, 0, 'the shadowed duplicate produces no extra finding');
  } finally {
    fs.unlinkSync(dupFile);
  }
});

// US2 - findings name the directory that owns the file.
test('multi-dir: a fault in domain data is reported against the domain file', () => {
  const result = validate({ schemaDir: BASE, domainDirs: [DOMAIN_BADREF], loadPriority: [] });
  const refs = result.errors.filter((e) => e.ruleId === 'data.reference.unresolved');
  assert.equal(refs.length, 1, 'the domain record is loaded and validated, so its bad reference is caught');
  assert.ok(refs[0].file.includes(path.join('domain-badref', 'data', 'license.json')), 'the finding names the domain file');
});

// US3 - the CLI and the programmatic call agree on a layered input.
test('multi-dir: CLI and programmatic validation agree on a layered input', () => {
  const prog = validate({ schemaDir: BASE, domainDirs: [DOMAIN_BADREF] });
  const cli = spawnSync(
    'node',
    ['bin/kit-validate.js', '--schema', BASE, '--domain', DOMAIN_BADREF, '--format', 'json'],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  const cliOut = JSON.parse(cli.stdout);
  assert.equal(cliOut.errors.length, prog.errors.length, 'same error count');
  assert.equal(cliOut.warnings.length, prog.warnings.length, 'same warning count');
  assert.equal(cliOut.exitCode, prog.exitCode, 'same exit code');
});
