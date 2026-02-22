FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm install --legacy-peer-deps tsx && apk del python3 make g++
COPY --from=build /app/dist ./dist
COPY server ./server
COPY wireframes ./wireframes
RUN mkdir -p data uploads
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npx", "tsx", "server/index.ts"]
