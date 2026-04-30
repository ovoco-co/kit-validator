'use strict';

module.exports = function dataNullValue(ctx) {
  const records = [];

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!recs) continue;
    const filepath = ctx.data.files[typeName];

    for (const rec of recs) {
      for (const [key, value] of Object.entries(rec)) {
        if (value === null) {
          records.push({
            message: `Field '${key}' is set to null. Omit the field instead of setting it to null.`,
            file: relPath(ctx, filepath),
            recordName: rec.Name || rec.name || null,
            field: key,
          });
        }
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
