'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const REQUIRED_COLUMNS = ['phone', 'business_name', 'contact_name'];

/**
 * Load and parse a CSV file into an array of prospect objects.
 * Validates that all required columns are present.
 * Skips rows with an empty `phone` field and warns about them.
 *
 * @param {string} csvPath - path to the CSV file
 * @returns {{ prospects: Record<string, string>[], warnings: string[] }}
 */
function parseProspects(csvPath) {
  const resolved = path.resolve(csvPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`CSV file not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf8');

  let records;
  try {
    records = parse(raw, {
      columns: true,        // first row is the header
      skip_empty_lines: true,
      trim: true,
      bom: true,            // handle Excel-exported BOM
    });
  } catch (err) {
    throw new Error(`CSV parse error: ${err.message}`);
  }

  if (records.length === 0) {
    throw new Error('CSV file is empty or has no data rows.');
  }

  // Validate required columns against the actual headers
  const headers = Object.keys(records[0]);
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `CSV is missing required column(s): ${missing.join(', ')}\n` +
        `Found columns: ${headers.join(', ')}`
    );
  }

  const warnings = [];
  const prospects = [];

  records.forEach((row, i) => {
    const lineNum = i + 2; // +1 for header, +1 for 1-based
    if (!row.phone || row.phone.trim() === '') {
      warnings.push(`Row ${lineNum}: skipped — empty phone field.`);
      return;
    }
    prospects.push(row);
  });

  return { prospects, warnings };
}

module.exports = { parseProspects };
