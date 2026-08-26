# =============================================================================
# Новый Минерал (витрина) — многоступенчатый Dockerfile: Next.js 16 standalone + npm
# =============================================================================
# Витрина — headless-потребитель Storefront API Admik. Итоговый образ содержит
# только standalone-вывод Next.js и запускается от непривилегированного пользователя.
# =============================================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- deps: установка зависимостей (кешируется отдельно) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build: сборка в standalone ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* инлайнятся в клиентский бандл на этапе сборки → build-arg.
ARG NEXT_PUBLIC_ADMIK_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_ADMIK_API_URL=$NEXT_PUBLIC_ADMIK_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

# --- runner: финальный минимальный образ ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
