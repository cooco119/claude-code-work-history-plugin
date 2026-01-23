---
name: project-init
description: Initialize work-history plugin in a project and optionally backfill from git history
---

## When to Use

- Setting up work-history in a project for the first time
- Backfilling work-history from existing git history

## Step 1: Plugin Installation

### Option A: Marketplace (Recommended)

```bash
# Add the plugin from marketplace
/plugin marketplace add cooco119/claude-code-work-history-plugin

# Install to project scope
/plugin install work-history --scope project
```

### Option B: Direct GitHub URL

```bash
/plugin install https://github.com/cooco119/claude-code-work-history-plugin --scope project
```

## Step 2: Verify Installation

After installation, confirm the following exist:
- `.work-history/{USER}/` directory
- `index.md` file
- `completed/` directory

If not present, run `/work-history` skill to initialize.

## Step 3: Git History Backfill (Optional)

### 3.1 Collect Commit History

Ask the user for scope preferences, then run:

```bash
# Last N commits
git log --oneline -n 50 --format="%h|%ad|%s" --date=short

# Or since a specific date
git log --oneline --since="YYYY-MM-DD" --format="%h|%ad|%s" --date=short
```

### 3.2 Semantic Grouping

Analyze collected commits and group them into logical work units.

**Grouping Criteria:**
- Same feature/module (e.g., "user auth" related commits)
- Same issue/PR (referenced in commit messages)
- Temporally related continuous work

**Grouping Examples:**
| Commits | Grouped Task |
|---------|--------------|
| "add user model", "add user routes", "add user tests" | "User feature implementation" |
| "fix login bug", "add login test" | "Login bug fix" |
| "refactor: extract utils", "refactor: cleanup imports" | "Code refactoring" |

**Guidelines:**
- Target 5-15 tasks total (avoid over-fragmentation)
- Each task should represent a coherent unit of work
- Preview grouping results and get user confirmation before creating files

### 3.3 Create Task Files

For each group, create `completed/YYYY-MM-DD-task-name.md`:

```yaml
---
status: done
started: <first commit date>
ended: <last commit date>
branch: <branch name if available>
related_files:
  - <files changed>
source: git-backfill
---

# Goal

<Summary of what this work accomplished>

# Summary

<Description of completed work>

# Commits

- <hash>: <message>
- <hash>: <message>
```

### 3.4 Update index.md

Add backfilled tasks to the Completed section:

```markdown
## Completed

- [task-name](./completed/YYYY-MM-DD-task.md) - Brief description
```

## Claude Guidelines

1. **Scope Confirmation**: Before backfill, confirm scope with user (date range or commit count)
2. **Preview First**: Show proposed grouping before creating files
3. **User Approval**: Wait for user confirmation before writing files
4. **Reasonable Granularity**: Target 5-15 tasks; merge small related commits
5. **Preserve Meaning**: Group by semantic purpose, not just time proximity
6. **Idempotency**: Check for existing backfilled tasks to avoid duplicates (look for `source: git-backfill`)

## Quick Start Checklist

- [ ] Install plugin (marketplace or direct URL)
- [ ] Choose scope: project or global
- [ ] Verify `.work-history/{USER}/` structure
- [ ] (Optional) Backfill from git history
  - [ ] Confirm scope with user
  - [ ] Collect commits
  - [ ] Group semantically
  - [ ] Preview and get approval
  - [ ] Create task files
  - [ ] Update index.md
