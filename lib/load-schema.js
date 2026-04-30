'use strict';

const fs = require('fs');
const path = require('path');

function loadSchema(schemaDir, domainDirs) {
  if (!schemaDir) {
    throw new TypeError('schemaDir is required');
  }

  const structurePath = path.join(schemaDir, 'schema-structure.json');
  const attributesPath = path.join(schemaDir, 'schema-attributes.json');

  if (!fs.existsSync(structurePath)) {
    throw new Error(`schema-structure.json not found at ${structurePath}`);
  }
  if (!fs.existsSync(attributesPath)) {
    throw new Error(`schema-attributes.json not found at ${attributesPath}`);
  }

  const types = [];
  const attributes = {};

  appendStructure(types, readJsonOrThrow(structurePath));
  Object.assign(attributes, readJsonOrThrow(attributesPath));

  const usedDomainDirs = Array.isArray(domainDirs) ? domainDirs : [];
  for (const dDir of usedDomainDirs) {
    const dStruct = path.join(dDir, 'schema-structure.json');
    const dAttrs = path.join(dDir, 'schema-attributes.json');
    if (fs.existsSync(dStruct)) {
      appendStructure(types, readJsonOrThrow(dStruct));
    }
    if (fs.existsSync(dAttrs)) {
      Object.assign(attributes, readJsonOrThrow(dAttrs));
    }
  }

  return {
    types,
    attributes,
    schemaDir,
    domainDirs: usedDomainDirs,
    structurePath,
    attributesPath,
  };
}

function appendStructure(types, raw) {
  for (const t of raw) {
    types.push({
      name: t.name,
      parent: t.parent || null,
      description: t.description || '',
    });
  }
}

function readJsonOrThrow(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${filepath}: ${e.message}`);
  }
}

module.exports = { loadSchema };
