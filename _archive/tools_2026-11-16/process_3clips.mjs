import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const PYTHON = "S:\\AI_Tools\\ComfyUI_windows_portable\\python_embeded\\python.exe";

const clips = [
  "stream_arsh_fakh",
  "stream_julani_takfir",
  "stream_mayyit_ilm"
];

for (const name of clips) {
  const rawFile = path.resolve(`public/${name}_raw.mp4`);
  if (!fs.existsSync(rawFile)) {
    console.error(`Missing raw file: ${rawFile}`);
    process.exit(1);
  }
  
  const cutFile = path.resolve(`public/${name}_cut.mp4`);
  const wavFile = path.resolve(`public/${name}_audio.wav`);
  const wordsFile = path.resolve(`public/${name}_words.json`);

  if (!fs.existsSync(cutFile)) {
    console.log(`\n========================================`);
    console.log(`1. Running auto_cut on ${name}...`);
    console.log(`========================================`);
    execFileSync("node", ["tools/auto_cut.mjs", rawFile, name], { stdio: "inherit" });
  } else {
    console.log(`Cut file already exists: ${cutFile}`);
  }

  if (!fs.existsSync(wavFile)) {
    console.log(`\n========================================`);
    console.log(`2. Extracting 16kHz WAV from ${name}_cut.mp4...`);
    console.log(`========================================`);
    execFileSync("ffmpeg", ["-y", "-hide_banner", "-i", cutFile, "-vn", "-ar", "16000", "-ac", "1", wavFile], { stdio: "inherit" });
  }

  console.log(`\n========================================`);
  console.log(`3. Transcribing ${name} with faster-whisper on CUDA...`);
  console.log(`========================================`);
  execFileSync(PYTHON, ["tools/transcribe_words.py", wavFile, wordsFile], { stdio: "inherit" });

  console.log(`Finished processing ${name}!`);
}

console.log("\nALL 3 CLIPS SUCCESSFULLY CUT AND TRANSCRIBED!");
