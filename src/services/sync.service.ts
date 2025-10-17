/**
 * 🔄 Forum Sync Service
 *
 * Handles retroactive syncing of forum threads that weren't processed.
 * Detects unprocessed threads by checking for bot's reply message.
 */

import type { Client, ForumChannel, ThreadChannel } from 'discord.js';
import { env, getFragmentTypeForForum } from '../config/env.js';
import { usableApiService } from '../services/usable-api.service.js';
import { GUILD_FORUM } from '../types/discord.js';
import { retryDiscordApi } from '../utils/discord-retry.js';
import { logger } from '../utils/logger.js';

export interface SyncOptions {
  maxAgeHours?: number;
  limit?: number;
  dryRun?: boolean;
}

export interface SyncResult {
  scannedThreads: number;
  unprocessedThreads: number;
  processedThreads: number;
  failedThreads: number;
  skippedThreads: number;
  errors: Array<{ threadId: string; error: string }>;
}

export async function syncAllForums(
  client: Client,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    scannedThreads: 0,
    unprocessedThreads: 0,
    processedThreads: 0,
    failedThreads: 0,
    skippedThreads: 0,
    errors: [],
  };

  for (const forumId of Object.keys(env.DISCORD_FORUM_MAPPINGS)) {
    const forumResult = await syncForum(client, forumId, options);
    result.scannedThreads += forumResult.scannedThreads;
    result.unprocessedThreads += forumResult.unprocessedThreads;
    result.processedThreads += forumResult.processedThreads;
    result.failedThreads += forumResult.failedThreads;
    result.skippedThreads += forumResult.skippedThreads;
    result.errors.push(...forumResult.errors);
  }

  return result;
}

export async function syncForum(
  client: Client,
  forumId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const { maxAgeHours = 24, limit = 50, dryRun = false } = options;
  const result: SyncResult = {
    scannedThreads: 0,
    unprocessedThreads: 0,
    processedThreads: 0,
    failedThreads: 0,
    skippedThreads: 0,
    errors: [],
  };

  if (!getFragmentTypeForForum(forumId)) {
    logger.warn('Forum not configured', { forumId });
    return result;
  }

  const channel = await client.channels.fetch(forumId);
  if (!channel || channel.type !== GUILD_FORUM) return result;

  const forum = channel as ForumChannel;
  const activeThreads = await forum.threads.fetchActive();
  const archivedThreads = await forum.threads.fetchArchived({ limit });
  const allThreads = [...activeThreads.threads.values(), ...archivedThreads.threads.values()];

  const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const recentThreads = allThreads.filter(
    (thread) => thread.createdTimestamp && thread.createdTimestamp > cutoffTime
  );

  result.scannedThreads = recentThreads.length;

  for (const thread of recentThreads) {
    const isProcessed = await isThreadProcessed(thread, client.user?.id || '');
    if (isProcessed) {
      result.skippedThreads++;
      continue;
    }

    result.unprocessedThreads++;
    if (dryRun) continue;

    const success = await processThread(thread, forum);
    if (success) result.processedThreads++;
    else result.failedThreads++;
  }

  return result;
}

export async function syncThread(
  client: Client,
  threadId: string,
  forceReprocess = false
): Promise<boolean> {
  const thread = (await client.channels.fetch(threadId)) as ThreadChannel;
  if (!thread?.isThread() || !thread.parent || thread.parent.type !== GUILD_FORUM) return false;

  if (!forceReprocess) {
    const isProcessed = await isThreadProcessed(thread, client.user?.id || '');
    if (isProcessed) return true;
  }

  return await processThread(thread, thread.parent as ForumChannel);
}

async function isThreadProcessed(thread: ThreadChannel, botUserId: string): Promise<boolean> {
  try {
    const messages = await thread.messages.fetch({ limit: 10 });
    return messages.some(
      (msg) =>
        msg.author.id === botUserId &&
        (msg.content.includes('✅ **Issue registered in Usable!**') ||
          msg.content.includes('Fragment ID:'))
    );
  } catch {
    return true;
  }
}

async function processThread(thread: ThreadChannel, forum: ForumChannel): Promise<boolean> {
  const fragmentTypeId = getFragmentTypeForForum(forum.id);
  if (!fragmentTypeId) return false;

  const starterMessage = await retryDiscordApi(() => thread.fetchStarterMessage(), {
    context: thread.id,
  });
  if (!starterMessage) return false;

  const fragment = await usableApiService.createFragment({
    title: thread.name,
    content: usableApiService.formatThreadContent(
      starterMessage.author.username,
      starterMessage.content,
      {
        threadName: thread.name,
        channelName: forum.name,
        guildName: thread.guild.name,
        timestamp: starterMessage.createdAt,
      }
    ),
    workspaceId: env.USABLE_WORKSPACE_ID,
    fragmentTypeId,
    summary: `Forum post by ${starterMessage.author.username}: ${thread.name}`,
    tags: [
      ...usableApiService.generateTags({
        guildName: thread.guild.name,
        channelName: forum.name,
        threadName: thread.name,
      }),
      'repo:usable-discord-bot',
      'retroactive-sync',
    ],
    repository: 'usable-discord-bot',
  });

  if (fragment) {
    await thread.send(
      `✅ **Issue registered in Usable!** _(retroactive sync)_
📝 Fragment ID: \`${fragment.fragmentId}\`

📌 Title: ${thread.name}
_This post was processed during a sync operation._`
    );
    return true;
  }

  return false;
}
