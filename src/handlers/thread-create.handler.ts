/**
 * 📝 Thread Create Handler
 *
 * This is the MAIN FLOW - where Discord posts become Usable fragments!
 *
 * Flow:
 * 1. Check if it's a forum thread (not a regular text channel thread)
 * 2. Check if this forum is configured to be tracked (via DISCORD_FORUM_MAPPINGS)
 * 3. Get the fragment type for this forum (Issue, Feature Request, etc.)
 * 4. Fetch the starter message (the initial post content)
 * 5. Create fragment in Usable with all the Discord metadata
 * 6. Reply in Discord with the fragment ID (this is our "database"!)
 *
 * Key insight: We store the fragment ID in Discord itself, so no external
 * database is needed. The bot's own message becomes the link!
 */

import type { Message, ThreadChannel } from 'discord.js';
import { env, getFragmentTypeForForum, isForumTracked } from '../config/env.js';
import { usableApiService } from '../services/usable-api.service.js';
import { GUILD_FORUM } from '../types/discord.js';
import { logger } from '../utils/logger.js';

/**
 * Handle new forum thread creation
 */
export async function handleThreadCreate(thread: ThreadChannel): Promise<void> {
  try {
    // Only process forum threads
    if (!thread.parent || thread.parent.type !== GUILD_FORUM) {
      logger.debug('Skipping non-forum thread', { threadId: thread.id });
      return;
    }

    // Check if this forum is configured to be tracked
    if (!thread.parentId || !isForumTracked(thread.parentId)) {
      logger.debug('Forum not configured for tracking', {
        threadId: thread.id,
        forumId: thread.parentId,
        forumName: thread.parent.name,
      });
      return;
    }

    // Get the fragment type for this forum
    const fragmentTypeId = getFragmentTypeForForum(thread.parentId);
    if (!fragmentTypeId) {
      logger.error('Forum is tracked but no fragment type found', {
        threadId: thread.id,
        forumId: thread.parentId,
      });
      return;
    }

    logger.info('New forum thread created', {
      threadId: thread.id,
      threadName: thread.name,
      channelId: thread.parentId,
      channelName: thread.parent.name,
    });

    // Fetch the starter message
    const starterMessage = await fetchStarterMessage(thread);
    if (!starterMessage) {
      logger.warn('Could not fetch starter message for thread', { threadId: thread.id });
      return;
    }

    // Create fragment in Usable
    const fragment = await usableApiService.createFragment({
      title: thread.name,
      content: usableApiService.formatThreadContent(
        starterMessage.author.username,
        starterMessage.content,
        {
          threadName: thread.name,
          channelName: thread.parent.name,
          guildName: thread.guild.name,
          timestamp: starterMessage.createdAt,
        }
      ),
      workspaceId: env.USABLE_WORKSPACE_ID,
      fragmentTypeId: fragmentTypeId,
      summary: `Forum post by ${starterMessage.author.username}: ${thread.name}`,
      tags: [
        ...usableApiService.generateTags({
          guildName: thread.guild.name,
          channelName: thread.parent.name,
          threadName: thread.name,
        }),
        'repo:usable-discord-bot',
      ],
      repository: 'usable-discord-bot',
    });

    if (fragment) {
      // Reply to the thread with the fragment ID
      await thread.send(
        `✅ **Issue registered in Usable!**
        📝 Fragment ID: \`${fragment.fragmentId}\`
        
        📌 Title: ${thread.name}
        _Your post has been automatically logged. Updates to this thread will be tracked._`
      );

      logger.info('Successfully created fragment and notified thread', {
        threadId: thread.id,
        fragmentId: fragment.fragmentId,
      });
    } else {
      await thread.send(
        `❌ **Failed to register issue in Usable**
          _There was an error creating the fragment. Please try again or contact support._`
      );
    }
  } catch (error) {
    logger.error('Error handling thread creation', {
      error,
      threadId: thread.id,
    });
  }
}

/**
 * Fetch the starter message of a thread
 */
async function fetchStarterMessage(thread: ThreadChannel): Promise<Message | null> {
  try {
    // For forum threads, the starter message has the same ID as the thread
    if (thread.parent?.type === GUILD_FORUM) {
      const starterMessage = await thread.fetchStarterMessage();
      return starterMessage;
    }

    // Fallback: fetch the first message
    const messages = await thread.messages.fetch({ limit: 1 });
    return messages.first() || null;
  } catch (error) {
    logger.error('Error fetching starter message', {
      error,
      threadId: thread.id,
    });
    return null;
  }
}
