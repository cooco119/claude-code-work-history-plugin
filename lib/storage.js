#!/usr/bin/env node
/**
 * storage.js - Storage path detection logic for work-history plugin
 *
 * Determines storage location based on plugin installation:
 * - Project-level install: {project}/.claude/work-history/{USER}/
 * - Global install: {plugin}/data/{PATH_HASH}/
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Get plugin directory (where this script is located)
const PLUGIN_DIR = path.dirname(__dirname);

/**
 * Detect if this is a global or project-level installation
 */
function detectInstallType() {
  const globalPluginsDir = path.join(os.homedir(), '.claude', 'plugins');
  if (PLUGIN_DIR.startsWith(globalPluginsDir)) {
    return 'global';
  }
  return 'project';
}

/**
 * Get the current project directory (where Claude is running)
 */
function getProjectDir() {
  return process.cwd();
}

/**
 * Generate a short hash from project path (first 8 chars of SHA-256)
 */
function getPathHash(projectPath) {
  return crypto.createHash('sha256').update(projectPath).digest('hex').slice(0, 8);
}

/**
 * Get the storage root directory
 */
function getStorageRoot() {
  const installType = detectInstallType();

  if (installType === 'global') {
    return path.join(PLUGIN_DIR, 'data');
  } else {
    // Project-level: use project's .claude/work-history/
    const projectDir = getProjectDir();
    return path.join(projectDir, '.claude', 'work-history');
  }
}

/**
 * Get the storage directory for current scope
 */
function getStorageDir() {
  const installType = detectInstallType();
  const storageRoot = getStorageRoot();

  if (installType === 'global') {
    const projectDir = getProjectDir();
    const pathHash = getPathHash(projectDir);
    return path.join(storageRoot, pathHash);
  } else {
    // Project-level: use $USER as key
    const user = process.env.USER || process.env.USERNAME || 'unknown';
    return path.join(storageRoot, user);
  }
}

/**
 * Get the index.md path for current scope
 */
function getIndexPath() {
  return path.join(getStorageDir(), 'index.md');
}

/**
 * Get the template path
 */
function getTemplatePath() {
  return path.join(getStorageRoot(), 'template.md');
}

/**
 * Initialize storage directory if it doesn't exist
 */
function initStorage() {
  const storageDir = getStorageDir();
  const storageRoot = getStorageRoot();
  const installType = detectInstallType();
  const user = process.env.USER || process.env.USERNAME || 'unknown';

  // Create directories with proper permissions
  const completedDir = path.join(storageDir, 'completed');
  if (!fs.existsSync(completedDir)) {
    fs.mkdirSync(completedDir, { recursive: true, mode: 0o700 });
  }

  // Create .project-info for global installs
  if (installType === 'global') {
    const projectDir = getProjectDir();
    const projectInfoPath = path.join(storageDir, '.project-info');
    if (!fs.existsSync(projectInfoPath)) {
      const projectInfo = {
        path: projectDir,
        name: path.basename(projectDir),
        created: new Date().toISOString()
      };
      fs.writeFileSync(projectInfoPath, JSON.stringify(projectInfo, null, 2), { mode: 0o600 });
    }
  }

  // Copy template if not exists
  const templateSrc = path.join(PLUGIN_DIR, 'templates', 'task.md');
  const templateDest = getTemplatePath();
  if (fs.existsSync(templateSrc) && !fs.existsSync(templateDest)) {
    fs.copyFileSync(templateSrc, templateDest);
    fs.chmodSync(templateDest, 0o600);
  }

  // Create index.md if not exists
  const indexPath = getIndexPath();
  if (!fs.existsSync(indexPath)) {
    const indexContent = `# Work History - ${user}

## Active

## Completed
`;
    fs.writeFileSync(indexPath, indexContent, { mode: 0o600 });
  }
}

/**
 * Check if running in CI environment
 */
function isCIEnvironment() {
  const ciVars = ['CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'JENKINS_URL', 'CIRCLECI', 'TRAVIS', 'BUILDKITE'];
  return ciVars.some(v => process.env[v]);
}

module.exports = {
  PLUGIN_DIR,
  detectInstallType,
  getProjectDir,
  getPathHash,
  getStorageRoot,
  getStorageDir,
  getIndexPath,
  getTemplatePath,
  initStorage,
  isCIEnvironment
};
