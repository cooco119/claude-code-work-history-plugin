#!/usr/bin/env node
/**
 * session-end.sh - SessionEnd hook for work-history plugin
 *
 * Reminds Claude to update Handoff section before session ends.
 * This hook runs when the session is ending.
 */

const fs = require('fs');
const path = require('path');

// Get plugin directory
const SCRIPT_DIR = __dirname;
const PLUGIN_DIR = path.dirname(SCRIPT_DIR);

// Import storage utilities
const storage = require(path.join(PLUGIN_DIR, 'lib', 'storage.js'));

// Kill switch for CI environments
if (storage.isCIEnvironment()) {
  process.exit(0);
}

// Get paths
const INDEX_PATH = storage.getIndexPath();

// Check if index exists
if (!fs.existsSync(INDEX_PATH)) {
  process.exit(0);
}

/**
 * Count active tasks from index.md
 */
function countActiveTasks(indexFile) {
  const content = fs.readFileSync(indexFile, 'utf8');
  const lines = content.split('\n');
  let inActive = false;
  let count = 0;

  for (const line of lines) {
    // Check for Active section
    if (/^##\s+Active/.test(line)) {
      inActive = true;
      continue;
    }

    // Check for end of Active section
    if (inActive && /^##\s/.test(line)) {
      break;
    }

    // Count task links
    if (inActive && /\[([^\]]+)\]\(([^)]+)\)/.test(line)) {
      count++;
    }
  }

  return count;
}

/**
 * Main execution
 */
function main() {
  const activeCount = countActiveTasks(INDEX_PATH);

  if (activeCount > 0) {
    console.log(`[work-history] You have ${activeCount} active task(s). Consider updating the Handoff section before ending.`);
  }
}

main();
