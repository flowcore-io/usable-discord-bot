/**
 * 🚀 Application Entry Point
 *
 * This is where everything starts! The flow is simple:
 * 1. Create bot instance → Registers all event handlers
 * 2. Start health check server → For Kubernetes probes
 * 3. Set up graceful shutdown → Clean disconnects on Ctrl+C
 * 4. Start the bot → Connects to Discord
 *
 * Production-ready with proper error handling and cleanup ✨
 */

import { DiscordBot } from './bot.js';
import { env } from './config/env.js';
import { HealthService } from './services/health.service.js';
import { logger } from './utils/logger.js';

// Create bot and health service
const bot = new DiscordBot();
const healthService = new HealthService(env.HEALTH_PORT);

// Connect health service to bot for readiness checks
healthService.setDiscordClient(bot.getClient());

// Start health check server
healthService.start();

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  healthService.stop();
  await bot.stop();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the bot
bot.start().catch((error) => {
  logger.error('Fatal error during bot startup', { error });
  healthService.stop();
  process.exit(1);
});
