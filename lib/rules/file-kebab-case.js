'use strict';

const fs = require('fs');
const path = require('path');

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.json$/;

module.exports = function fileKebabCase(ctx) {
  const records = [];
  const dataDir = ctx.data.dataDir;
  if (!dataDir || !fs.existsSync(dataDir)) return records;

  const entries = fs.readdirSync(dataDir);
  for (const name of entries) {
    if (!name.endsWith('.json')) continue;
    if (!KEBAB.test(name)) {
      records.push({
        message: `Data file name '${name}' is not kebab-case.`,
        file: relPath(ctx, path.join(dataDir, name)),
        recordName: null,
        field: null,
      });
    }
  }
  return records;
};

function relPath(ctx, abs) {
  const sd = ctx.schema.schemaDir;
  if (abs && abs.startsWith(sd)) return abs.slice(sd.length).replace(/^\//, '');
  return abs;
}
