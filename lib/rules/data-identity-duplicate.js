'use strict';

// Two records in one type sharing their identity. A load keeps one of them and
// reports success, so the loss is silent. The case that produced this rule was a
// spreadsheet where two people entered the same product name.
//
// The identity is the type's own and is not always Name. The caller supplies it
// as config.identity, a map of type name to field list, because a schema
// directory does not state identity today. Where the caller supplies nothing,
// Name is the assumption, which is right for most types and stated here rather
// than hidden.

const DEFAULT_IDENTITY = ['Name'];

function identityFieldsFor(typeName, config) {
  const declared = config?.identity?.[typeName];
  if (Array.isArray(declared) && declared.length) return declared;
  if (typeof declared === 'string') return [declared];
  return DEFAULT_IDENTITY;
}

function valueOf(record, field) {
  const raw = (field === 'Name' || field === 'name')
    ? (record.Name ?? record.name)
    : record[field];
  if (raw === undefined || raw === null) return '';
  return String(raw).trim().toLowerCase();
}

module.exports = function dataIdentityDuplicate(ctx) {
  const records = [];

  for (const [typeName, recs] of Object.entries(ctx.data.records)) {
    if (!Array.isArray(recs) || recs.length < 2) continue;
    const fields = identityFieldsFor(typeName, ctx.config);
    const filepath = ctx.data.files[typeName];
    const firstSeen = new Map();
    const reported = new Set();

    recs.forEach((rec, index) => {
      const key = fields.map((f) => valueOf(rec, f)).join('|');
      if (key.split('|').every((part) => part === '')) return;
      if (!firstSeen.has(key)) {
        firstSeen.set(key, index);
        return;
      }
      if (reported.has(key)) return;
      reported.add(key);
      records.push({
        message: `Two records share the identity '${key}'. ${typeName} is identified by `
          + `${fields.join(' plus ')}, and a load keeps one of them and reports success.`,
        file: filepath,
        recordName: rec.Name || rec.name || null,
        field: fields.join(', '),
      });
    });
  }

  return records;
};
