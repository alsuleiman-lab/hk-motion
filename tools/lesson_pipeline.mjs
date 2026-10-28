import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { sendNotification } from "./notify.mjs";

const ROOT = "s:/AI_Tools/Remotion_Workspace";
const DATA_DIR = path.join(ROOT, "data");
const LESSONS_DIR = path.join(ROOT, "render_work", "lessons");
const HISTORY_FILE = path.join(DATA_DIR, "lessons_history.json");
const PYTHON_PATH = "S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe";

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LESSONS_DIR)) fs.mkdirSync(LESSONS_DIR, { recursive: true });

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

// Determines if title represents a lesson or live stream (Arabic or English)
export function isLesson(title = "") {
  const t = title.toLowerCase();
  const keywords = [
    // Arabic keywords - lessons & streams
    "شرح", "درس", "الترمذي", "حديث", "عمدة", "نونية", 
    "ابن القيم", "صحيح", "كتاب", "تفسير", "متن", "مسألة", "الفقه", "العقيدة",
    "بث", "مباشر", "بثوث", "أسئلة", "لقاء", "حوار", "مواجهة", "ردود",
    // English translated keywords
    "explanation", "lesson", "tirmidhi", "hadith", "nuniyyah", "tafsir", 
    "fiqh", "aqidah", "jami'", "sahih", "ibn al-qayyim", "live", "stream"
  ];
  return keywords.some(k => t.includes(k));
}

// Fetches recent uploads from both regular videos and live streams
export function getRecentLessons(channelHandle = "@MShmsDin", limit = 10) {
  const urls = [
    `https://www.youtube.com/${channelHandle}/streams`,
    `https://www.youtube.com/${channelHandle}/videos`,
  ];

  const lessons = [];
  const seenIds = new Set();

  for (const url of urls) {
    try {
      const cmd = `yt-dlp --extractor-args "youtube:lang=ar" --flat-playlist --playlist-end ${limit} --dump-json "${url}"`;
      const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 15 * 1024 * 1024 });
      const lines = output.trim().split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          if (seenIds.has(item.id)) continue;
          seenIds.add(item.id);

          if (isLesson(item.title)) {
            lessons.push({
              id: item.id,
              title: item.title,
              url: `https://www.youtube.com/watch?v=${item.id}`,
              uploadDate: item.upload_date,
              duration: item.duration,
            });
          }
        } catch {}
      }
    } catch (err) {
      console.error(`Error querying ${url}:`, err.message);
    }
  }

  return lessons;
}

// Downloads video, extracts 16k WAV audio, and runs transcribe_words.py
export async function processLesson(videoItem) {
  const { id, title } = videoItem;
  const projectDir = path.join(LESSONS_DIR, id);
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

  const manifestPath = path.join(projectDir, "manifest.json");
  const manifest = {
    id,
    title,
    startedAt: new Date().toISOString(),
    files: [],
    status: "in_progress"
  };

  console.log(`\n========================================`);
  console.log(`🎬 بدء معالجة الدرس الجديد: [${id}]`);
  console.log(`📌 العنوان: ${title}`);
  console.log(`📁 مجلد العمل: ${projectDir}`);
  console.log(`========================================\n`);

  const rawVideoPath = path.join(projectDir, `source.mp4`);
  const wavAudioPath = path.join(projectDir, `audio16k.wav`);
  const wordsJsonPath = path.join(projectDir, `words.json`);
  const vadJsonPath = path.join(projectDir, `vad.json`);

  // 1. Download Video (1080p max)
  console.log(`[1/4] ⬇️ جاري تنزيل الفيديو تلقائياً بأعلى دقة...`);
  const dlCmd = `yt-dlp -N 8 -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]/best" --merge-output-format mp4 -o "${rawVideoPath}" "https://www.youtube.com/watch?v=${id}"`;
  execSync(dlCmd, { stdio: "inherit" });
  manifest.files.push(rawVideoPath);

  // 2. Extract 16kHz mono audio for Whisper & VAD
  console.log(`[2/4] 🎵 استخراج الصوت بدقة 16kHz...`);
  const ffmpegAudioCmd = `ffmpeg -y -i "${rawVideoPath}" -vn -ar 16000 -ac 1 "${wavAudioPath}"`;
  execSync(ffmpegAudioCmd, { stdio: "ignore" });
  manifest.files.push(wavAudioPath);

  // 3. Transcribe with Whisper large-v3
  console.log(`[3/4] 📝 جاري التفريغ الصوتي التلقائي بمستوى الكلمة (large-v3 على كرت الشاشة)...`);
  const transcribeCmd = `"${PYTHON_PATH}" "${path.join(ROOT, "tools", "transcribe_words.py")}" "${wavAudioPath}" "${wordsJsonPath}"`;
  execSync(transcribeCmd, { stdio: "inherit" });
  manifest.files.push(wordsJsonPath);

  // 4. Run VAD segments detection
  console.log(`[4/4] 🔍 كشف السكتات وفواصل الكلام (VAD)...`);
  try {
    const vadCmd = `"${PYTHON_PATH}" "${path.join(ROOT, "tools", "vad_segments.py")}" "${wavAudioPath}" "${vadJsonPath}" --padstart 100 --padend 180`;
    execSync(vadCmd, { stdio: "inherit" });
    manifest.files.push(vadJsonPath);
  } catch (err) {
    console.warn("VAD script warning:", err.message);
  }

  manifest.completedAt = new Date().toISOString();
  manifest.status = "ready_for_cutting";
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  // Update history
  const history = loadHistory();
  history[id] = {
    title,
    processedAt: manifest.completedAt,
    projectDir,
    manifestPath,
    status: "ready_for_cutting"
  };
  saveHistory(history);

  console.log(`\n✅ اكتمل تنزيل وتفريغ الدرس بنجاح! جاهز للتقطيع والمونتاج.`);

  // إشعار اكتمال التنزيل والتفريغ الصوتي
  sendNotification({
    title: "تم تنزيل وتفريغ الفيديو بنجاح 📥",
    body: `${title}\nاكتمل التنزيل والتفريغ الصوتي (Whisper large-v3) واستخراج فواصل الكلام (VAD) بنجاح، وجاهز للمونتاج والتقطيع.`,
    source: "تنزيل ومونتاج البثوث والدروس",
  });

  return manifest;
}

