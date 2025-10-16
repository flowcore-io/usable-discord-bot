/**
 * 🏷️ Thread Update Handler
 *
 * Syncs Discord forum changes to Usable fragments in real-time.
 *
 * Flow:
 * 1. Check if it's a tracked forum thread
 * 2. Find the fragment ID from the bot's message (database-free!)
 * 3. Detect what changed (title, tags, etc.)
 * 4. Build update payload with new values
 * 5. Sync to Usable
 *
 * What We Track:
 * - Title changes: "Bug report" → "URGENT: Bug report"
 * - Tag changes: Discord forum tags like "urgent", "bug", "feature"
 *
 * Tag Format: Discord tags are prefixed with `discord-tag:` to distinguish
 * them from other Usable tags. Example: `discord-tag:urgent`
 */

import type { ThreadChannel } from 'discord.js';
import { isForumTracked } from '../config/env.js';
import { usableApiService } from '../services/usable-api.service.js';
import { GUILD_FORUM } from '../types/discord.js';
import { logger } from '../utils/logger.js';

/**
 * Handle forum thread updates (tag changes, title changes, etc.)
 */
export async function handleThreadUpdate(
  oldThread: ThreadChannel,
  newThread: ThreadChannel
): Promise<void> {
  try {
    // Only process forum threads
    if (!newThread.parent || newThread.parent.type !== GUILD_FORUM) {
      return;
    }

    // Check if this forum is configured to be tracked
    if (!newThread.parentId || !isForumTracked(newThread.parentId)) {
      return;
    }

    // Find the fragment ID from the bot's previous message
    const fragmentId = await findFragmentIdInThread(newThread, newThread.client.user?.id);

    if (!fragmentId) {
      logger.debug('No fragment ID found for thread update, skipping', {
        threadId: newThread.id,
      });
      return;
    }

    // Check what changed
    const changes = detectChanges(oldThread, newThread);

    if (changes.length === 0) {
      return;
    }

    logger.info('Thread updated - syncing to Usable', {
      threadId: newThread.id,
      fragmentId,
      changes,
    });

    // Build update payload
    const updatePayload: {
      fragmentId: string;
      title?: string;
      tags?: string[];
    } = {
      fragmentId,
    };

    // Update title if it changed
    if (changes.includes('title')) {
      updatePayload.title = newThread.name;
      logger.info('Thread title changed', {
        oldTitle: oldThread.name,
        newTitle: newThread.name,
      });
    }

    // Update tags if they changed
    if (changes.includes('tags')) {
      const forumChannel = newThread.parent?.type === GUILD_FORUM ? newThread.parent : null;
      const discordTags = newThread.appliedTags
        .map((tagId) => {
          const tag = forumChannel?.availableTags.find((t) => t.id === tagId);
          return tag ? `discord-tag:${tag.name.toLowerCase().replace(/\s+/g, '-')}` : null;
        })
        .filter((tag): tag is string => tag !== null);

      // Combine with base tags
      updatePayload.tags = [
        ...usableApiService.generateTags({
          guildName: newThread.guild.name,
          channelName: newThread.parent?.name,
          threadName: newThread.name,
        }),
        ...discordTags,
        'repo:usable-discord-bot',
      ];

      logger.info('Thread tags changed', {
        oldTags: oldThread.appliedTags,
        newTags: newThread.appliedTags,
        usableTags: discordTags,
      });
    }

    // Update the fragment in Usable
    const success = await usableApiService.updateFragment(updatePayload);

    if (success) {
      logger.info('Successfully synced thread update to Usable', {
        threadId: newThread.id,
        fragmentId,
        changes,
      });
    } else {
      logger.error('Failed to sync thread update to Usable', {
        threadId: newThread.id,
        fragmentId,
        changes,
      });
    }
  } catch (error) {
    logger.error('Error handling thread update', {
      error,
      threadId: newThread.id,
    });
  }
}

/**
 * Find the fragment ID from the bot's previous message in the thread
 */
async function findFragmentIdInThread(
  thread: ThreadChannel,
  botUserId: string | undefined
): Promise<string | null> {
  try {
    if (!thread.isThread()) {
      return null;
    }

    const messages = await thread.messages.fetch({ limit: 50 });
    const botMessage = messages.find(
      (msg) => msg.author.id === botUserId && msg.content.includes('Fragment ID:')
    );

    if (!botMessage) {
      return null;
    }

    const match = botMessage.content.match(/Fragment ID: `([a-f0-9-]+)`/i);
    return match ? match[1] : null;
  } catch (error) {
    logger.error('Error finding fragment ID in thread', { error, threadId: thread.id });
    return null;
  }
}

/**
 * Detect what changed between old and new thread
 */
function detectChanges(oldThread: ThreadChannel, newThread: ThreadChannel): string[] {
  const changes: string[] = [];

  // Check title change
  if (oldThread.name !== newThread.name) {
    changes.push('title');
  }

  // Check tag changes
  const oldTags = new Set(oldThread.appliedTags);
  const newTags = new Set(newThread.appliedTags);

  const tagsChanged =
    oldTags.size !== newTags.size || ![...oldTags].every((tag) => newTags.has(tag));

  if (tagsChanged) {
    changes.push('tags');
  }

  // Could add more checks here:
  // - archived status
  // - locked status
  // - auto-archive duration
  // etc.

  return changes;
}
