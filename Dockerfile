FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
RUN mkdir -p /app/data && chown -R node:node /app
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "dist/server.cjs"]