// يُرسل إشعاراً فورياً عند الفراغ من المونتاج والرندرة
export function notifyRenderComplete({ title, outputPath, orient = "طولي", duration = "" }) {
  sendNotification({
    title: "اكتمل المونتاج والرندرة بنجاح ✅",
    body: `${title}\nتم الانتهاء من المونتاج والرندرة (${orient}) وحفظ المقطع في مجلد جاهز:\n${outputPath}`,
    source: "تنزيل ومونتاج البثوث والدروس",
    link: outputPath,
  });
}

// Cleans up all tracked temporary files for a lesson
export function cleanupLesson(id) {
  const projectDir = path.join(LESSONS_DIR, id);
  const manifestPath = path.join(projectDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.log(`No manifest found for lesson ${id}.`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`حذف الملفات المؤقتة للدرس: ${manifest.title} (${id})...`);

  for (const file of manifest.files) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`- تم حذف: ${path.basename(file)}`);
      } catch (e) {
        console.error(`- تعذر حذف ${file}:`, e.message);
      }
    }
  }

  // Remove directory if empty
  try {
    fs.rmSync(projectDir, { recursive: true, force: true });
    console.log(`- تم تنظيف مجلد المشروع.`);
  } catch {}

  const history = loadHistory();
  if (history[id]) {
    history[id].status = "cleaned";
    saveHistory(history);
  }
  console.log(`✅ اكتمل تنظيف الملفات المؤقتة بنجاح.`);
}

// Main CLI handler
const args = process.argv.slice(2);
const command = args[0] || "check";

if (command === "check") {
  console.log("فحص آخر الدروس العلمية المتاحة...");
  const history = loadHistory();
  const lessons = getRecentLessons();
  console.log(`\nتم العثور على ${lessons.length} درساً في القناة:`);
  lessons.forEach((l, idx) => {
    const isNew = !history[l.id];
    console.log(`${idx + 1}. [${isNew ? "جديد 🆕" : "سابق ✔️"}] ${l.title} (${l.id})`);
  });
} else if (command === "sync-history") {
  console.log("مزامنة الدروس الحالية كسجل سابق...");
  const history = loadHistory();
  const lessons = getRecentLessons();
  lessons.forEach(l => {
    if (!history[l.id]) {
      history[l.id] = { title: l.title, status: "existing_lesson", syncedAt: new Date().toISOString() };
    }
  });
  saveHistory(history);
  console.log(`✅ تم اعتماد ${lessons.length} درساً في السجل السابق. التنزيل التلقائي سيلتقط أي درس جديد من الآن فصاعداً.`);
} else if (command === "auto") {
  console.log("تشغيل الرصد التلقائي للدروس الجديدة...");
  const history = loadHistory();
  const lessons = getRecentLessons();
  const newLessons = lessons.filter(l => !history[l.id]);

  if (newLessons.length === 0) {
    console.log("كل الدروس الحالية معالجة ومسجلة في السجل. لا توجد دروس جديدة حالياً.");
  } else {
    console.log(`تم رصد ${newLessons.length} درس جديد! بدء المعالجة...`);
    (async () => {
      for (const l of newLessons) {
        await processLesson(l);
      }
    })();
  }
} else if (command === "process") {
  const id = args[1];
  if (!id) {
    console.error("يرجى إدخال معرف الفيديو (Video ID)!");
  } else {
    let title = args.slice(2).join(" ");
    if (!title) {
      try {
        const out = execSync(`yt-dlp --extractor-args "youtube:lang=ar" --print "%(title)s" "https://www.youtube.com/watch?v=${id}"`, { encoding: "utf-8" });
        title = out.trim() || `Lesson ${id}`;
      } catch {
        title = `Lesson ${id}`;
      }
    }
    await processLesson({ id, title });
  }
} else if (command === "cleanup") {
  const id = args[1];
  if (!id) {
    console.error("يرجى إدخال معرف الفيديو المراد تنظيفه!");
  } else {
    cleanupLesson(id);
  }
} else if (command === "notify-render") {
  const title = args[1] || "فيديو البث/الدرس";
  const outputPath = args[2] || "C:/Users/mshms/Videos/جاهز";
  const orient = args[3] || "طولي";
  notifyRenderComplete({ title, outputPath, orient });
}
