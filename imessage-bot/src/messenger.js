'use strict';

const { execSync } = require('child_process');
const os = require('os');

/**
 * Verify that osascript is available (i.e., we are on macOS).
 * Throws if not.
 */
function assertMacOS() {
  if (os.platform() !== 'darwin') {
    throw new Error(
      'This bot requires macOS. osascript (AppleScript) is not available on this platform.'
    );
  }
  try {
    execSync('which osascript', { stdio: 'ignore' });
  } catch {
    throw new Error('osascript not found. Please run this bot on macOS.');
  }
}

/**
 * Escape a string for safe embedding inside an AppleScript string literal.
 * AppleScript strings are delimited by double-quotes; we escape backslashes
 * first, then double-quotes.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeAppleScript(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Send an iMessage to `recipient` with `messageText` via osascript.
 *
 * @param {string} recipient  - phone number (E.164) or Apple ID email
 * @param {string} messageText - the rendered message body
 * @throws {Error} if AppleScript exits with a non-zero code
 */
function sendMessage(recipient, messageText) {
  const escapedRecipient = escapeAppleScript(recipient);
  const escapedMessage = escapeAppleScript(messageText);

  // The AppleScript targets the "SMS" service for iMessage.
  // If the recipient is not on iMessage, the Messages app raises error -9.
  const script = `
tell application "Messages"
  set targetService to 1st service whose service type = iMessage
  set targetBuddy to buddy "${escapedRecipient}" of targetService
  send "${escapedMessage}" to targetBuddy
end tell
`.trim();

  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      stdio: ['ignore', 'ignore', 'pipe'],
      timeout: 30000, // 30-second timeout per message
    });
  } catch (err) {
    // Capture stderr from osascript for a meaningful error message
    const stderr = err.stderr ? err.stderr.toString().trim() : err.message;
    throw new Error(`AppleScript error: ${stderr || err.message}`);
  }
}

module.exports = { assertMacOS, sendMessage };
