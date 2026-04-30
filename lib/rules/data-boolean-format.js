'use strict';

module.exports = function dataBooleanFormat(ctx) {
  const records = [];

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!recs) continue;
    const attrs = ctx.schema.attributes[typeName] || {};
    const filepath = ctx.data.files[typeName];

    const booleanAttrs = new Set();
    for (const [attrName, attrDef] of Object.entries(attrs)) {
      if (attrDef && attrDef.type === 0 && attrDef.defaultTypeId === 2) {
        booleanAttrs.add(attrName);
      }
    }

    for (const rec of recs) {
      for (const attrName of booleanAttrs) {
        const value = rec[attrName];
        if (value === undefined || value === null) continue;
        if (typeof value !== 'boolean') {
          records.push({
            message: `Boolean field '${attrName}' has non-boolean value (${JSON.stringify(value)}). Use the boolean true or false, not a string or number.`,
            file: relPath(ctx, filepath),
            recordName: rec.Name || rec.name || null,
            field: attrName,
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
