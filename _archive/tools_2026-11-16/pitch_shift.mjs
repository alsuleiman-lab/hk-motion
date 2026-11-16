import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Pitch shift audio without changing speed using ffmpeg's librubberband.
 * Usage: node tools/pitch_shift.mjs <input_audio> <output_audio> [pitch_scale]
 * Example: node tools/pitch_shift.mjs in.wav out.wav 1.08
 */
const [,, input, output, pitchStr] = process.argv;
if (!input || !output) {
  console.error("Usage: node tools/pitch_shift.mjs <input_audio> <output_audio> [pitch_scale]");
  process.exit(1);
}

const pitch = parseFloat(pitchStr || "1.08");
console.log(`Shifting pitch: scale=${pitch} (${pitch > 1 ? "+" : ""}${Math.round((pitch - 1) * 100)}%)`);

const args = [
  "-y",
  "-hide_banner",
  "-i", input,
  "-af", `rubberband=pitch=${pitch}`,
  output
];

const res = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (res.status !== 0) {
  console.error("ffmpeg failed with code", res.status);
  process.exit(res.status || 1);
}

console.log("Pitch shift complete:", output);
