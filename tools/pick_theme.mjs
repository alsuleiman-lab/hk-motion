// Give each video its own calm colour identity (src/mgThemes.ts) — different from the last 3 videos.
//   node tools/pick_theme.mjs <video-id> [--force <theme>]     → prints the theme name and logs it in data/video_themes.json
import fs from "node:fs";
const [id, flag, forced] = process.argv.slice(2);
const file = new URL("../data/video_themes.json", import.meta.url);
const ORDER = ["steel", "walnut", "olive", "teal", "slate"];
const log = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const prev = log.find((x) => x.video === id);
let theme = prev?.theme;
if (forced && flag === "--force") theme = forced;
if (!theme) {
  const recent = log.slice(-3).map((x) => x.theme);
  theme = ORDER.find((t) => !recent.includes(t)) ?? ORDER[log.length % ORDER.length];
}
if (!prev) log.push({ video: id, theme, date: new Date().toISOString().slice(0, 10) });
else prev.theme = theme;
fs.writeFileSync(file, JSON.stringify(log, null, 1));
console.log(theme);
