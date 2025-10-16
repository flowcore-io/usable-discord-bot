import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { env } from '../config/env.js';
import type {
  CreateFragmentRequest,
  CreateFragmentResponse,
  UpdateFragmentRequest,
  UsableError,
} from '../types/usable.js';
import { logger } from '../utils/logger.js';

export class UsableApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.USABLE_API_URL,
      headers: {
        Authorization: `Bearer ${env.USABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Usable API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error('Usable API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Usable API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError<UsableError>) => {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error('Usable API Response Error', {
          status: error.response?.status,
          message: errorMessage,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new memory fragment in Usable
   */
  async createFragment(request: CreateFragmentRequest): Promise<CreateFragmentResponse | null> {
    try {
      logger.info('Creating Usable fragment', { title: request.title });

      const response = await this.client.post<CreateFragmentResponse>('/memory-fragments', request);

      logger.info('Successfully created Usable fragment', {
        fragmentId: response.data.fragmentId,
        title: response.data.title,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<UsableError>;
        logger.error('Failed to create Usable fragment', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.message || axiosError.message,
          title: request.title,
        });
      } else {
        logger.error('Unexpected error creating Usable fragment', error);
      }
      return null;
    }
  }

  /**
   * Update an existing memory fragment in Usable
   */
  async updateFragment(request: UpdateFragmentRequest): Promise<boolean> {
    try {
      logger.info('Updating Usable fragment', { fragmentId: request.fragmentId });

      // Build the payload without fragmentId
      const { fragmentId, ...payload } = request;

      logger.debug('Update payload', {
        fragmentId,
        contentLength: payload.content?.length,
        hasContent: !!payload.content,
        contentPreview: payload.content?.substring(0, 200),
        hasPatchOps: !!payload.patchOperations,
        patchOpsCount: payload.patchOperations?.length,
        fullPayload: JSON.stringify(payload, null, 2),
      });

      await this.client.patch(`/memory-fragments/${fragmentId}`, payload);

      logger.info('Successfully updated Usable fragment', {
        fragmentId: fragmentId,
      });

      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<UsableError>;
        logger.error('Failed to update Usable fragment', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.message || axiosError.message,
          data: axiosError.response?.data,
          fragmentId: request.fragmentId,
        });
      } else {
        logger.error('Unexpected error updating Usable fragment', error);
      }
      return false;
    }
  }

  /**
   * Format Discord thread message for Usable (initial creation)
   */
  formatThreadContent(
    authorUsername: string,
    messageContent: string,
    metadata: {
      threadName?: string;
      channelName?: string;
      guildName?: string;
      timestamp?: Date;
    }
  ): string {
    const timestamp = metadata.timestamp?.toISOString() || new Date().toISOString();

    let content = '## Discord Thread Message\n\n';

    if (metadata.guildName) {
      content += `**Server:** ${metadata.guildName}\n`;
    }
    if (metadata.channelName) {
      content += `**Channel:** ${metadata.channelName}\n`;
    }
    if (metadata.threadName) {
      content += `**Thread:** ${metadata.threadName}\n`;
    }

    content += `**Author:** ${authorUsername}\n`;
    content += `**Posted:** ${timestamp}\n\n`;
    content += `---\n\n${messageContent}`;

    return content;
  }

  /**
   * Format complete thread conversation for Usable (updates)
   */
  formatThreadUpdate(
    conversationContent: string,
    metadata: {
      threadName?: string;
      channelName?: string;
      guildName?: string;
      timestamp?: Date;
    }
  ): string {
    let content = '## Discord Thread Conversation\n\n';

    if (metadata.guildName) {
      content += `**Server:** ${metadata.guildName}\n`;
    }
    if (metadata.channelName) {
      content += `**Channel:** ${metadata.channelName}\n`;
    }
    if (metadata.threadName) {
      content += `**Thread:** ${metadata.threadName}\n`;
    }
    content += `**Last Updated:** ${metadata.timestamp?.toISOString() || new Date().toISOString()}\n\n`;
    content += `---\n\n${conversationContent}`;

    return content;
  }

  /**
   * Generate tags from Discord context
   */
  generateTags(context: {
    guildName?: string;
    channelName?: string;
    threadName?: string;
  }): string[] {
    const tags = ['discord', 'forum-post'];

    if (context.guildName) {
      tags.push(`server:${context.guildName.toLowerCase().replace(/\s+/g, '-')}`);
    }
    if (context.channelName) {
      tags.push(`channel:${context.channelName.toLowerCase().replace(/\s+/g, '-')}`);
    }

    return tags;
  }
}

export const usableApiService = new UsableApiService();
