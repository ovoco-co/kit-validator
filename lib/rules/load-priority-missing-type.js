'use strict';

module.exports = function loadPriorityMissingType(ctx) {
  const records = [];
  const loadPriority = Array.isArray(ctx.config.loadPriority) ? ctx.config.loadPriority : [];
  if (loadPriority.length === 0) return records;

  const inLoadPriority = new Set(loadPriority);
  // Only leaf types are importable and need a loadPriority entry. A type that
  // is the parent of another type is an abstract container with no data, so it
  // is skipped.
  const parents = new Set(ctx.schema.types.map((t) => t.parent).filter(Boolean));
  const seenTypes = new Set();

  for (const t of ctx.schema.types) {
    if (seenTypes.has(t.name)) continue;
    seenTypes.add(t.name);
    if (parents.has(t.name)) continue;
    if (!inLoadPriority.has(t.name)) {
      records.push({
        message: `Type '${t.name}' is declared in schema-structure.json but is missing from loadPriority.`,
        file: null,
        recordName: t.name,
        field: null,
      });
    }
  }
  return records;
};
