/**
 * 💬 Message Create Handler
 *
 * Tracks replies in forum threads and updates Usable fragments.
 *
 * Flow:
 * 1. Ignore bot messages (don't track our own replies!)
 * 2. Check if message is in a forum thread
 * 3. Check if this forum is configured to be tracked
 * 4. Find the fragment ID from the bot's previous message (database-free!)
 * 5. Fetch all messages in the thread
 * 6. Format as a conversation and update the fragment
 *
 * Database-Free Magic: Instead of querying a database, we search the
 * thread's messages for our bot's confirmation message. It contains the
 * fragment ID in the format: Fragment ID: `uuid`
 */

import type { Message } from 'discord.js';
import { isForumTracked } from '../config/env.js';
import { usableApiService } from '../services/usable-api.service.js';
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

    logger.info('Thread reply detected - updating fragment', {
      threadId: thread.id,
      fragmentId,
      messageId: message.id,
      author: message.author.username,
    });

    // Fetch all messages in the thread to build complete conversation
    const conversation = await buildThreadConversation(thread);

    if (!conversation) {
      logger.warn('Could not build thread conversation', {
        threadId: thread.id,
      });
      return;
    }

    // Update the fragment with the full conversation
    const success = await usableApiService.updateFragment({
      fragmentId,
      content: usableApiService.formatThreadUpdate(conversation, {
        threadName: thread.name,
        channelName: thread.parent?.name,
        guildName: thread.guild.name,
        timestamp: new Date(),
      }),
    });

    if (success) {
      logger.info('Successfully updated fragment with new reply', {
        threadId: thread.id,
        fragmentId,
        messageCount: conversation.split('\n---\n').length - 1,
      });
    } else {
      logger.error('Failed to update fragment', {
        threadId: thread.id,
        fragmentId,
      });
    }
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

/**
 * Build a formatted conversation from all messages in a thread
 * Excludes bot messages to keep the conversation clean
 */
async function buildThreadConversation(
  thread: Message['channel'] & { isThread(): boolean }
): Promise<string | null> {
  try {
    if (!thread.isThread()) {
      return null;
    }

    // Fetch all messages (Discord limits to 100 per request, good enough for most threads)
    const messages = await thread.messages.fetch({ limit: 100 });

    // Filter out bot messages and sort by timestamp (oldest first)
    const userMessages = messages
      .filter((msg) => !msg.author.bot)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    if (userMessages.size === 0) {
      return null;
    }

    // Format each message
    const formattedMessages = userMessages.map((msg) => {
      const timestamp = msg.createdAt.toISOString();
      return `### ${msg.author.username} - ${timestamp}\n\n${msg.content}`;
    });

    return formattedMessages.join('\n\n---\n\n');
  } catch (error) {
    logger.error('Error building thread conversation', { error, threadId: thread.id });
    return null;
  }
}
