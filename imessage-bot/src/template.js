'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load a template file from disk.
 *
 * @param {string} templatePath - absolute or relative path to the .txt template
 * @returns {string} raw template string
 */
function loadTemplate(templatePath) {
  const resolved = path.resolve(templatePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Template file not found: ${resolved}`);
  }
  return fs.readFileSync(resolved, 'utf8');
}

/**
 * Render a template string by replacing {{token}} placeholders with values
 * from the data object.  Unknown tokens are left in place and a warning is
 * returned alongside the rendered string.
 *
 * @param {string} template - raw template string
 * @param {Record<string, string>} data - key/value map (CSV row)
 * @returns {{ message: string, warnings: string[] }}
 */
function renderTemplate(template, data) {
  const warnings = [];

  const message = template.replace(/\{\{(\w+)\}\}/g, (match, token) => {
    if (Object.prototype.hasOwnProperty.call(data, token)) {
      return String(data[token]).trim();
    }
    warnings.push(`Unknown template token: {{${token}}}`);
    return match; // leave unknown tokens as-is
  });

  return { message, warnings };
}

module.exports = { loadTemplate, renderTemplate };
