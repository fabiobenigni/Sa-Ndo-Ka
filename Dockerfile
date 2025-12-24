# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Inizializza il database durante il build (se non esiste)
RUN mkdir -p /app/data && \
    if [ ! -f "/app/data/sa-ndo-ka.db" ]; then \
      DATABASE_URL="file:./data/sa-ndo-ka.db" npx prisma db push --accept-data-loss --skip-generate || echo "Database init skipped"; \
    fi

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init, curl and OpenSSL libraries for Prisma
# For Prisma on Alpine, we need to ensure OpenSSL compatibility
RUN apk add --no-cache dumb-init curl openssl libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy start script and init script
COPY --chown=nextjs:nodejs start.sh /app/start.sh
RUN chmod +x /app/start.sh
COPY --chown=nextjs:nodejs scripts ./scripts
RUN chmod +x /app/scripts/detect-url.sh 2>/dev/null || true

# Create directories for uploads and database
RUN mkdir -p /app/uploads /app/data && \
    chown -R nextjs:nodejs /app/uploads /app/data

# Set correct permissions
RUN chown -R nextjs:nodejs /app

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Force Prisma to use binary engine to avoid OpenSSL issues on Alpine
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

WORKDIR /app

# Use dumb-init to handle signals properly
USER nextjs

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "/app/start.sh"]
