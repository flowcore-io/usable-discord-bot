# Use Bun's official Docker image
FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies
FROM base AS install

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Production stage
FROM base AS release

WORKDIR /app

# Copy dependencies from install stage
COPY --from=install /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001

# Change ownership
RUN chown -R bunuser:bunuser /app

# Switch to non-root user
USER bunuser

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run --eval "console.log('healthy')" || exit 1

# Start the bot
CMD ["bun", "run", "src/index.ts"]

