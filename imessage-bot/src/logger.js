'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load the sent log from disk, or return a fresh empty log object.
 *
 * @param {string} logPath
 * @returns {{ meta: object, contacts: Record<string, object> }}
 */
function loadLog(logPath) {
  const resolved = path.resolve(logPath);
  if (!fs.existsSync(resolved)) {
    return {
      meta: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      contacts: {},
    };
  }

  try {
    const raw = fs.readFileSync(resolved, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read sent log at ${resolved}: ${err.message}`);
  }
}

/**
 * Persist the log to disk (synchronous write so it survives Ctrl+C).
 *
 * @param {string} logPath
 * @param {{ meta: object, contacts: Record<string, object> }} log
 */
function saveLog(logPath, log) {
  log.meta.lastUpdated = new Date().toISOString();
  const resolved = path.resolve(logPath);
  fs.writeFileSync(resolved, JSON.stringify(log, null, 2), 'utf8');
}

/**
 * Record a successful send.
 *
 * @param {object} log
 * @param {string} phone
 * @param {object} prospect
 * @param {string} message
 */
function markSent(log, phone, prospect, message) {
  log.contacts[phone] = {
    contact_name: prospect.contact_name,
    business_name: prospect.business_name,
    status: 'sent',
    sentAt: new Date().toISOString(),
    message,
  };
}

/**
 * Record a failed send.
 *
 * @param {object} log
 * @param {string} phone
 * @param {object} prospect
 * @param {string} errorMessage
 */
function markFailed(log, phone, prospect, errorMessage) {
  log.contacts[phone] = {
    contact_name: prospect.contact_name,
    business_name: prospect.business_name,
    status: 'failed',
    failedAt: new Date().toISOString(),
    error: errorMessage,
  };
}

/**
 * Record a dry-run entry.
 *
 * @param {object} log
 * @param {string} phone
 * @param {object} prospect
 * @param {string} message
 */
function markDryRun(log, phone, prospect, message) {
  log.contacts[phone] = {
    contact_name: prospect.contact_name,
    business_name: prospect.business_name,
    status: 'dry_run',
    loggedAt: new Date().toISOString(),
    message,
  };
}

/**
 * Return true if this contact should be skipped on a live run.
 * dry_run entries are NOT skipped — they should be sent for real.
 *
 * @param {object} log
 * @param {string} phone
 * @returns {boolean}
 */
function alreadyContacted(log, phone) {
  const entry = log.contacts[phone];
  if (!entry) return false;
  return entry.status === 'sent' || entry.status === 'failed';
}

module.exports = { loadLog, saveLog, markSent, markFailed, markDryRun, alreadyContacted };
