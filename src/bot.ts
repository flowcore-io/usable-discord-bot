/**
 * 🤖 Discord Bot Core
 *
 * This class manages the entire bot lifecycle:
 * - Creates Discord client with required intents
 * - Registers event handlers (thread create, message create, thread update)
 * - Handles bot startup and shutdown
 *
 * Architecture: Event-driven
 * Each handler does ONE thing well (create, update, or sync).
 * No shared state, clean separation of concerns.
 */

import { Client, Events, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { handleMessageCreate } from './handlers/message-create.handler.js';
import { handleReady } from './handlers/ready.handler.js';
import { handleThreadCreate } from './handlers/thread-create.handler.js';
import { handleThreadUpdate } from './handlers/thread-update.handler.js';
import { logger } from './utils/logger.js';

export class DiscordBot {
  private client: Client;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.registerEventHandlers();
  }

  /**
   * Register all event handlers
   *
   * This is where the magic happens! We listen to 3 key Discord events:
   *
   * 1. ThreadCreate  → New forum post → Create Usable fragment
   * 2. ThreadUpdate  → Tags/title change → Sync to Usable
   * 3. MessageCreate → Reply added → Update fragment (when API is fixed)
   *
   * Each handler is independent - no shared state, easy to test!
   */
  private registerEventHandlers(): void {
    // Ready event - fires once when bot successfully connects
    this.client.once(Events.ClientReady, (client) => {
      handleReady(client);
    });

    // Thread create event - fires when a new forum thread is created
    // This is the main entry point: creates the Usable fragment
    this.client.on(Events.ThreadCreate, async (thread) => {
      await handleThreadCreate(thread);
    });

    // Thread update event - fires when thread properties change
    // Syncs Discord tags and title changes to Usable
    this.client.on(Events.ThreadUpdate, async (oldThread, newThread) => {
      await handleThreadUpdate(oldThread, newThread);
    });

    // Message create event - fires when a new message is sent
    // Tracks replies for fragment updates (database-free tracking!)
    this.client.on(Events.MessageCreate, async (message) => {
      await handleMessageCreate(message);
    });

    // Error handling
    this.client.on(Events.Error, (error) => {
      logger.error('Discord client error', { error: error.message });
    });

    this.client.on(Events.Warn, (warning) => {
      logger.warn('Discord client warning', { warning });
    });

    // Process error handlers
    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled promise rejection', { error });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting Discord bot...');
      await this.client.login(env.DISCORD_BOT_TOKEN);
    } catch (error) {
      logger.error('Failed to start Discord bot', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      console.error('Raw error:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the bot gracefully
   */
  async stop(): Promise<void> {
    logger.info('Stopping Discord bot...');
    this.client.destroy();
    logger.info('Discord bot stopped');
  }
}
