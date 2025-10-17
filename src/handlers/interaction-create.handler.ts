/**
 * ⚔️ Interaction Create Handler (Slash Commands)
 *
 * Handles Discord slash commands for moderators/admins to manage forum syncing:
 * - /sync-thread <thread_id> - Sync a specific thread
 * - /sync-forum - Sync the current forum (all recent threads)
 * - /list-forums - Show configured forums
 *
 * Uses Discord's native permission system - only users with "Manage Messages"
 * permission can use these commands (typically moderators/admins).
 */

import {
  type ChatInputCommandInteraction,
  type Interaction,
  PermissionFlagsBits,
} from 'discord.js';
import { syncAllForums, syncForum, syncThread } from '../services/sync.service';
import { logger } from '../utils/logger';

/**
 * Handle interaction create events (slash commands)
 */
export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  // Only handle chat input commands (slash commands)
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const { commandName, user, guild } = interaction;

  logger.info('Slash command received', {
    commandName,
    userId: user.id,
    username: user.username,
    guildId: guild?.id,
  });

  try {
    // Check permissions - user must have "Manage Messages" permission
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: '❌ You need "Manage Messages" permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    switch (commandName) {
      case 'sync-forum':
        await handleSyncThread(interaction);
        break;
      case 'sync-all-tracked':
        await handleSyncForum(interaction);
        break;
      case 'list-tracked':
        await handleListForums(interaction);
        break;
      default:
        await interaction.reply({
          content: `❌ Unknown command: ${commandName}`,
          ephemeral: true,
        });
    }
  } catch (error) {
    logger.error('Error handling slash command', {
      commandName,
      error,
      userId: user.id,
    });

    // Try to reply with error
    const errorMessage = '❌ An error occurred while processing your command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}

/**
 * Handle /sync-forum command
 */
async function handleSyncThread(interaction: ChatInputCommandInteraction): Promise<void> {
  let threadId = interaction.options.getString('thread_id');

  // If no thread ID provided, try to auto-detect from current channel
  if (!threadId) {
    if (interaction.channel?.isThread()) {
      threadId = interaction.channel.id;
      logger.info('Auto-detected thread ID from current channel', { threadId });
    } else {
      await interaction.reply({
        content: '❌ Please provide a thread_id or run this command inside a forum thread.',
        ephemeral: true,
      });
      return;
    }
  }

  const forceReprocess = interaction.options.getBoolean('force') ?? false;

  // Defer reply since this might take a while
  await interaction.deferReply({ flags: 64 }); // 64 = Ephemeral

  logger.info('Syncing thread via slash command', {
    threadId,
    forceReprocess,
    userId: interaction.user.id,
  });

  const success = await syncThread(interaction.client, threadId, forceReprocess);

  if (success) {
    await interaction.editReply({
      content: '✅ Sync complete! Check the thread for the registration message.',
    });
  } else {
    await interaction.editReply({
      content: `❌ **Failed to sync thread**\n\n📝 Thread ID: \`${threadId}\`\n\nPossible reasons:\n- Thread doesn't exist\n- Thread is not in a forum\n- Forum is not configured for tracking\n- Thread already processed (use 'force: true' to reprocess)\n\nCheck bot logs for details.`,
    });
  }
}

/**
 * Handle /sync-forum command
 */
async function handleSyncForum(interaction: ChatInputCommandInteraction): Promise<void> {
  const forumId = interaction.options.getString('forum_id');
  const maxAgeHours = interaction.options.getInteger('max_age_hours') ?? 24;
  const limit = interaction.options.getInteger('limit') ?? 50;
  const dryRun = interaction.options.getBoolean('dry_run') ?? false;

  // Defer reply since this might take a while
  await interaction.deferReply({ flags: 64 }); // 64 = Ephemeral

  logger.info('Syncing forum via slash command', {
    forumId: forumId || 'all forums',
    maxAgeHours,
    limit,
    dryRun,
    userId: interaction.user.id,
  });

  // If no forum ID provided, sync all forums
  const result = forumId
    ? await syncForum(interaction.client, forumId, { maxAgeHours, limit, dryRun })
    : await syncAllForums(interaction.client, { maxAgeHours, limit, dryRun });

  // Build response
  const forumText = forumId ? `Forum \`${forumId}\`` : 'All configured forums';
  const statusEmoji = result.failedThreads > 0 ? '⚠️' : '✅';

  let response = `${statusEmoji} **Sync ${dryRun ? 'Preview' : 'Complete'}**\n\n`;
  response += `📊 **Results for ${forumText}**\n`;
  response += `• Scanned: ${result.scannedThreads} threads\n`;
  response += `• Unprocessed: ${result.unprocessedThreads} threads\n`;
  response += `• Processed: ${result.processedThreads} threads ${dryRun ? '(would be)' : ''}\n`;
  response += `• Skipped: ${result.skippedThreads} threads (already synced)\n`;
  response += `• Failed: ${result.failedThreads} threads\n`;

  if (result.errors.length > 0) {
    response += '\n**Errors:**\n';
    result.errors.slice(0, 3).forEach((err) => {
      response += `• Thread \`${err.threadId}\`: ${err.error}\n`;
    });
    if (result.errors.length > 3) {
      response += `_...and ${result.errors.length - 3} more errors. Check logs for details._\n`;
    }
  }

  if (dryRun) {
    response += '\n_This was a dry run. Use "dry_run: false" to actually process threads._';
  }

  await interaction.editReply({ content: response });
}

/**
 * Handle /list-forums command
 */
async function handleListForums(interaction: ChatInputCommandInteraction): Promise<void> {
  const { env } = await import('../config/env.js');

  const forums = Object.entries(env.DISCORD_FORUM_MAPPINGS);

  if (forums.length === 0) {
    await interaction.reply({
      content: '⚠️ No forums are configured for tracking.',
      ephemeral: true,
    });
    return;
  }

  let response = `📋 **Configured Forums** (${forums.length})\n\n`;
  response += 'These forums are tracked and can be synced:\n\n';

  for (const [forumId, fragmentTypeId] of forums) {
    try {
      // Try to fetch the forum name
      const channel = await interaction.client.channels.fetch(forumId);
      const forumName = channel && 'name' in channel ? `**${channel.name}**` : 'Unknown Forum';

      response += `• ${forumName}\n`;
      response += `  ├─ Forum ID: \`${forumId}\`\n`;
      response += `  └─ Fragment Type: \`${fragmentTypeId}\`\n\n`;
    } catch {
      // If we can't fetch the channel, just show the IDs
      response += `• Forum ID: \`${forumId}\`\n`;
      response += `  └─ Fragment Type: \`${fragmentTypeId}\`\n\n`;
    }
  }

  response += '\n_Only these forums will be synced. Other forums are ignored._';

  await interaction.reply({
    content: response,
    ephemeral: true,
  });
}
