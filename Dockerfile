# Node 24 current release
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Non-root user (recommended for GCP / Kubernetes)
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 apiuser
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=apiuser:nodejs package.json package-lock.json ./
COPY --chown=apiuser:nodejs index.js ./
COPY --chown=apiuser:nodejs src ./src
COPY --chown=apiuser:nodejs scripts ./scripts
RUN mkdir -p /app/public && chown apiuser:nodejs /app/public
USER apiuser
EXPOSE 8080
CMD ["node", "index.js"]
