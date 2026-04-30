'use strict';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = function dataDateFormat(ctx) {
  const records = [];

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!recs) continue;
    const attrs = ctx.schema.attributes[typeName] || {};
    const filepath = ctx.data.files[typeName];

    const dateAttrs = new Set();
    for (const [attrName, attrDef] of Object.entries(attrs)) {
      if (attrDef && attrDef.type === 0 && attrDef.defaultTypeId === 4) {
        dateAttrs.add(attrName);
      }
    }

    for (const rec of recs) {
      for (const attrName of dateAttrs) {
        const value = rec[attrName];
        if (value === undefined || value === null || value === '') continue;
        if (typeof value !== 'string' || !ISO_DATE.test(value)) {
          records.push({
            message: `Date field '${attrName}' has non-ISO value '${value}'. Use YYYY-MM-DD format.`,
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
