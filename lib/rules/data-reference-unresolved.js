'use strict';

const EMPTY_NAMES = new Set();

// A reference is resolved by folding case, because every target this kit writes
// to compares names that way, and refusing one the target resolves would be a
// false failure. A reference that resolves only after folding is still reported,
// by data.reference.case-mismatch, since a case sensitive target would not
// resolve it. Together the two pass nothing that would fail on either target.
function fold(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

module.exports = function dataReferenceUnresolved(ctx) {
  const records = [];
  const namesByType = {};
  for (const typeName of Object.keys(ctx.data.records)) {
    const recs = ctx.data.records[typeName];
    if (!recs) continue;
    namesByType[typeName] = new Set(recs.map((r) => r.Name || r.name).filter(Boolean).map(fold));
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
        // A declared type with no data file resolves no name, so a reference into
        // it is as broken as one into an empty file. Skipping here meant deleting a
        // data file silenced every reference into it while the run stayed clean.
        // Where the target is not declared at all, attributes.reference-type.unresolved
        // already reports it and a second finding here would say the same thing twice.
        const targetDeclared = Boolean(ctx.schema.attributes[targetType]);
        const targetNames = namesByType[targetType] || (targetDeclared ? EMPTY_NAMES : null);
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
          if (!targetNames.has(fold(v))) {
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
