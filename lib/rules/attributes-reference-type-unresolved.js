'use strict';

module.exports = function attributesReferenceTypeUnresolved(ctx) {
  const records = [];
  const file = relPath(ctx, ctx.schema.attributesPath);
  const names = new Set(ctx.schema.types.map((t) => t.name));

  for (const [typeName, attrs] of Object.entries(ctx.schema.attributes)) {
    for (const [attrName, attrDef] of Object.entries(attrs)) {
      if (attrDef && attrDef.type === 1) {
        const ref = attrDef.referenceType;
        if (!ref) {
          records.push({
            message: `Attribute '${attrName}' on type '${typeName}' is a reference (type: 1) but has no referenceType.`,
            file,
            recordName: typeName,
            field: attrName,
          });
        } else if (!names.has(ref)) {
          records.push({
            message: `Attribute '${attrName}' on type '${typeName}' references type '${ref}' which is not declared in schema-structure.json.`,
            file,
            recordName: typeName,
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
