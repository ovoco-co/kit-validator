'use strict';

module.exports = function attributesUnknownType(ctx) {
  const records = [];
  const file = relPath(ctx, ctx.schema.attributesPath);
  const names = new Set(ctx.schema.types.map((t) => t.name));

  for (const typeName of Object.keys(ctx.schema.attributes)) {
    if (!names.has(typeName)) {
      records.push({
        message: `Type '${typeName}' has attribute definitions in schema-attributes.json but is not declared in schema-structure.json.`,
        file,
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
