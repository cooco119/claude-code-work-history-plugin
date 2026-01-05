# work-history

Claude Code plugin for work history management - load context on session start, track work autonomously, and maintain handoffs for seamless collaboration.

## Features

- **SessionStart Hook**: Automatically loads active tasks as context when Claude starts
- **SessionEnd Hook**: Reminds to update Handoff section before ending
- **Autonomous Skill**: Claude manages work history based on work flow judgment
- **Dual Storage Strategy**: Adapts to project-level or global installation

## Installation

### Via Claude Code CLI (Recommended)

```bash
# Add marketplace and install
/plugin marketplace add cooco119/claude-code-work-history-plugin
/plugin install work-history

# Or install directly from GitHub
/plugin install https://github.com/cooco119/claude-code-work-history-plugin
```

### Project-Level (Team collaboration)

```bash
/plugin install https://github.com/cooco119/claude-code-work-history-plugin --scope project
```

Storage location: `{project}/.claude/work-history/{USER}/`

### Global (Personal use across all projects)

```bash
/plugin install https://github.com/cooco119/claude-code-work-history-plugin --scope user
```

Storage location: `~/.claude/plugins/work-history/data/{PATH_HASH}/`

## How It Works

### On Session Start

1. Detects installation type (project vs global)
2. Checks for CI environment (disabled in CI)
3. Loads active tasks from `index.md`
4. Injects Goal, Current State, and Handoff as context

### During Work

Claude autonomously updates work history when:
- Starting a new logical unit of work
- Making significant decisions
- Completing milestones

### On Session End

1. Counts active tasks
2. Reminds to update Handoff section

## Requirements

- Node.js (any recent version)

## File Structure

```
work-history/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata
│   └── marketplace.json     # Marketplace configuration
├── hooks/
│   ├── session-start.sh     # Context loading (Node.js)
│   └── session-end.sh       # Handoff reminder (Node.js)
├── skills/
│   └── work-history/
│       └── SKILL.md         # Autonomous management guide
├── lib/
│   ├── storage.js           # Storage path logic
│   └── lock.js              # Non-blocking file lock
├── templates/
│   └── task.md              # Task template
└── README.md
```

> Note: Hook files use `.sh` extension for Claude Code compatibility but are actually JavaScript files with `#!/usr/bin/env node` shebang for cross-platform support.

## Task File Format

```yaml
---
status: in-progress
started: 2025-12-31
ended: ~
branch: feature/task-name
related_files:
  - src/feature.ts
depends_on: []
---

# Goal
Clear, measurable objective

# Plan
- [ ] Step 1
- [ ] Step 2

# Decisions
- 2025-12-31 14:30: Decision with rationale

# Current State
Brief progress description

# Handoff (2025-12-31 17:00)
- **Last:** What was completed
- **Context:** Important context
- **Next:** Recommended next steps
```

## Configuration

No configuration required. The plugin automatically:
- Detects installation type
- Creates storage directories with proper permissions (0600/0700)
- Initializes templates and index files

## Security

- Files created with 0600 permissions (owner read/write only)
- Directories created with 0700 permissions
- Non-blocking file locks prevent data corruption
- CI environment detection (disabled in CI)

## License

MIT
