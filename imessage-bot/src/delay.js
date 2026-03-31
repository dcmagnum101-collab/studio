'use strict';

/**
 * Returns a promise that resolves after a random number of milliseconds
 * between minSec and maxSec (both inclusive).
 *
 * @param {number} minSec - minimum delay in seconds
 * @param {number} maxSec - maximum delay in seconds
 * @returns {Promise<void>}
 */
function randomDelay(minSec, maxSec) {
  const ms = Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the number of seconds that will be waited (for display purposes).
 *
 * @param {number} minSec
 * @param {number} maxSec
 * @returns {number}
 */
function sampleDelaySec(minSec, maxSec) {
  return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec);
}

module.exports = { randomDelay, sampleDelaySec };
