# Contributing to Usable Discord Bot

Thank you for your interest in contributing! This document provides guidelines
and instructions for contributing to the project.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/usable-discord-bot.git
   cd usable-discord-bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your test credentials
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Code Style

We use Biome for ultra-fast linting and formatting:

- **Check all (recommended)**: `bun run check`
- **Linting**: `bun run lint`
- **Auto-fix**: `bun run lint:fix`
- **Formatting**: `bun run format`

### Style Guidelines

- Use TypeScript for all new code
- Prefer `async/await` over callbacks
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use early returns to reduce nesting

### Example

```typescript
/**
 * Create a new memory fragment in Usable
 * @param request - Fragment creation request
 * @returns Created fragment or null on failure
 */
async function createFragment(
   request: CreateFragmentRequest,
): Promise<CreateFragmentResponse | null> {
   // Early return for validation
   if (!request.title) {
      logger.error("Fragment title is required");
      return null;
   }

   try {
      const response = await api.post("/fragments", request);
      return response.data;
   } catch (error) {
      logger.error("Failed to create fragment", { error });
      return null;
   }
}
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(handler): add support for thread updates
fix(api): handle rate limiting errors
docs(readme): update deployment instructions
refactor(logger): improve error formatting
```

## Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Follow style guidelines
   - Add tests if applicable

3. **Test Your Changes**
   ```bash
   bun run check
   bun run type-check
   bun run build
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear title and description
   - Reference related issues
   - Include screenshots if applicable

## Testing

Currently, the project focuses on manual testing. When adding features:

1. Test manually with a Discord test server
2. Verify Usable fragment creation
3. Check error handling and edge cases
4. Review logs for any issues

## Project Structure

```
src/
├── config/         # Configuration and environment
├── handlers/       # Discord event handlers
├── services/       # External service integrations
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── bot.ts          # Main bot client
└── index.ts        # Application entry point
```

## Adding New Features

### New Event Handler

1. Create handler in `src/handlers/`:
   ```typescript
   // src/handlers/reaction-add.handler.ts
   import { MessageReaction, User } from "discord.js";
   import { logger } from "../utils/logger.js";

   export async function handleReactionAdd(
      reaction: MessageReaction,
      user: User,
   ): Promise<void> {
      logger.info("Reaction added", {
         emoji: reaction.emoji.name,
         userId: user.id,
      });
      // Your logic here
   }
   ```

2. Register in `src/bot.ts`:
   ```typescript
   import { handleReactionAdd } from "./handlers/reaction-add.handler.js";

   this.client.on(Events.MessageReactionAdd, async (reaction, user) => {
      await handleReactionAdd(reaction, user);
   });
   ```

### New API Service

1. Create service in `src/services/`:
   ```typescript
   // src/services/analytics.service.ts
   export class AnalyticsService {
      async trackEvent(event: string, data: unknown): Promise<void> {
         // Implementation
      }
   }

   export const analyticsService = new AnalyticsService();
   ```

2. Use in handlers:
   ```typescript
   import { analyticsService } from "../services/analytics.service.js";

   await analyticsService.trackEvent("thread_created", { threadId });
   ```

## Documentation

When adding features:

1. Update `README.md` if user-facing
2. Add JSDoc comments to functions
3. Update `CONTRIBUTING.md` if process changes
4. Create or update type definitions

## Common Tasks

### Adding Environment Variables

1. Add to Zod schema in `src/config/env.ts`:
   ```typescript
   const envSchema = z.object({
      NEW_VARIABLE: z.string().min(1),
   });
   ```

2. Add to `.env.example`:
   ```env
   NEW_VARIABLE=example_value
   ```

3. Document in `README.md`:
   ```markdown
   | `NEW_VARIABLE` | Description | Yes/No | Default |
   ```

### Adding New Fragment Types

1. Add type ID to `.env.example`
2. Update Zod schema in `src/config/env.ts`
3. Use in handlers or services

## Questions?

- Open an issue for bugs or feature requests
- Contact the maintainers for guidance
- Check existing issues and PRs first

Thank you for contributing! 🎉
