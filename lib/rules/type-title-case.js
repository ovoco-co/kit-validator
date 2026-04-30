'use strict';

module.exports = function typeTitleCase(ctx) {
  const records = [];
  const file = relPath(ctx, ctx.schema.structurePath);

  for (const t of ctx.schema.types) {
    if (!isTitleCase(t.name)) {
      records.push({
        message: `Type name '${t.name}' is not Title Case (each space-separated word must start with an uppercase letter; acronyms in all-caps allowed).`,
        file,
        recordName: t.name,
        field: 'name',
      });
    }
  }
  return records;
};

function isTitleCase(name) {
  if (!name || typeof name !== 'string') return false;
  const words = name.split(/\s+/);
  for (const w of words) {
    if (w.length === 0) continue;
    const first = w[0];
    if (first !== first.toUpperCase() || !/[A-Z]/.test(first)) return false;
    if (w === w.toUpperCase()) continue;
    if (/[a-z]/.test(w) && /^[A-Z]/.test(w)) continue;
    return false;
  }
  return true;
}

function relPath(ctx, abs) {
  const sd = ctx.schema.schemaDir;
  if (abs && abs.startsWith(sd)) return abs.slice(sd.length).replace(/^\//, '');
  return abs;
}
