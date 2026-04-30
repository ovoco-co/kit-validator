#!/usr/bin/env node
'use strict';

const { validate } = require('../lib');
const { formatText, formatJson } = require('../lib/format-output');

const HELP = `kit-validate - schema validator for the ovoco schema-kit pattern

Usage:
  kit-validate --schema <dir> [--domain <dir>]... [--format text|json]

Options:
  --schema <dir>     Path to a schema tier root (contains schema-structure.json,
                     schema-attributes.json, and a data/ subdirectory).
  --domain <dir>     Optional. Repeatable. Path to a domain that overlays the
                     main schema.
  --format <fmt>     Output format. 'text' (default) writes errors to stderr and
                     warnings to stdout, one record per line, with ANSI color
                     when the target stream is a TTY. 'json' writes the full
                     result object to stdout as a single JSON document.
  --help, -h         Show this help and exit 0.

Environment:
  KIT_VALIDATE_NO_COLOR  When set, disables ANSI color in text mode.

Exit codes:
  0   No errors emitted by the validator.
  1   At least one error emitted, or a usage error occurred.
`;

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP);
    return 0;
  }

  let schemaDir = null;
  const domainDirs = [];
  let format = 'text';

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--schema') {
      schemaDir = args[++i];
    } else if (a === '--domain') {
      domainDirs.push(args[++i]);
    } else if (a === '--format') {
      format = args[++i];
    } else {
      process.stderr.write(`kit-validate: unrecognized argument '${a}'\n`);
      return 1;
    }
  }

  if (!schemaDir) {
    process.stderr.write('kit-validate: --schema <dir> is required\n');
    return 1;
  }
  if (format !== 'text' && format !== 'json') {
    process.stderr.write(`kit-validate: --format must be 'text' or 'json', got '${format}'\n`);
    return 1;
  }

  let result;
  try {
    result = validate({ schemaDir, domainDirs });
  } catch (e) {
    process.stderr.write(`kit-validate: ${e.message}\n`);
    return 1;
  }

  if (format === 'json') {
    process.stdout.write(formatJson(result) + '\n');
  } else {
    const out = formatText(result);
    for (const l of out.stdoutLines) process.stdout.write(l + '\n');
    for (const l of out.stderrLines) process.stderr.write(l + '\n');
  }

  return result.exitCode;
}

const code = main(process.argv);
process.exit(code);
