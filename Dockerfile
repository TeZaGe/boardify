# --- Étape 1 : Installation des dépendances ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copie des fichiers de dépendances
COPY package.json package-lock.json ./
COPY .npmrc ./

# Installation propre des dépendances avec contournement des conflits de versions
RUN npm ci

# --- Étape 2 : Construction du projet (Build) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génération des types Prisma Client pour le build
RUN npx prisma generate

# Build de l'application Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Étape 3 : Runner de production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Récupération des ressources indispensables du build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Next.js standalone génère un point d'entrée server.js
CMD ["node", "server.js"]
