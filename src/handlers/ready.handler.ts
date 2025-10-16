import type { Client } from 'discord.js';
import { logger } from '../utils/logger.js';

/**
 * Handle bot ready event
 */
export function handleReady(client: Client<true>): void {
  logger.info('🤖 Discord bot is ready!', {
    username: client.user.tag,
    id: client.user.id,
    guilds: client.guilds.cache.size,
  });

  // Set bot activity status
  client.user.setPresence({
    activities: [
      {
        name: 'forum posts',
        type: 3, // WATCHING
      },
    ],
    status: 'online',
  });

  logger.info('Bot status set to online, watching forum posts');
}
