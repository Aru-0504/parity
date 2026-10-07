FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY packages/shared ./packages/shared
RUN npm run build --workspace=@ismo/shared

COPY apps/api ./apps/api
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN npm run build --workspace=api

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && node apps/api/dist/index.js"]
