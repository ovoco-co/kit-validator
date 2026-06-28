# kit-validator

Schema validator library for the ovoco schema-kit pattern. Used by [cmdb-kit](https://github.com/ovoco-co/cmdb-kit), [hr-kit](https://github.com/ovoco-co/hr-kit), and any future kit that follows the same three-layer architecture (schema, data, adapters).

A consuming kit configures the library with its own LOAD_PRIORITY, then runs `kit-validate --schema schema/core` to enforce the cross-kit conventions: camelCase attribute names, Title Case display names, kebab-case data file names, exact-name reference resolution, LOAD_PRIORITY dependency order, and the rest of the rules common to schema kits.

## Status

Early scaffold. The first feature spec (`001-validator-core`) is in progress. No release yet.

## Usage Sketch

In a consuming kit's `package.json`:

```json
{
  "dependencies": {
    "@ovoco/kit-validator": "git+https://github.com/ovoco-co/kit-validator.git#v0.3.0"
  }
}
```

In `tools/validate.js`:

```js
const { validate } = require('@ovoco/kit-validator');
const { LOAD_PRIORITY } = require('./lib/constants');

const result = validate({
  schemaDir: process.argv[3],
  loadPriority: LOAD_PRIORITY,
});
process.exit(result.exitCode);
```

CLI:

```bash
kit-validate --schema schema/core
kit-validate --schema schema/core --domain schema/domains/infrastructure
```

## Data loading

Data records are loaded from the primary schema directory and from every directory passed in `domainDirs` (or with `--domain` on the CLI). For each type, the data file is sought across those directories in order, the primary first then each domain as given, and loaded from the first one that has it. The validated record set is the union, so a record in a domain that references a record in the base resolves, because both are loaded together.

When no `domainDirs` are passed, only the primary directory's data is read, exactly as before. If the same type's data file appears in more than one directory, the first in search order wins and later copies are ignored.

## Related

- [cmdb-kit](https://github.com/ovoco-co/cmdb-kit) - first consuming kit
- [hr-kit](https://github.com/ovoco-co/hr-kit) - second consuming kit

## License

MIT
