FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json
RUN npm ci --omit=dev --workspace=@shopeasy/api --include-workspace-root=false
COPY api/src ./api/src
EXPOSE 4000
USER node
CMD ["node", "api/src/server.js"]
