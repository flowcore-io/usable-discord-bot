/**
 * 🏥 Health Check Service
 *
 * Provides HTTP endpoints for Kubernetes health checks:
 * - /health/live  → Liveness probe (process is alive)
 * - /health/ready → Readiness probe (Discord bot is connected)
 *
 * Runs on port 3000 to satisfy K8s probe requirements
 */

import type { Client } from 'discord.js';
import { logger } from '../utils/logger.js';

export class HealthService {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private discordClient: Client | null = null;
  private readonly port: number;

  constructor(port = 3000) {
    this.port = port;
  }

  /**
   * Set the Discord client reference for readiness checks
   */
  setDiscordClient(client: Client): void {
    this.discordClient = client;
  }

  /**
   * Check if the Discord bot is ready
   */
  private isReady(): boolean {
    return this.discordClient?.isReady() ?? false;
  }

  /**
   * Start the health check HTTP server
   */
  start(): void {
    this.server = Bun.serve({
      port: this.port,
      fetch: (req) => {
        const url = new URL(req.url);

        // Liveness probe - always returns 200 if process is running
        if (url.pathname === '/health/live') {
          return new Response(
            JSON.stringify({
              status: 'ok',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Readiness probe - returns 200 only if Discord bot is connected
        if (url.pathname === '/health/ready') {
          const ready = this.isReady();
          return new Response(
            JSON.stringify({
              status: ready ? 'ready' : 'not_ready',
              discord_connected: ready,
              timestamp: new Date().toISOString(),
            }),
            {
              status: ready ? 200 : 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Default 404 for unknown paths
        return new Response('Not Found', { status: 404 });
      },
    });

    logger.info(`Health check server started on port ${this.port}`, {
      liveness_endpoint: '/health/live',
      readiness_endpoint: '/health/ready',
    });
  }

  /**
   * Stop the health check server
   */
  stop(): void {
    if (this.server) {
      this.server.stop();
      logger.info('Health check server stopped');
    }
  }
}
