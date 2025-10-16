# Usable Discord Bot 🤖

A Discord bot that automatically creates Usable memory fragments from forum
posts, enabling seamless issue tracking and knowledge management directly from
Discord.

> **🎬 Ready for Live Demo?** Check out [DEMO.md](./DEMO.md) for a complete live
> stream guide!

## Features

- 🎯 **Automatic Fragment Creation**: Converts forum thread posts into Usable
  memory fragments
- 🔄 **Real-time Updates**: Automatically updates fragments when replies are
  added to Discord threads
- 🏷️ **Smart Tag Syncing**: Discord forum tags sync to Usable in real-time
- 📝 **Full Conversation Tracking**: Captures entire thread conversations with
  timestamps and authors
- ✅ **Instant Feedback**: Notifies users with fragment ID upon creation
- 🗄️ **Database-Free Design**: Uses Discord messages as storage (no external DB
  needed!)
- 🛡️ **Type Safety**: Built with TypeScript for robust error handling
- 📊 **Structured Logging**: Comprehensive logging for debugging and monitoring
- ⚙️ **Flexible Configuration**: JSON-based forum-to-fragment-type mapping

## Architecture

```
src/
├── config/
│   └── env.ts              # Environment configuration with Zod validation
├── handlers/
│   ├── ready.handler.ts    # Bot ready event handler
│   ├── thread-create.handler.ts  # Forum thread → Create fragment
│   ├── thread-update.handler.ts  # Tags/title changes → Update fragment
│   └── message-create.handler.ts # New replies → Update fragment
├── services/
│   └── usable-api.service.ts     # Usable REST API integration
├── types/
│   ├── discord.ts          # Discord-related types & constants
│   └── usable.ts           # Usable API types
├── utils/
│   └── logger.ts           # Structured logging utility
├── bot.ts                  # Main Discord bot client
└── index.ts                # Application entry point
```

## Prerequisites

