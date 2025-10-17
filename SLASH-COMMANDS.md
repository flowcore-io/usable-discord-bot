# ⚔️ Discord Bot - Slash Commands Guide

## Overview

The bot includes Discord slash commands for moderators to manually sync forum
threads. These commands use Discord's native permission system - **no API keys
or ingress needed**!

## Available Commands

### `/sync-thread <thread_id> [force]`

Sync a specific thread to Usable.

**Parameters:**

- `thread_id` (required) - The Discord thread ID\
  _Get it by: Right-click thread title > Copy Message ID_
- `force` (optional) - Reprocess even if already synced (default: false)

**Example:**

```
/sync-thread thread_id:1428693048187031652
/sync-thread thread_id:1428693048187031652 force:true
```

**Response:**

```
✅ Thread synced successfully!

📝 Thread ID: 1428693048187031652
_Thread processed for the first time._
```

**Use Cases:**

- User reports their post wasn't tracked
- Emergency recovery of failed thread
- Reprocess thread with updated configuration

---

### `/sync-forum [forum_id] [max_age_hours] [limit] [dry_run]`

Sync recent threads from a forum (or all forums).

**Parameters:**

- `forum_id` (optional) - Specific forum to sync (leave empty for all)
- `max_age_hours` (optional) - Only sync threads newer than this (default: 24,
  max: 720)
- `limit` (optional) - Max threads per forum (default: 50, max: 200)
- `dry_run` (optional) - Preview without syncing (default: false)

**Examples:**

```
# Sync all forums (last 24 hours)
/sync-forum

# Sync specific forum (last 48 hours)
/sync-forum forum_id:1409902682981924989 max_age_hours:48

# Dry run to see what would be synced
/sync-forum dry_run:true max_age_hours:168
```

**Response:**

```
✅ Sync Complete

📊 Results for All configured forums
• Scanned: 23 threads
• Unprocessed: 4 threads
• Processed: 4 threads
• Skipped: 19 threads (already synced)
• Failed: 0 threads
```

**Use Cases:**

- Bot downtime recovery
- Regular maintenance sync
- Check for orphaned threads

---

### `/list-forums`

Show all forums configured for tracking.

**Example:**

```
/list-forums
```

**Response:**

```
📋 Configured Forums (2)

These forums are tracked and can be synced:

• bug-reports
  ├─ Forum ID: 1409902682981924989
  └─ Fragment Type: 78a29aeb-8c6a-41b9-b54d-d0555be7e123

• feature-requests
  ├─ Forum ID: 1409989836659419141
  └─ Fragment Type: 78a29aeb-8c6a-41b9-b54d-d0555be7e123

_Only these forums will be synced. Other forums are ignored._
```

**Use Cases:**

- Check which forums are being tracked
- Get forum IDs for syncing
- Verify configuration

---

## Permissions

**Required Permission:** `Manage Messages`

Only Discord members with the "Manage Messages" permission can use these
commands. This typically includes:

- Server administrators
- Moderators
- Users with custom roles that include "Manage Messages"

**No API keys needed!** Discord's permission system handles authorization
automatically.

---

## Common Scenarios

### Scenario 1: User Reports Missing Post

**User:** "I posted in bug-reports but it wasn't tracked!"

**Moderator:**

1. Get thread ID: Right-click thread title > Copy Message ID
2. Run: `/sync-thread thread_id:1428693048187031652`
3. ✅ Done! Thread is now synced

### Scenario 2: Bot Was Down

**Moderator:**

1. Check how long bot was down (e.g., 6 hours)
2. Add buffer: `/sync-forum max_age_hours:8`
3. Review results to ensure all threads recovered

### Scenario 3: Check What Needs Syncing

**Moderator:**

1. Run: `/sync-forum dry_run:true max_age_hours:48`
2. Review unprocessed thread count
3. If needed, run without `dry_run` to actually sync

### Scenario 4: Verify Forum Configuration

**Moderator:**

1. Run: `/list-forums`
2. Confirm the forum is in the list
3. If missing, contact admin to add to `DISCORD_FORUM_MAPPINGS`

---

## Tips & Best Practices

### ✅ Do:

- Use `/list-forums` to check configuration before syncing
- Start with `dry_run: true` for large syncs
- Use reasonable time windows (24-48 hours)
- Check bot logs if sync fails

### ❌ Don't:

- Sync very large time windows (> 1 week) without testing
- Force reprocess threads unnecessarily
- Forget to enable Discord Developer Mode (needed to copy IDs)

---

## Enabling Developer Mode

To copy thread IDs, you need Discord Developer Mode:

1. Open Discord Settings (⚙️)
2. Go to "Advanced"
3. Enable "Developer Mode"
4. Now you can right-click threads and see "Copy Message ID"

---

## Troubleshooting

### "You need Manage Messages permission"

- You don't have moderator permissions
- Contact server admin to grant permission

### "Failed to sync thread"

Possible reasons:

- Thread ID is wrong (check you copied correctly)
- Thread is not in a forum
- Forum is not configured (use `/list-forums`)
- Thread deleted or archived

### "Discord client not initialized"

- Bot is still starting up
- Wait a few seconds and try again

### "Unprocessed: 0 threads"

- Good news! Nothing to sync
- Or your time window is too narrow
- Or the forum isn't configured

---

## Technical Details

### Command Registration

Commands are registered globally when the bot starts. Changes to commands
require a bot restart.

### Response Visibility

All command responses are **ephemeral** (only visible to you). This keeps
channels clean while giving moderators feedback.

### Rate Limits

Discord has rate limits on API calls. For large syncs (>100 threads), the bot
will process them gradually to avoid hitting limits.

### Database-Free

The bot uses Discord messages as the "database" - threads without a bot reply
are unprocessed. No external database needed!

---

## Related Documentation

- [RECOVERY.md](./RECOVERY.md) - Full disaster recovery guide (HTTP API)
- [README.md](./README.md) - Bot setup and configuration
- [AGENTS.md](./AGENTS.md) - Architecture and technical details

---

**Questions?** Check the bot logs or contact the development team!
