FROM node:22-alpine AS builder
WORKDIR /app

# Install root deps
COPY package*.json ./
RUN npm install

# Install client deps
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source and build (server + client in one step)
COPY . .
RUN npm run build

# ── Production image ──
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-client ./dist-client
EXPOSE 4001
CMD ["node", "dist/cli.js", "--no-open"]
