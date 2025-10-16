# Project Overview

## Usable Discord Bot

A production-ready TypeScript Discord bot that automatically creates Usable
memory fragments from Discord forum posts.

## Quick Stats

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: discord.js v14
- **Package Manager**: npm
- **Build Tool**: TypeScript Compiler
- **Code Style**: ESLint + Prettier
- **Deployment**: Docker, Heroku, AWS, VPS

## Project Structure

```
usable-discord-bot/
├── .github/
│   └── workflows/          # CI/CD pipelines
│       ├── ci.yml          # Lint, build, type-check
│       └── docker.yml      # Docker image build & push
├── src/
│   ├── config/
│   │   └── env.ts          # Environment config with Zod validation
│   ├── handlers/
│   │   ├── ready.handler.ts       # Bot ready event
│   │   ├── thread-create.handler.ts  # Forum thread creation
│   │   └── message-create.handler.ts # Message handling
│   ├── services/
│   │   └── usable-api.service.ts  # Usable API client
│   ├── types/
│   │   ├── discord.ts      # Discord-specific types
│   │   └── usable.ts       # Usable API types
│   ├── utils/
│   │   └── logger.ts       # Structured logging
│   ├── bot.ts              # Main Discord bot client
│   └── index.ts            # Application entry point
├── .dockerignore
├── .env.example            # Example environment variables
├── .eslintrc.json          # ESLint configuration
├── .prettierrc.json        # Prettier configuration
├── CONTRIBUTING.md         # Contribution guidelines
├── DEPLOYMENT.md           # Deployment guide
├── Dockerfile              # Multi-stage Docker build
├── LICENSE                 # MIT License
├── package.json            # Dependencies and scripts
├── PROJECT_OVERVIEW.md     # This file
├── README.md               # Main documentation
├── tsconfig.json           # TypeScript configuration
└── docker-compose.yml      # Docker Compose setup
```

## Core Features

### 1. Forum Thread Monitoring

- Listens for new threads in Discord forum channels
- Fetches starter message content
- Extracts rich metadata (server, channel, author, timestamp)

### 2. Usable Integration

- Creates memory fragments via Usable API
- Supports multiple fragment types (issues, features, etc.)
- Includes formatted content with Discord context
- Auto-generates tags from Discord metadata

### 3. User Notifications

- Replies to threads with fragment ID
- Provides immediate feedback on success/failure
- User-friendly error messages

### 4. Robust Architecture

- Type-safe with TypeScript
- Environment validation with Zod
- Structured logging with configurable levels
- Graceful error handling
- Signal handling for clean shutdowns

## Technology Stack

### Core Dependencies

```json
{
  "discord.js": "^14.16.3", // Discord API wrapper
  "axios": "^1.7.7", // HTTP client for Usable API
  "zod": "^3.23.8", // Schema validation
  "dotenv": "^16.4.5" // Environment variables
}
```

### Development Dependencies

```json
{
  "typescript": "^5.6.3", // Type system
  "tsx": "^4.19.1", // TypeScript executor
  "eslint": "^8.57.1", // Linting
  "prettier": "^3.3.3", // Code formatting
  "@types/node": "^22.8.4" // Node.js types
}
```

## Key Design Decisions

### 1. TypeScript

- **Why**: Type safety, better IDE support, catch errors at compile time
- **Trade-off**: Additional build step, learning curve

### 2. Zod for Validation

- **Why**: Runtime validation, type inference, great error messages
- **Alternative**: joi, yup, class-validator

### 3. Structured Logging

- **Why**: Easy debugging, production monitoring, log levels
- **Future**: Integration with log aggregation services (Datadog, LogDNA)

### 4. Handler Pattern

- **Why**: Separation of concerns, testability, maintainability
- **Structure**: Each Discord event has its own handler

### 5. Service Layer

- **Why**: Reusable API logic, easier testing, clear boundaries
- **Pattern**: Singleton services with dependency injection

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Docker Development

