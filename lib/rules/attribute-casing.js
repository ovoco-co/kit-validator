'use strict';

const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;

module.exports = function attributeCasing(ctx) {
  const records = [];
  const file = relPath(ctx, ctx.schema.attributesPath);

  for (const [typeName, attrs] of Object.entries(ctx.schema.attributes)) {
    for (const attrName of Object.keys(attrs)) {
      if (!CAMEL_CASE.test(attrName)) {
        records.push({
          message: `Attribute name '${attrName}' on type '${typeName}' is not camelCase.`,
          file,
          recordName: typeName,
          field: attrName,
        });
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
