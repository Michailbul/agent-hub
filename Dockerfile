FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g tsup typescript && npm run build
EXPOSE 4001
CMD ["node", "dist/cli.js", "--no-open"]
