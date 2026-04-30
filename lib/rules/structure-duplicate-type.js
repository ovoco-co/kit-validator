'use strict';

module.exports = function structureDuplicateType(ctx) {
  const records = [];
  const seen = new Map();
  const file = relPath(ctx, ctx.schema.structurePath);

  for (const t of ctx.schema.types) {
    const prev = seen.get(t.name);
    if (prev !== undefined) {
      records.push({
        message: `Type name '${t.name}' appears more than once in schema-structure.json.`,
        file,
        recordName: t.name,
        field: null,
      });
    } else {
      seen.set(t.name, true);
    }
  }
  return records;
};

function relPath(ctx, abs) {
  const sd = ctx.schema.schemaDir;
  if (abs && abs.startsWith(sd)) return abs.slice(sd.length).replace(/^\//, '');
  return abs;
}
