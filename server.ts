import { spawn } from "child_process";
import { join } from "path";
import { unlinkSync, existsSync, statSync } from "fs";
import { randomUUID } from "crypto";

const PORT = parseInt(process.env.PORT || "3333", 10);
const PUBLIC_DIR = join(import.meta.dir, "public");

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\?%*:|"<>]/g, "_").trim().substring(0, 80) || "video_cut";
}

function runCommand(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Static Files
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const htmlFile = Bun.file(join(PUBLIC_DIR, "index.html"));
      return new Response(htmlFile, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // API: Video Info
    if (url.pathname === "/api/info") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        return Response.json({ error: "Parameter URL wajib diisi" }, { status: 400 });
      }

      try {
        const { stdout, stderr, code } = await runCommand("yt-dlp", [
          "--dump-single-json",
          "--no-warnings",
          "--no-playlist",
          targetUrl,
        ]);

        if (code !== 0) {
          console.error("yt-dlp error:", stderr);
          return Response.json({ error: "Gagal mengambil info video. Periksa URL YouTube Anda." }, { status: 400 });
        }

        const data = JSON.parse(stdout);
        return Response.json({
          id: data.id,
          title: data.title,
          duration: data.duration,
          durationFormatted: formatSeconds(data.duration || 0),
          thumbnail: data.thumbnail,
          uploader: data.uploader || data.channel,
        });
      } catch (err: any) {
        return Response.json({ error: err.message || "Gagal memproses permintaan" }, { status: 500 });
      }
    }

    // API: Video Cut / Trim
    if (url.pathname === "/api/trim") {
      const targetUrl = url.searchParams.get("url");
      const startTime = url.searchParams.get("start") || "0";
      const endTime = url.searchParams.get("end");
      const format = (url.searchParams.get("format") || "mp4").toLowerCase();
      const customTitle = url.searchParams.get("title");

      if (!targetUrl || !endTime) {
        return Response.json({ error: "Parameter url, start, dan end wajib diisi." }, { status: 400 });
      }

      const ext = format === "mp3" ? "mp3" : "mp4";
      const fileId = randomUUID();
      const tempPath = `/tmp/yt-cutter-${fileId}.${ext}`;

      const sectionArg = `*${startTime}-${endTime}`;
      const args: string[] = [
        "--no-playlist",
        "--download-sections",
        sectionArg,
        "--force-keyframes-at-cuts",
        "--js-runtimes",
        "bun:bun",
      ];

      if (format === "mp3") {
        args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
      } else {
        args.push(
          "-f",
          "bv*[protocol^=http]+ba[protocol^=http]/b[protocol^=http]/bv*+ba/b",
          "--merge-output-format",
          "mp4"
        );
      }

      args.push("-o", tempPath, targetUrl);

      console.log(`[TRIM] Memproses: ${targetUrl} [${sectionArg}] -> ${ext}`);

      try {
        const { stderr, code } = await runCommand("yt-dlp", args);

        if (code !== 0 || !existsSync(tempPath)) {
          console.error("yt-dlp cut failed:", stderr);
          return Response.json(
            { error: "Gagal memotong video. Periksa kembali rentang waktu atau URL video." },
            { status: 500 }
          );
        }

        const file = Bun.file(tempPath);
        const stats = statSync(tempPath);
        const filename = `${sanitizeFilename(customTitle || "youtube_cut")}_${startTime}-${endTime}.${ext}`;

        const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";

        // Buat stream dan jadwalkan pembersihan file setelah respons selesai
        const responseStream = file.stream();

        // Bersihkan file setelah sedikit delay atau setelah stream dikonsumsi
        setTimeout(() => {
          if (existsSync(tempPath)) {
            try {
              unlinkSync(tempPath);
              console.log(`[CLEANUP] File sementara dihapus: ${tempPath}`);
            } catch (e) {
              console.error("Gagal menghapus temp file:", e);
            }
          }
        }, 15000); // 15 detik cukup untuk memulai buffering transfer

        return new Response(responseStream, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
            "Content-Length": stats.size.toString(),
            "Cache-Control": "no-store",
          },
        });
      } catch (err: any) {
        if (existsSync(tempPath)) {
          try { unlinkSync(tempPath); } catch {}
        }
        return Response.json({ error: err.message || "Gagal memproses pemotongan video" }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 YT-Cutter server aktif di http://localhost:${PORT}`);
