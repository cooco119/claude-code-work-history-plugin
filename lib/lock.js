#!/usr/bin/env node
/**
 * lock.js - Non-blocking file lock utilities for work-history plugin
 *
 * Uses lockfile for cross-platform non-blocking locks.
 * If lock cannot be acquired, operation is skipped (not blocked).
 */

const fs = require('fs');
const path = require('path');

/**
 * Get lock file path
 */
function getLockFile(storageDir) {
  return path.join(storageDir, '.work-history.lock');
}

/**
 * Try to acquire lock (non-blocking)
 * Returns true if lock acquired, false if failed
 */
function tryLock(storageDir) {
  const lockFile = getLockFile(storageDir);

  try {
    // Create lock file exclusively (fails if exists)
    const fd = fs.openSync(lockFile, 'wx');

    // Write PID for debugging
    fs.writeSync(fd, String(process.pid));
    fs.closeSync(fd);

    // Set permissions
    fs.chmodSync(lockFile, 0o600);

    return true;
  } catch (err) {
    if (err.code === 'EEXIST') {
      // Lock file exists, check if stale (older than 1 hour)
      try {
        const stats = fs.statSync(lockFile);
        const ageMs = Date.now() - stats.mtimeMs;
        const oneHour = 60 * 60 * 1000;

        if (ageMs > oneHour) {
          // Stale lock, remove and retry
          fs.unlinkSync(lockFile);
          return tryLock(storageDir);
        }
      } catch (e) {
        // Ignore stat errors
      }
      return false;
    }
    // Other error, try to create directory
    if (err.code === 'ENOENT') {
      fs.mkdirSync(storageDir, { recursive: true, mode: 0o700 });
      return tryLock(storageDir);
    }
    return false;
  }
}

/**
 * Release lock
 */
function releaseLock(storageDir) {
  const lockFile = getLockFile(storageDir);
  try {
    fs.unlinkSync(lockFile);
  } catch (err) {
    // Ignore errors
  }
}

/**
 * Execute function with lock (non-blocking)
 * Returns result of fn if executed, null if skipped due to lock
 */
async function withLock(storageDir, fn) {
  if (tryLock(storageDir)) {
    try {
      return await fn();
    } finally {
      releaseLock(storageDir);
    }
  } else {
    console.error('[work-history] Skipped: another session is active');
    return null;
  }
}

module.exports = {
  getLockFile,
  tryLock,
  releaseLock,
  withLock
};
