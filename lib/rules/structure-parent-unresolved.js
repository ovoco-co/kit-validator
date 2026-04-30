'use strict';

module.exports = function structureParentUnresolved(ctx) {
  const records = [];
  const file = relPath(ctx, ctx.schema.structurePath);
  const names = new Set(ctx.schema.types.map((t) => t.name));

  for (const t of ctx.schema.types) {
    if (t.parent && !names.has(t.parent)) {
      records.push({
        message: `Type '${t.name}' has parent '${t.parent}' which is not declared in schema-structure.json.`,
        file,
        recordName: t.name,
        field: 'parent',
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