- Bun >= 1.0.0 ([Install Bun](https://bun.sh))
- Discord bot token
  ([Create a bot](https://discord.com/developers/applications))
- Usable API key ([Get API key](https://usable.dev))
- Usable workspace ID and fragment type IDs

## Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd usable-discord-bot

# Install dependencies
bun install
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# Usable API Configuration
USABLE_API_URL=https://api.usable.dev/api
USABLE_API_KEY=your_usable_api_key_here
USABLE_WORKSPACE_ID=your-workspace-uuid-here

# Fragment Type IDs
USABLE_ISSUE_FRAGMENT_TYPE_ID=your-issue-fragment-type-uuid-here
USABLE_FEATURE_FRAGMENT_TYPE_ID=your-feature-fragment-type-uuid-here

# Bot Configuration
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section:
   - Copy the bot token → `DISCORD_BOT_TOKEN`
   - Enable "Message Content Intent"
   - Enable "Server Members Intent" (optional)
4. Go to the "OAuth2" section:
   - Copy the client ID → `DISCORD_CLIENT_ID`
5. Generate an invite URL with these permissions:
   - Scopes: `bot`
   - Bot Permissions:
     - Read Messages/View Channels
     - Send Messages
     - Send Messages in Threads
     - Read Message History
6. Use the invite URL to add the bot to your server

### 4. Usable API Setup

1. Log in to [Usable](https://usable.dev)
2. Navigate to your workspace settings
3. Generate an API key → `USABLE_API_KEY`
4. Copy your workspace ID → `USABLE_WORKSPACE_ID`
5. Get fragment type IDs from workspace settings

## Usage

### Development

Run the bot in development mode with hot reload:

```bash
bun run dev
```

### Production

Run the bot directly (Bun doesn't need a build step!):

```bash
bun start
```

Or build for deployment:

```bash
bun run build
bun dist/index.js
```

### Linting and Formatting

```bash
# Check code (lint + format)
bun run check

# Lint only
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Type-check without building
bun run type-check
```

> **Biome Advantage**: ~35x faster than ESLint + Prettier! ⚡

## How It Works

### Forum Thread Creation

1. User creates a new thread in a Discord forum channel
2. Bot detects the `threadCreate` event
3. Bot fetches the starter message content
4. Bot creates a Usable memory fragment with:
   - Title: Thread name
   - Content: Formatted message with Discord context
   - Tags: Auto-generated from Discord metadata
   - Fragment Type: Issue (default)
5. Bot replies to the thread with the fragment ID

### Example Output

When a forum thread is created, the bot replies:

```
✅ Issue registered in Usable!
📝 Fragment ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
📌 Title: How do I fix CORS errors?

Your post has been automatically logged. Updates to this thread will be tracked.
```

## Fragment Format

Fragments created by the bot include rich metadata:

```markdown
## Discord Thread Message

**Server:** My Discord Server **Channel:** help-forum **Thread:** How do I fix
CORS errors? **Author:** username **Posted:** 2025-10-15T19:00:00.000Z

---

[Original message content]
```

## Configuration

### Environment Variables

| Variable                 | Description                                      | Required | Default                      |
| ------------------------ | ------------------------------------------------ | -------- | ---------------------------- |
| `DISCORD_BOT_TOKEN`      | Discord bot authentication token                 | Yes      | -                            |
| `DISCORD_CLIENT_ID`      | Discord application client ID                    | Yes      | -                            |
| `DISCORD_FORUM_MAPPINGS` | JSON mapping of forum IDs to fragment type UUIDs | Yes      | -                            |
| `USABLE_API_URL`         | Usable API base URL                              | No       | `https://api.usable.dev/api` |
| `USABLE_API_KEY`         | Usable API authentication key                    | Yes      | -                            |
| `USABLE_WORKSPACE_ID`    | Target Usable workspace UUID                     | Yes      | -                            |
| `NODE_ENV`               | Node environment                                 | No       | `development`                |
| `LOG_LEVEL`              | Logging level (error, warn, info, debug)         | No       | `info`                       |
| `HEALTH_PORT`            | HTTP port for Kubernetes health check endpoints  | No       | `3000`                       |

### Log Levels

- `error`: Only critical errors
- `warn`: Warnings and errors
- `info`: General information, warnings, and errors (recommended)
- `debug`: Detailed debugging information

## Deployment

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create usable-discord-bot

# Set environment variables
heroku config:set DISCORD_BOT_TOKEN=your_token
heroku config:set USABLE_API_KEY=your_key
# ... set other variables

# Deploy
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### AWS / GCP / Azure

The bot can run on any Node.js hosting platform. Ensure:

- Node.js 18+ runtime
- Environment variables configured
- Process manager (PM2 recommended)
- Monitoring and logging setup

## Future Enhancements

- [ ] **Fragment Updates**: Update fragments when thread receives replies
- [ ] **Database Integration**: Store thread-to-fragment mappings
- [ ] **Slash Commands**: `/usable` commands for manual operations
- [ ] **Multi-workspace Support**: Route threads to different workspaces
- [ ] **Custom Fragment Types**: Auto-detect feature requests vs bugs
- [ ] **Reaction-based Actions**: React to messages for quick actions
- [ ] **Search Integration**: Search Usable fragments from Discord
- [ ] **Status Dashboard**: Web dashboard for bot monitoring

## Troubleshooting

### Bot not responding to threads

1. Verify bot has correct permissions in Discord
2. Check `Message Content Intent` is enabled
3. Ensure bot is in the correct server
4. Check logs for errors: `LOG_LEVEL=debug npm run dev`

### Fragment creation fails

1. Verify Usable API key is valid
2. Check workspace ID is correct
3. Verify fragment type IDs exist in workspace
4. Review API response in logs

### Environment validation errors

Ensure all required environment variables are set in `.env`. The bot validates
all config on startup.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

MIT

## Support

For issues, questions, or contributions:

- Create an issue in the repository
- Contact the Flowcore team
- Check the [Usable documentation](https://usable.dev/docs)

---

**Built with ❤️ by Flowcore using Usable MCP**
