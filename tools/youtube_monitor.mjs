import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { sendNotification } from "./notify.mjs";

const ROOT = "s:/AI_Tools/Remotion_Workspace";
const DATA_DIR = path.join(ROOT, "data");
const HISTORY_FILE = path.join(DATA_DIR, "youtube_history.json");
const DOWNLOADS_DIR = path.join(ROOT, "render_work", "youtube");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

export async function getLatestUploads(channelHandle = "@MShmsDin", limit = 5) {
  const urls = [
    `https://www.youtube.com/${channelHandle}/videos`,
    `https://www.youtube.com/${channelHandle}/streams`,
  ];

  const results = [];

  for (const url of urls) {
    const isStream = url.endsWith("/streams");
    try {
      const cmd = `yt-dlp --flat-playlist --playlist-end ${limit} --dump-json "${url}"`;
      const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
      const lines = output.trim().split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          const type = isStream || item.title?.includes("بث") || item.title?.includes("مباشر") ? "بث مباشر" : "درس";
          results.push({
            id: item.id,
            title: item.title,
            url: `https://www.youtube.com/watch?v=${item.id}`,
            type: item.title?.includes("شرح") || item.title?.includes("درس") ? "درس" : type,
            duration: item.duration || null,
            channel: channelHandle,
          });
        } catch {}
      }
    } catch (err) {
      console.error(`Error querying ${url}:`, err.message);
    }
  }

  // Deduplicate by ID
  const unique = [];
  const seen = new Set();
  for (const r of results) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      unique.push(r.id);
    }
  }

  return results.filter((r, idx) => results.findIndex(x => x.id === r.id) === idx);
}

export async function checkForNewVideos(channelHandle = "@MShmsDin") {
  const history = loadHistory();
  const latest = await getLatestUploads(channelHandle, 5);
  const newVideos = [];

  for (const item of latest) {
    if (!history[item.id]) {
      newVideos.push(item);
    }
  }

  return { newVideos, allLatest: latest };
}

export function downloadVideo(videoId, options = {}) {
  const { maxRes = 1080, audioOnly = false, outputDir = DOWNLOADS_DIR } = options;
  const outTemplate = path.join(outputDir, "%(title)s [%(id)s].%(ext)s");
  
  let formatArg = audioOnly
    ? `-x --audio-format mp3`
    : `-f "bestvideo[height<=${maxRes}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${maxRes}]/best" --merge-output-format mp4`;

  const cmd = `yt-dlp ${formatArg} -o "${outTemplate}" "https://www.youtube.com/watch?v=${videoId}"`;
  console.log(`Starting download for ${videoId}...`);
  execSync(cmd, { stdio: "inherit" });
  
  // Mark as downloaded in history
  const history = loadHistory();
  history[videoId] = {
    downloadedAt: new Date().toISOString(),
    status: "downloaded",
  };
  saveHistory(history);

  sendNotification({
    title: "تم تنزيل الفيديو بنجاح 📥",
    body: `اكتمل تنزيل الفيديو (${videoId}) في مجلد العمل.`,
    source: "راصد وتنزيل البثوث",
  });
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith("youtube_monitor.mjs")) {
  const action = process.argv[2] || "check";
  if (action === "check") {
    console.log("Checking for latest uploads from Sheikh's channel (@MShmsDin)...");
    checkForNewVideos().then(({ newVideos, allLatest }) => {
      console.log(`\nFound ${allLatest.length} recent items.`);
      if (newVideos.length === 0) {
        console.log("No brand new unseen videos (all known in history).");
      } else {
        console.log(`\n🆕 New unseen videos detected (${newVideos.length}):`);
        newVideos.forEach(v => {
          console.log(`- [${v.type}] ${v.title} (${v.url})`);
        });
      }
    });
  } else if (action === "auto") {
    console.log("Running Auto-Discovery & Download Mode...");
    checkForNewVideos().then(async ({ newVideos }) => {
      if (newVideos.length === 0) {
        console.log("Everything is up to date. No new videos to download.");
        return;
      }
      console.log(`Found ${newVideos.length} new videos. Starting automatic downloads...`);
      for (const v of newVideos) {
        console.log(`\n⬇️ Downloading [${v.type}]: ${v.title} (${v.id})...`);
        try {
          downloadVideo(v.id);
          console.log(`✅ Download finished successfully for: ${v.title}`);
        } catch (err) {
          console.error(`❌ Failed to download ${v.id}:`, err.message);
        }
      }
      console.log("\nAll new videos downloaded and recorded!");
    });
  } else if (action === "sync-history") {
    // Mark current videos as known without downloading
    getLatestUploads().then(latest => {
      const history = loadHistory();
      latest.forEach(v => {
        if (!history[v.id]) {
          history[v.id] = { title: v.title, type: v.type, discoveredAt: new Date().toISOString(), status: "tracked" };
        }
      });
      saveHistory(history);
      console.log(`Saved ${latest.length} items to history.`);
    });
  } else if (action === "download") {
    const videoId = process.argv[3];
    if (!videoId) {
      console.error("Please provide a video ID or URL!");
    } else {
      const cleanId = videoId.includes("v=") ? videoId.split("v=")[1].split("&")[0] : videoId;
      downloadVideo(cleanId);
    }
  }
}
