'use strict';

function formatText(result, opts) {
  const o = opts || {};
  const stdoutTTY = o.stdoutTTY !== undefined ? o.stdoutTTY : !!process.stdout.isTTY;
  const stderrTTY = o.stderrTTY !== undefined ? o.stderrTTY : !!process.stderr.isTTY;
  const noColor = o.noColor !== undefined ? o.noColor : !!process.env.KIT_VALIDATE_NO_COLOR;

  return {
    stdoutLines: result.warnings.map((r) => formatLine(r, stdoutTTY && !noColor)),
    stderrLines: result.errors.map((r) => formatLine(r, stderrTTY && !noColor)),
  };
}

function formatLine(record, useColor) {
  const RED = useColor ? '\x1b[31m' : '';
  const YELLOW = useColor ? '\x1b[33m' : '';
  const RESET = useColor ? '\x1b[0m' : '';
  const color = record.severity === 'error' ? RED : YELLOW;
  const locParts = [record.file, record.recordName, record.field].filter(
    (x) => x !== null && x !== undefined && x !== ''
  );
  const loc = locParts.join(':');
  return `${color}${record.severity}${RESET} ${record.ruleId} ${loc} - ${record.message}`;
}

function formatJson(result) {
  return JSON.stringify(result);
}

module.exports = { formatText, formatJson, formatLine };