```bash
# Build image
docker build -t usable-discord-bot .

# Run container
docker-compose up -d

# View logs
docker-compose logs -f
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on: Push to `main`/`develop`, PRs
   - Jobs:
     - Lint: ESLint + Prettier checks
     - Build: TypeScript compilation
     - Type-check: `tsc --noEmit`

2. **Docker Workflow** (`.github/workflows/docker.yml`)
   - Runs on: Push to `main`, version tags
   - Builds multi-arch Docker images (amd64, arm64)
   - Pushes to GitHub Container Registry
   - Tags: `latest`, `sha-<commit>`, `v*.*.*`

## Environment Configuration

### Required Variables

| Variable                        | Description       | Example        |
| ------------------------------- | ----------------- | -------------- |
| `DISCORD_BOT_TOKEN`             | Discord bot token | `MTI...`       |
| `DISCORD_CLIENT_ID`             | Discord client ID | `123456789`    |
| `USABLE_API_KEY`                | Usable API key    | `usa_key_...`  |
| `USABLE_WORKSPACE_ID`           | Workspace UUID    | `xxxxxxxx-...` |
| `USABLE_ISSUE_FRAGMENT_TYPE_ID` | Issue type UUID   | `yyyyyyyy-...` |

### Optional Variables

| Variable         | Default                      | Options                             |
| ---------------- | ---------------------------- | ----------------------------------- |
| `NODE_ENV`       | `development`                | `development`, `production`, `test` |
| `LOG_LEVEL`      | `info`                       | `error`, `warn`, `info`, `debug`    |
| `USABLE_API_URL` | `https://api.usable.dev/api` | Custom URL                          |

## Future Enhancements

### Short-term (v1.1)

- [ ] Fragment updates when threads receive replies
- [ ] Thread-to-fragment mapping database
- [ ] Improved error recovery

### Medium-term (v1.2)

- [ ] Slash commands (`/usable`)
- [ ] Search Usable from Discord
- [ ] Multiple workspace support
- [ ] Auto-detect fragment types (bug vs feature)

### Long-term (v2.0)

- [ ] Reaction-based workflows
- [ ] Analytics dashboard
- [ ] Voice channel transcription
- [ ] AI-powered categorization

## Performance Considerations

### Current Limits

- Handles 1 server efficiently
- Suitable for 100-1000 threads/day
- ~50-100 MB memory usage
- Minimal CPU usage (<5%)

### Scaling Requirements

- **2500+ servers**: Implement sharding
- **High volume**: Add Redis queue
- **Multiple instances**: Shared state (database)

## Testing Strategy

### Current Status

- Manual testing with Discord test servers
- Environment validation tests (Zod)
- Type checking (TypeScript)

### Future Testing

- [ ] Unit tests (Jest/Vitest)
- [ ] Integration tests (API mocking)
- [ ] E2E tests (Discord bot simulation)
- [ ] Load testing

## Security Best Practices

✅ **Implemented**

- Environment variable validation
- No secrets in code
- Least privilege bot permissions
- Secure HTTP client (axios)
- Non-root Docker user

🔄 **Recommended**

- API rate limiting
- Input sanitization
- Audit logging
- Secret rotation
- Dependency scanning

## Documentation

| Document              | Purpose                          |
| --------------------- | -------------------------------- |
| `README.md`           | Main documentation, setup guide  |
| `CONTRIBUTING.md`     | Contribution guidelines          |
| `DEPLOYMENT.md`       | Deployment instructions          |
| `PROJECT_OVERVIEW.md` | This file - project architecture |
| `LICENSE`             | MIT License                      |

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review security advisories
- Rotate API keys quarterly
- Monitor error logs
- Check bot permissions

### Monitoring Metrics

- Bot uptime
- Fragment creation rate
- API error rate
- Response time
- Memory/CPU usage

## Support and Resources

### Internal

- [Usable Documentation](https://usable.dev/docs)
- [Discord.js Guide](https://discordjs.guide)
- Repository Issues

### External

- Discord Developer Portal
- TypeScript Documentation
- Node.js Best Practices

## License

MIT License - See `LICENSE` file for details.

## Contributors

Built by Flowcore with ❤️

---

**Last Updated**: October 15, 2025 **Version**: 1.0.0
