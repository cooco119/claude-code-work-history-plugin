#!/usr/bin/env node
/**
 * session-start.sh - SessionStart hook for work-history plugin
 *
 * Loads active tasks and outputs them as additionalContext for Claude.
 * Output goes to stdout and is injected into the conversation.
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

// Initialize storage if needed
storage.initStorage();

// Get paths
const STORAGE_DIR = storage.getStorageDir();
const INDEX_PATH = storage.getIndexPath();

// Check if index exists
if (!fs.existsSync(INDEX_PATH)) {
  process.exit(0);
}

/**
 * Extract active tasks from index.md
 */
function extractActiveTasks(indexFile) {
  const content = fs.readFileSync(indexFile, 'utf8');
  const lines = content.split('\n');
  const tasks = [];
  let inActive = false;

  for (const line of lines) {
    // Check for Active section
    if (/^##\s+Active/.test(line)) {
      inActive = true;
      continue;
    }

    // Check for end of Active section (next ## header)
    if (inActive && /^##\s/.test(line)) {
      break;
    }

    // Extract task links in Active section
    if (inActive) {
      const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        let taskPath = match[2];
        // Convert relative path to absolute
        if (!path.isAbsolute(taskPath)) {
          taskPath = path.join(STORAGE_DIR, taskPath.replace(/^\.\//, ''));
        }
        if (fs.existsSync(taskPath)) {
          tasks.push(taskPath);
        }
      }
    }
  }

  return tasks;
}

/**
 * Extract specific sections from a task file
 */
function extractTaskSummary(taskFile) {
  const content = fs.readFileSync(taskFile, 'utf8');
  const filename = path.basename(taskFile, '.md');
  const lines = content.split('\n');

  let output = `### ${filename}\n\n`;

  let inSection = '';
  let sectionContent = '';
  const targetSections = ['Goal', 'Current State', 'Handoff'];

  for (const line of lines) {
    // Detect section headers
    const sectionMatch = line.match(/^#\s+(Goal|Current\s+State|Handoff)/);
    if (sectionMatch) {
      // Print previous section if it was one we want
      if (inSection && sectionContent.trim()) {
        output += `**${inSection}:**\n${sectionContent.trim()}\n\n`;
      }
      inSection = sectionMatch[1];
      sectionContent = '';
      continue;
    }

    // Skip other section headers
    if (/^#\s/.test(line)) {
      if (inSection && sectionContent.trim()) {
        output += `**${inSection}:**\n${sectionContent.trim()}\n\n`;
      }
      inSection = '';
      sectionContent = '';
      continue;
    }

    // Collect content for current section
    if (inSection) {
      sectionContent += line + '\n';
    }
  }

  // Print last section
  if (inSection && sectionContent.trim()) {
    output += `**${inSection}:**\n${sectionContent.trim()}\n\n`;
  }

  return output;
}

/**
 * Main execution
 */
function main() {
  const activeTasks = extractActiveTasks(INDEX_PATH);

  if (activeTasks.length === 0) {
    process.exit(0);
  }

  const MAX_CONTEXT_SIZE = 20480; // 20KB
  let totalSize = 0;

  console.log('## Active Work Items\n');

  for (const taskFile of activeTasks) {
    const stats = fs.statSync(taskFile);
    totalSize += stats.size;

    if (totalSize > MAX_CONTEXT_SIZE) {
      console.log('_Additional tasks truncated due to context size limit_');
      break;
    }

    console.log(extractTaskSummary(taskFile));
    console.log('---\n');
  }
}

main();
