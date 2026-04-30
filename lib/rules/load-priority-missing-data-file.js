'use strict';

const path = require('path');

module.exports = function loadPriorityMissingDataFile(ctx) {
  const records = [];
  const loadPriority = Array.isArray(ctx.config.loadPriority) ? ctx.config.loadPriority : [];
  const declaredTypeNames = new Set(ctx.schema.types.map((t) => t.name));

  for (const typeName of loadPriority) {
    if (!declaredTypeNames.has(typeName)) continue;
    const filepath = ctx.data.files[typeName];
    if (!filepath) continue;
    if (ctx.data.records[typeName] === null) {
      records.push({
        message: `Type '${typeName}' is in loadPriority but has no data file at ${path.basename(filepath)}.`,
        file: relPath(ctx, filepath),
        recordName: typeName,
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
