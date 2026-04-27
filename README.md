# kit-validator

Schema validator library for the ovoco schema-kit pattern. Used by [cmdb-kit](https://github.com/ovoco-co/cmdb-kit), [hr-kit](https://github.com/ovoco-co/hr-kit), and any future kit that follows the same three-layer architecture (schema, data, adapters).

A consuming kit configures the library with its own LOAD_PRIORITY, nested-type list, and attribute-name map, then runs `kit-validate --schema schema/core` to enforce the cross-kit conventions: camelCase attribute names, Title Case display names, kebab-case data file names, exact-name reference resolution, LOAD_PRIORITY dependency order, and the rest of the rules common to schema kits.

## Status

Early scaffold. The first feature spec (`001-validator-core`) is in progress. No release yet.

## Usage Sketch

In a consuming kit's `package.json`:

```json
{
  "dependencies": {
    "@ovoco/kit-validator": "git+https://github.com/ovoco-co/kit-validator.git#v0.1.0"
  }
}
```

In `tools/validate.js`:

```js
const { validate } = require('@ovoco/kit-validator');
const { LOAD_PRIORITY, NESTED_TYPES, ATTR_NAME_MAP } = require('./lib/constants');

const result = validate({
  schemaDir: process.argv[3],
  loadPriority: LOAD_PRIORITY,
  nestedTypes: NESTED_TYPES,
  attrNameMap: ATTR_NAME_MAP,
});
process.exit(result.exitCode);
```

CLI:

```bash
kit-validate --schema schema/core
kit-validate --schema schema/core --domain schema/domains/infrastructure
```

## Related

- [cmdb-kit](https://github.com/ovoco-co/cmdb-kit) - first consuming kit
- [hr-kit](https://github.com/ovoco-co/hr-kit) - second consuming kit

## License

MIT
