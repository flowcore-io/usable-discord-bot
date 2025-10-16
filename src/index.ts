/**
 * 🚀 Application Entry Point
 *
 * This is where everything starts! The flow is simple:
 * 1. Create bot instance → Registers all event handlers
 * 2. Set up graceful shutdown → Clean disconnects on Ctrl+C
 * 3. Start the bot → Connects to Discord
 *
 * Production-ready with proper error handling and cleanup ✨
 */

import { DiscordBot } from './bot.js';
import { logger } from './utils/logger.js';

// Create and start the bot
const bot = new DiscordBot();

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  await bot.stop();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the bot
bot.start().catch((error) => {
  logger.error('Fatal error during bot startup', { error });
  process.exit(1);
});
