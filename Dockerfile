FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/package.json ./
COPY --from=builder --chown=appuser:appgroup /app/package-lock.json ./
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

USER appuser
EXPOSE 3000

CMD ["node", "dist/main.js"]
