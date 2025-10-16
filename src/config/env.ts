import { z } from 'zod';

// Bun automatically loads .env files, no need for dotenv package

// Forum mapping schema - maps Discord forum channel IDs to Usable fragment type IDs
const forumMappingSchema = z.record(
  z.string().min(1, 'Forum channel ID is required'),
  z.string().uuid('Fragment type ID must be a valid UUID')
);

// Environment variable schema
const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, 'Discord bot token is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'Discord client ID is required'),
  DISCORD_FORUM_MAPPINGS: z
    .string()
    .min(
      1,
      'Discord forum mappings are required (JSON object mapping forum IDs to fragment type IDs)'
    )
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        return forumMappingSchema.parse(parsed);
      } catch (_error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'DISCORD_FORUM_MAPPINGS must be a valid JSON object mapping forum IDs to fragment type UUIDs',
        });
        return z.NEVER;
      }
    }),
  USABLE_API_URL: z
    .string()
    .url('Usable API URL must be a valid URL')
    .default('https://api.usable.dev/api'),
  USABLE_API_KEY: z.string().min(1, 'Usable API key is required'),
  USABLE_WORKSPACE_ID: z.string().uuid('Usable workspace ID must be a valid UUID'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;

/**
 * Check if a forum channel is configured to be tracked
 */
export function isForumTracked(forumChannelId: string): boolean {
  return forumChannelId in env.DISCORD_FORUM_MAPPINGS;
}

/**
 * Get the fragment type ID for a forum channel
 */
export function getFragmentTypeForForum(forumChannelId: string): string | null {
  return env.DISCORD_FORUM_MAPPINGS[forumChannelId] || null;
}
