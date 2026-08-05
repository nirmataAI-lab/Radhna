FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace dependencies
COPY package*.json ./
COPY database/prisma ./database/prisma
COPY database/package*.json ./database/
COPY services/backend-api/package*.json ./services/backend-api/
COPY packages/shared-types ./packages/shared-types

# Install dependencies across workspaces
RUN npm ci

# Copy source files
COPY database ./database
COPY services/backend-api ./services/backend-api

# Generate Prisma Client & Build shared packages and NestJS backend
RUN cd database && npx prisma generate
RUN cd packages/shared-types && npm run build || true
RUN cd services/backend-api && npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/services/backend-api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/backend-api/package.json ./
COPY --from=builder /app/database/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]
