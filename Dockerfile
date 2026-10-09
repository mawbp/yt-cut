FROM oven/bun:alpine

RUN apk add --no-cache python3 curl ffmpeg && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY . .

EXPOSE 3333
ENV PORT=3333

CMD ["bun", "run", "server.ts"]
