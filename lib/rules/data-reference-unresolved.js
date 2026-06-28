'use strict';

module.exports = function dataReferenceUnresolved(ctx) {
  const records = [];
  const namesByType = {};
  for (const typeName of Object.keys(ctx.data.records)) {
    const recs = ctx.data.records[typeName];
    if (!recs) continue;
    namesByType[typeName] = new Set(recs.map((r) => r.Name || r.name).filter(Boolean));
  }

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!recs) continue;
    const attrs = ctx.schema.attributes[typeName];
    if (!attrs) continue;
    const filepath = ctx.data.files[typeName];

    for (const rec of recs) {
      for (const [attrName, attrDef] of Object.entries(attrs)) {
        if (!attrDef || attrDef.type !== 1) continue;
        const targetType = attrDef.referenceType;
        if (!targetType) continue;
        const value = rec[attrName];
        if (value === undefined || value === null || value === '') continue;
        const targetNames = namesByType[targetType];
        if (!targetNames) continue;
        // A multi-valued reference (max: -1) holds either an array or a
        // semicolon-delimited string; resolve each element. A single-valued
        // reference holds one scalar.
        let values;
        if (Array.isArray(value)) {
          values = value;
        } else if (attrDef.max === -1 && typeof value === 'string') {
          values = value.split(';').map((s) => s.trim()).filter((s) => s !== '');
        } else {
          values = [value];
        }
        for (const v of values) {
          if (v === undefined || v === null || v === '') continue;
          if (!targetNames.has(v)) {
            records.push({
              message: `Reference '${v}' on attribute '${attrName}' does not match any record name in '${targetType}'.`,
              file: relPath(ctx, filepath),
              recordName: rec.Name || rec.name || null,
              field: attrName,
            });
          }
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
