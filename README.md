# ✂️ YT Cutter

A lightweight, blazing-fast web application to trim sections of YouTube videos and download them directly to your browser without storing any files on the server.

Powered by **[Bun](https://bun.sh/)**, **[yt-dlp](https://github.com/yt-dlp/yt-dlp)**, and **[FFmpeg](https://ffmpeg.org/)**.

---

## ✨ Features

- **⚡ Blazing Fast & Ultra Lightweight:** Built on Bun runtime with `< 25MB` RAM usage and instant startup.
- **🛡️ Zero Server Storage:** Processed video sections are streamed directly to the client browser's download manager. Temporary files are pruned automatically immediately after transfer.
- **🎯 Precise Trimming:**
  - YouTube player preview embedded in the page.
  - Interactive "Ambil Waktu Sekarang" buttons to stamp exact timestamps right while watching.
  - Manual input supports `HH:MM:SS`, `MM:SS`, or raw seconds.
- **🎵 Multi-Format Support:**
  - **MP4 Video** (High quality video + audio merge).
  - **MP3 Audio** (Extract trimmed audio only).
- **🎨 Modern & Responsive UI:** Clean dark mode interface built with Tailwind CSS.

---

## 📋 Prerequisites

Make sure the following tools are installed on your host system:

1. **Bun** (v1.0 or newer):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
2. **yt-dlp**:
   ```bash
   # Arch Linux:
   sudo pacman -S yt-dlp
   # Debian / Ubuntu:
   sudo apt install yt-dlp
   # macOS:
   brew install yt-dlp
   ```
3. **FFmpeg**:
   ```bash
   # Arch Linux:
   sudo pacman -S ffmpeg
   # Debian / Ubuntu:
   sudo apt install ffmpeg
   # macOS:
   brew install ffmpeg
   ```

---

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/yt-cutter.git
   cd yt-cutter
   ```

2. **Start the application:**
   ```bash
   bun run start
   ```

3. **Open in browser:**
   ```
   http://localhost:3333
   ```

---

## 🛠️ Development

Run in watch mode with automatic hot reload:

```bash
bun run dev
```

To run on a custom port:

```bash
PORT=8080 bun run start
```

---

## 🔌 API Endpoints

### 1. Fetch Video Metadata
```http
GET /api/info?url=<YOUTUBE_URL>
```
**Response:**
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "duration": 213,
  "durationFormatted": "03:33",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "uploader": "Rick Astley"
}
```

### 2. Trim & Stream Download
```http
GET /api/trim?url=<YOUTUBE_URL>&start=00:30&end=01:15&format=mp4&title=MyClip
```
Streams the trimmed `.mp4` or `.mp3` file directly with `Content-Disposition: attachment`.

---

## 📂 Project Structure

```
yt-cutter/
├── public/
│   └── index.html      # Frontend Single Page App (Tailwind CSS + YouTube Player)
├── server.ts           # Bun HTTP Server and yt-dlp process orchestration
├── package.json        # Project metadata and scripts
├── .gitignore          # Git ignore rules
└── README.md           # Documentation
```

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
