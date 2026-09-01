# syntax=docker/dockerfile:1

# better-sqlite3 needs a native build toolchain; bookworm-slim (glibc) keeps
# native addon behavior consistent between build and runtime stages.
FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma7.config.ts ./prisma7.config.ts
ENV DATABASE_URL="file:./scratch.db"
# Warms the Prisma engine binaries into node_modules while the build still has
# network access — the runtime container has none, so this must happen now.
RUN npx prisma generate && npx prisma migrate deploy && rm -f scratch.db

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl gosu \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/bank.db"
ENV PORT=3000

RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs \
  && mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/app/generated ./app/generated
COPY package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

EXPOSE 3000

# Stays root so the entrypoint can fix ownership of the bind-mounted ./data
# volume (created by Docker as root) before dropping to the nextjs user.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
