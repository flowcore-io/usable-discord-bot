# 🎬 Live Stream Demo Guide

## Quick Demo Flow (5 minutes)

### 1. **Show the Bot Running** (30 seconds)

```bash
bun run dev
```

Point out:

- ✅ Bot connects to Discord
- 🤖 Shows ready status with username and guild count
- 👀 Watching for forum posts

### 2. **Create a Forum Post in Discord** (1 minute)

In your Discord server:

1. Go to the `#bugs-and-issues` forum
2. Create a new post: "Demo Bug: App crashes on startup"
3. Add some description

**Watch the logs:**

```
INFO  New forum thread created
INFO  Creating Usable fragment
INFO  Successfully created Usable fragment
```

**Show in Discord:**

- Bot replies with ✅ confirmation
- Fragment ID displayed
- "Your post has been automatically logged"

### 3. **Show the Fragment in Usable** (1 minute)

Open Usable workspace:

- Search for "Demo Bug"
- Show the fragment was created
- Point out:
  - Title matches Discord post
  - Content includes author and timestamp
  - Tags: `discord`, `forum-post`, `server:your-server`,
    `channel:bugs-and-issues`
  - Fragment type: "Issue"

### 4. **Add a Reply in Discord** (1 minute)

Reply to the forum post: "I can reproduce this on Windows 11"

**Watch the logs:**

```
INFO  Thread reply detected - fragment already tracked
```

**Explain:**

- Bot detects the reply
- Finds the fragment ID from its previous message (no database needed!)
- Ready to update (currently disabled due to API bug)

### 5. **Add Discord Tags** (1 minute)

Add a Discord forum tag like "urgent" or "bug"

**Watch the logs:**

```
INFO  Thread updated - syncing to Usable
INFO  Thread tags changed
```

**Explain:**

- Bot detects tag changes
- Would sync to Usable (when API is fixed)
- Tags get prefixed: `discord-tag:urgent`

### 6. **Code Walkthrough** (30 seconds)

Quick tour of the architecture:

```
src/
├── index.ts              # Entry point - graceful shutdown
├── bot.ts                # Bot setup - event registration
├── handlers/             # Event handlers (3 main ones)
│   ├── thread-create     # New forum posts → Create fragment
│   ├── message-create    # Replies → Update fragment
│   └── thread-update     # Tag/title changes → Sync to Usable
├── services/             # Usable API integration
└── config/               # Environment & forum mappings
```

---

## Key Talking Points

### 🎯 **Problem We're Solving**

"Discord forums are great for community feedback, but they're not searchable,
taggable, or integrated with our knowledge base. This bot automatically syncs
Discord posts to Usable for long-term memory."

### 🧠 **Database-Free Design**

"Notice we don't have a database? The bot uses its own Discord messages as
storage! It posts the fragment ID, then reads it back later for updates. Simple
and reliable."

### 🎨 **Production Patterns**

- Event-driven architecture (clean separation)
- Structured logging (every action tracked)
- Graceful shutdown (SIGTERM/SIGINT handling)
- Environment validation (Zod schema)
- Type safety (TypeScript throughout)
- Error handling (try-catch everywhere)

### 🔧 **Flexible Configuration**

"You can map different Discord forums to different fragment types. Bugs go to
'Issue' fragments, feature requests to 'Feature Request' fragments. All
configured in JSON."

---

## Demo Variations

### **Variation 1: Show the "Undefined Title" Bug Fix**

Before fix, bot showed:

```
📌 Title: undefined
```

Show the fix in `thread-create.handler.ts`:

```typescript
// ❌ Old: fragment.title (from API - doesn't return title)
// ✅ New: thread.name (from Discord - what we already have)
📌 Title: ${thread.name}
```

### **Variation 2: Explain Forum Mappings**

Show `.env`:

```env
DISCORD_FORUM_MAPPINGS={"1428323879767506985":"78a29aeb-8c6a-41b9-b54d-d0555be7e123"}
```

"This maps the bugs forum to Issue fragments. Want to track features too? Just
add another mapping!"

### **Variation 3: Show the GUILD_FORUM Constant**

"We replaced magic numbers with named constants. Much cleaner!"

```typescript
// ❌ Before: thread.parent.type !== 15
// ✅ After:  thread.parent.type !== GUILD_FORUM
```

---

## Troubleshooting During Demo

### Bot Won't Start

```
❌ Environment variable validation failed
```

**Fix:** Check `.env` file - probably missing `DISCORD_FORUM_MAPPINGS`

### Bot Doesn't Respond

**Check:**

1. Is bot online in Discord? (green dot)
2. Is the forum in your mappings? (check logs for "Forum not configured")
3. Does bot have permissions? (read messages, send messages)

### Update Feature Shows Warning

```
⚠️  Failed to sync thread update to Usable (REST API issue)
```

**Explain:** "This is expected - we discovered a server-side bug in the REST
API. Creation works perfectly, updates will work once the API is fixed!"

---

## Advanced Topics (If Time Permits)

### **How Tag Syncing Works**

```typescript
// Discord tag IDs → Tag names → Usable tags
newThread.appliedTags // ["123", "456"]
  .map((id) => findTag(id)) // ["urgent", "bug"]
  .map((tag) => `discord-tag:${tag}`); // ["discord-tag:urgent", "discord-tag:bug"]
```

### **The Update Challenge**

"We hit a fun bug - REST API returns 500 'Failed to create session context'. But
MCP updates work! This tells us it's the REST endpoint, not the core logic."

### **Future Enhancements**

- ✅ **Reactions**: Track emoji reactions as sentiment
- ✅ **Solutions**: Mark threads as "solved" when accepted answer is posted
- ✅ **Webhooks**: Get notified in Discord when fragments are updated in Usable
- ✅ **Multi-server**: Support multiple Discord servers
- ✅ **Archive sync**: Archive fragments when threads are closed

---

## Quick Commands for Demo

```bash
# Start bot
bun run dev

# Check types
bun run typecheck

# Lint
bun run lint

# Format
bun run format

# View logs with debug level
LOG_LEVEL=debug bun run dev
```

---

## Talking Points for Live Stream

### **Opening** (30 seconds)

"Today we're building a Discord bot that syncs forum posts to Usable for
long-term memory. No database, production-ready patterns, and a fun bug
discovery along the way!"

### **During Coding** (as you go)

- "Notice how we validate everything with Zod - fail fast with helpful errors"
- "Event-driven means each handler does one thing well"
- "Structured logging makes debugging in production easy"
- "Type safety catches bugs before they hit production"

### **Bug Discovery Moment** (1 minute)

"Here's something interesting - when we tried updating fragments, the REST API
returned a 500 error. But MCP updates worked fine! This told us it wasn't our
code - it's a server-side bug in the REST endpoint. We documented it as an issue
in Usable's memory."

### **Closing** (30 seconds)

"In under an hour, we built a production-ready Discord bot that automatically
syncs forum posts to Usable. The code is open source, ready for your team to
use!"

---

## Repository Ready Checklist

- [x] `.env.example` with clear instructions
- [x] README.md with setup guide
- [x] All sensitive IDs replaced with placeholders
- [x] Code comments explaining key decisions
- [x] DEMO.md guide (this file)
- [x] Type-safe throughout
- [x] Linter clean
- [x] Production error handling
- [x] Graceful shutdown
- [x] Structured logging

---

## Post-Stream TODO

After the API bug is fixed:

1. Uncomment update logic in `message-create.handler.ts`
2. Test updates with a forum reply
3. Celebrate! 🎉
