'use strict';

const METADATA_KEYS = new Set(['Name', 'name', 'description']);

module.exports = function dataUnknownField(ctx) {
  const records = [];

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!recs) continue;
    const attrs = ctx.schema.attributes[typeName] || {};
    const knownAttrs = new Set(Object.keys(attrs));
    const filepath = ctx.data.files[typeName];

    for (const rec of recs) {
      for (const key of Object.keys(rec)) {
        if (METADATA_KEYS.has(key)) continue;
        if (knownAttrs.has(key)) continue;
        records.push({
          message: `Field '${key}' is not declared in schema-attributes.json for type '${typeName}'.`,
          file: relPath(ctx, filepath),
          recordName: rec.Name || rec.name || null,
          field: key,
        });
      }
    }
  }
  return records;
};

function relPath(ctx, abs) {
  const sd = ctx.schema.schemaDir;
  if (abs && abs.startsWith(sd)) return abs.slice(sd.length).replace(/^\//, '');
  return abs;
}
