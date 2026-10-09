FROM oven/bun:alpine
RUN apk add --no-cache yt-dlp ffmpeg

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY . .

EXPOSE 3333
ENV PORT=3333

CMD ["bun", "run", "server.ts"]
