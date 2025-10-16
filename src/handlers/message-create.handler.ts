/**
 * 💬 Message Create Handler
 *
 * Tracks replies in forum threads for fragment updates.
 *
 * Flow:
 * 1. Ignore bot messages (don't track our own replies!)
 * 2. Check if message is in a forum thread
 * 3. Check if this forum is configured to be tracked
 * 4. Find the fragment ID from the bot's previous message (database-free!)
 * 5. [TODO] Update the fragment with the new reply
 *
 * Database-Free Magic: Instead of querying a database, we search the
 * thread's messages for our bot's confirmation message. It contains the
 * fragment ID in the format: Fragment ID: `uuid`
 *
 * Current Status: Update feature is temporarily disabled due to a
 * server-side API bug (returns 500 "Failed to create session context").
 * The detection and ID lookup work perfectly - just waiting on the fix!
 */

import type { Message } from 'discord.js';
import { isForumTracked } from '../config/env.js';
import { GUILD_FORUM } from '../types/discord.js';
import { logger } from '../utils/logger.js';

/**
 * Handle new messages in threads
 * Updates Usable fragments when threads receive replies
 */
export async function handleMessageCreate(message: Message): Promise<void> {
  try {
    // Ignore bot messages
    if (message.author.bot) {
      return;
    }

    // Check if message is in a thread
    if (!message.channel.isThread()) {
      return;
    }

    const thread = message.channel;

    // Only process forum threads
    if (!thread.parent || thread.parent.type !== GUILD_FORUM) {
      return;
    }

    // Check if this forum is configured to be tracked
    if (!thread.parentId || !isForumTracked(thread.parentId)) {
      return;
    }

    logger.debug('New message in forum thread', {
      threadId: thread.id,
      threadName: thread.name,
      authorId: message.author.id,
      authorUsername: message.author.username,
      messageLength: message.content.length,
    });

    // Find the bot's message containing the fragment ID
    const fragmentId = await findFragmentIdInThread(thread, message.client.user?.id);

    if (!fragmentId) {
      logger.debug('No fragment ID found in thread, skipping update', {
        threadId: thread.id,
      });
      return;
    }

    logger.info('Thread reply detected - fragment already tracked', {
      threadId: thread.id,
      fragmentId,
      messageId: message.id,
      author: message.author.username,
    });

    // TODO: Implement fragment updates
    // Currently disabled due to API limitations
    // The fragment has already been created and is being tracked
    // Future: Append new messages to the fragment content
  } catch (error) {
    logger.error('Error handling message creation', {
      error,
      messageId: message.id,
    });
  }
}

/**
 * Find fragment ID from bot's message in the thread
 * Uses Discord messages as the "database" - genius! 🧠
 */
async function findFragmentIdInThread(
  thread: Message['channel'] & { isThread(): boolean },
  botUserId: string | undefined
): Promise<string | null> {
  try {
    if (!thread.isThread()) {
      return null;
    }

    // Fetch messages from the thread
    const messages = await thread.messages.fetch({ limit: 50 });

    // Find bot's message containing fragment ID
    const botMessage = messages.find(
      (msg) => msg.author.id === botUserId && msg.content.includes('Fragment ID:')
    );

    if (!botMessage) {
      return null;
    }

    // Extract fragment ID using regex
    const match = botMessage.content.match(/Fragment ID: `([a-f0-9-]+)`/i);
    return match ? match[1] : null;
  } catch (error) {
    logger.error('Error finding fragment ID in thread', { error, threadId: thread.id });
    return null;
  }
}
