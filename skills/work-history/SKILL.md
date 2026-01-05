---
name: work-history
description: Use when starting, updating, or completing a task to maintain work history
---

## When to Use

- **Starting work**: Create new task file or resume existing one
- **During work**: Update Decisions section with timestamped entries
- **Pausing/Ending session**: Update Handoff section (MANDATORY)
- **Completing task**: Update status and move to completed/

## Storage Location

The plugin automatically detects the storage location:

**Project-level install** (`.claude/plugins/work-history/`):
```
{project}/.claude/work-history/{USER}/
├── index.md
├── YYYY-MM-DD-task-name.md
└── completed/
```

**Global install** (`~/.claude/plugins/work-history/`):
```
~/.claude/plugins/work-history/data/{PATH_HASH}/
├── .project-info
├── index.md
├── YYYY-MM-DD-task-name.md
└── completed/
```

## Creating a New Task

1. Determine storage directory (use `lib/storage.sh` functions or detect manually)
2. Create task file with template:
   ```
   {storage_dir}/$(date +%Y-%m-%d)-task-name.md
   ```

3. Fill in frontmatter and Goal section

4. Update index.md:
   ```markdown
   ## Active
   - [YYYY-MM-DD-task-name](./YYYY-MM-DD-task-name.md) - Brief description
   ```

## Task File Template

```yaml
---
status: in-progress
started: YYYY-MM-DD
ended: ~
branch: feature/task-name
related_files:
  - path/to/file.ts
depends_on: []
---

# Goal

Clear, measurable objective

# Plan

- [ ] Step 1
- [ ] Step 2

# Decisions

- YYYY-MM-DD HH:MM: Decision description and rationale

# Current State

Brief description of current progress

# Handoff (YYYY-MM-DD HH:MM)

- **Last:** What was just completed
- **Context:** Important context for continuation
- **Next:** Recommended next steps
```

## During Work

Add timestamped entries to Decisions when making significant choices:

```markdown
# Decisions

- 2025-12-31 14:30: Chose Redis for caching due to existing infrastructure
- 2025-12-31 15:45: Using decorator pattern for middleware to match existing style
```

## Ending a Session (MANDATORY)

**ALWAYS update Handoff before ending:**

```markdown
# Handoff (2025-12-31 17:00)

- **Last:** Implemented user creation endpoint, all tests passing
- **Context:** PR #42 is ready for review, waiting on CI
- **Next:** Address review comments when received, then merge
```

## Completing a Task

1. Update frontmatter:
   ```yaml
   status: done
   ended: 2025-12-31
   ```

2. Move file to `completed/` directory

3. Update index.md: move entry from Active to Completed
   ```markdown
   ## Completed
   - [task-name](./completed/YYYY-MM-DD-task.md) - Description
   ```

## Critical Rules

1. **ALWAYS update Handoff before ending session** - This is the key to continuity
2. Use timestamps for all Decisions entries (YYYY-MM-DD HH:MM format)
3. Keep Goal concise and measurable
4. Link related task files in `depends_on` if applicable
5. Update index.md when creating/completing tasks
6. Use file locking when modifying files (non-blocking, skip if locked)

## Claude's Autonomous Judgment

Claude should update work-history when:

- Starting a new logical unit of work
- Making a significant decision that affects the approach
- Completing a milestone or subtask
- Before any session ends (Handoff is mandatory)
- When the user explicitly requests documentation

Claude should NOT update work-history for:
- Trivial changes or quick questions
- Exploration/research without actionable outcomes
- When another session has the lock (skip gracefully)
