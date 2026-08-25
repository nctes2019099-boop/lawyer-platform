# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:22-bookworm-slim AS base
# libsql needs no native toolchain; these keep image lean and help bcrypt/prisma.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY prisma ./prisma
# Install all deps (dev included) so `prisma generate` and the wasm patch run.
RUN npm ci
# The postinstall already runs: prisma generate + patch-prisma-wasm. Run once
# more defensively so the standalone copy has a patched WASM client.
RUN node scripts/patch-prisma-wasm.mjs || true

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time defaults; override at runtime with real secrets.
ARG DATABASE_URL="file:./prod.db"
ENV DATABASE_URL=$DATABASE_URL \
    NEXTAUTH_SECRET="build-time-placeholder-change-me"
RUN npm run build

# ---- Runner ----
FROM base AS runner
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# The standalone output bundles only traced production deps; Prisma's generated
# WASM client and the pure-JS runtime it requires must be present explicitly.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql

# Persistent data: SQLite DB + uploaded files.
RUN mkdir -p /data/uploads && chown -R nextjs:nodejs /data
ENV UPLOAD_DIR=/data/uploads \
    DATABASE_URL="file:/data/prod.db" \
    PORT=3000 \
    HOSTNAME=0.0.0.0

USER nextjs
EXPOSE 3000

# On boot: ensure DB schema + seed (idempotent), then start Next standalone.
CMD ["sh", "-c", "node scripts/init-db-sqlite.mjs && node scripts/seed-prod.mjs || true; exec node server.js"]
