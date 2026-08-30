'use strict';

// A reference that resolves only when case is ignored. data.reference.unresolved
// folds case, because every target this kit writes to compares names that way and
// refusing a reference the target resolves would be a false failure. A case
// sensitive target would not resolve it, so this reports the difference rather
// than leaving it to be discovered at load.
//
// It is a warning rather than an error: the load this file was written for
// succeeds. It becomes a failure only against a target that compares case
// sensitively, and the caller knows which it has.

function fold(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

module.exports = function dataReferenceCaseMismatch(ctx) {
  const records = [];
  const namesByType = {};
  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!Array.isArray(recs)) continue;
    const written = recs.map((r) => r.Name || r.name).filter(Boolean);
    namesByType[typeName] = { exact: new Set(written), folded: new Set(written.map(fold)) };
  }

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!Array.isArray(recs)) continue;
    const attrs = ctx.schema.attributes[typeName];
    if (!attrs) continue;
    const filepath = ctx.data.files[typeName];

    for (const rec of recs) {
      for (const [attrName, attrDef] of Object.entries(attrs)) {
        if (!attrDef || attrDef.type !== 1) continue;
        const targetType = attrDef.referenceType;
        if (!targetType) continue;
        const names = namesByType[targetType];
        if (!names) continue;

        const value = rec[attrName];
        if (value === undefined || value === null || value === '') continue;
        let values;
        if (Array.isArray(value)) values = value;
        else if (attrDef.max === -1 && typeof value === 'string') {
          values = value.split(';').map((s) => s.trim()).filter((s) => s !== '');
        } else values = [value];

        for (const v of values) {
          if (v === undefined || v === null || v === '') continue;
          if (names.exact.has(v)) continue;
          if (!names.folded.has(fold(v))) continue;
          records.push({
            message: `Reference '${v}' on attribute '${attrName}' matches a record in `
              + `'${targetType}' only when case is ignored. A target that compares names case `
              + `sensitively would not resolve it.`,
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
