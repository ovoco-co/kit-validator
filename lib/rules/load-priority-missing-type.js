'use strict';

module.exports = function loadPriorityMissingType(ctx) {
  const records = [];
  const loadPriority = Array.isArray(ctx.config.loadPriority) ? ctx.config.loadPriority : [];
  if (loadPriority.length === 0) return records;

  const inLoadPriority = new Set(loadPriority);
  const seenTypes = new Set();

  for (const t of ctx.schema.types) {
    if (seenTypes.has(t.name)) continue;
    seenTypes.add(t.name);
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
