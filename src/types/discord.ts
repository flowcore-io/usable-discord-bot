/**
 * Types for Discord interactions
 */

/**
 * Discord channel type for forums
 * https://discord.com/developers/docs/resources/channel
 */
export const GUILD_FORUM = 15;

export interface ThreadMetadata {
  threadId: string;
  threadName: string;
  channelId: string;
  authorId: string;
  authorUsername: string;
  messageContent: string;
  createdAt: Date;
}

export interface DiscordMessageContext {
  guildId?: string;
  guildName?: string;
  channelId: string;
  channelName?: string;
  threadId?: string;
  threadName?: string;
}
