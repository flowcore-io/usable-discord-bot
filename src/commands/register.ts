/**
 * 📝 Slash Command Registration
 *
 * Registers Discord slash commands with the Discord API.
 * Commands are registered globally and available in all servers the bot is in.
 */

import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Define slash commands
 */
const commands = [
  // /sync-forum - Sync a specific thread by ID
  new SlashCommandBuilder()
    .setName('sync-forum')
    .setDescription('Sync a forum thread to Usable (auto-detects current thread)')
    .addStringOption((option) =>
      option
        .setName('thread_id')
        .setDescription('Thread ID (leave empty to sync current thread)')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('force')
        .setDescription('Force reprocess even if already synced (default: false)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  // /sync-all-tracked - Sync all tracked forums
  new SlashCommandBuilder()
    .setName('sync-all-tracked')
    .setDescription('Sync recent threads from all tracked forums')
    .addStringOption((option) =>
      option
        .setName('forum_id')
        .setDescription('Forum ID to sync (leave empty to sync all forums)')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('max_age_hours')
        .setDescription('Only sync threads newer than this (hours, default: 24)')
        .setMinValue(1)
        .setMaxValue(720)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Max threads to process per forum (default: 50)')
        .setMinValue(1)
        .setMaxValue(200)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('dry_run')
        .setDescription('Preview what would be synced without actually doing it (default: false)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  // /list-tracked - Show configured forums
  new SlashCommandBuilder()
    .setName('list-tracked')
    .setDescription('List all forums configured for tracking')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),
].map((command) => command.toJSON());

/**
 * Register slash commands with Discord
 */
export async function registerSlashCommands(): Promise<void> {
  try {
    logger.info('Registering slash commands...', {
      commandCount: commands.length,
      commands: commands.map((c) => c.name),
    });

    const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);

    // Register commands globally
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commands,
    });

    logger.info('Successfully registered slash commands', {
      commandCount: commands.length,
    });
  } catch (error) {
    logger.error('Failed to register slash commands', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
