/**
 * 🔄 Discord API Retry Utility
 *
 * Discord's API suffers from eventual consistency issues. Some resources
 * (like starter messages) aren't immediately available when events fire.
 *
 * This utility provides exponential backoff retry logic specifically for
 * Discord API error code 10008 (Unknown Message).
 */

import { logger } from './logger.js';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay in milliseconds for each retry attempt (default: [500, 1000, 2000]) */
  delays?: number[];
  /** Context identifier for logging (e.g., threadId) */
  context?: string;
  /** Whether to only retry on error code 10008 (default: true) */
  onlyRetryUnknownMessage?: boolean;
}

/**
 * Execute a Discord API call with exponential backoff retry logic
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function, or null if all retries fail
 *
 * @example
 * ```typescript
 * const message = await retryDiscordApi(
 *   () => thread.fetchStarterMessage(),
 *   { context: thread.id }
 * );
 * ```
 */
export async function retryDiscordApi<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  const {
    maxRetries = 3,
    delays = [500, 1000, 2000],
    context = 'unknown',
    onlyRetryUnknownMessage = true,
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();

      // Log success if we needed retries
      if (attempt > 0) {
        logger.info('Discord API call succeeded after retry', {
          context,
          attempt: attempt + 1,
        });
      }

      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: number }).code
          : undefined;

      // Check if we should retry
      const shouldRetry = onlyRetryUnknownMessage
        ? errorCode === 10008 // Unknown Message
        : true;

      if (shouldRetry && !isLastAttempt) {
        const delay = delays[attempt] || delays[delays.length - 1];
        logger.warn('Discord API call failed, retrying...', {
          context,
          attempt: attempt + 1,
          delayMs: delay,
          errorCode,
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Give up - either last attempt or non-retryable error
      logger.error('Discord API call failed after retries', {
        error,
        context,
        attempt: attempt + 1,
        errorCode,
      });
      return null;
    }
  }

  return null;
}
