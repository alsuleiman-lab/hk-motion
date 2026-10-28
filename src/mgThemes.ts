/**
 * Per-video colour identities for motion graphics (user 2026-10-18: «لكل فيديو ستايل لوني معين، ألوان هادئة ليست نسائية، كل فيديو مختلف عن الثاني»).
 * Calm, masculine, serious: blues / browns / olive / teal / slate. NEVER pink, peach, purple, neon, or black backgrounds. Orange is NOT required.
 * Pick with `node tools/pick_theme.mjs <video-id>` (gives the next theme not used by the last 3 videos, logs it in data/video_themes.json).
 */
import { BRAND } from "./brand";
export type MGThemeName = "steel" | "walnut" | "olive" | "teal" | "slate" | "oak" | "marine";
export type MGTheme = {
  paper: string; paper2: string; card: string; ink: string;
  accent: string;      // chips, stickers, highlights
  onAccent: string;    // text on the accent
  mark: string;        // hand-drawn marks (circle / strike / cross / clips / stamp)
  green: string; blue: string; navy: string;   // third bar, second swatch, the alternate "dark world" (iris colour) — all calm, never black
  gray: string; label: string;
};
export const THEMES: Record<MGThemeName, MGTheme> = {
  // the brand (src/brand.ts) — the only theme in use since 2026-10-27; the others are kept only so old code compiles
  steel:  { paper: BRAND.paper, paper2: BRAND.paper2, card: BRAND.card, ink: BRAND.ink, accent: BRAND.accent, onAccent: BRAND.onAccent, mark: BRAND.mark, green: BRAND.green, blue: BRAND.blue, navy: BRAND.navy, gray: BRAND.gray, label: "هوية القناة" },
  walnut: { paper: "#eadfca", paper2: "#e0d3b8", card: "#f8f2e4", ink: "#2a1d13", accent: "#8a5a2e", onAccent: "#fff8e8", mark: "#a1402a", green: "#6a7d4a", blue: "#3f6e95", navy: "#4a2f1d", gray: "#9a8b73", label: "جوزي دافئ" },
  olive:  { paper: "#e6e5d3", paper2: "#dcdbc3", card: "#f7f6ea", ink: "#232a1a", accent: "#667a3e", onAccent: "#ffffff", mark: "#9a4630", green: "#4f6a45", blue: "#46698a", navy: "#2f3d26", gray: "#8f927a", label: "زيتوني" },
  teal:   { paper: "#dfe8e5", paper2: "#d1ddd9", card: "#f4f8f7", ink: "#10282a", accent: "#23706f", onAccent: "#ffffff", mark: "#b0482f", green: "#5f8f6a", blue: "#3b6fa0", navy: "#0f3c42", gray: "#7f9291", label: "أخضر مزرق" },
  slate:  { paper: "#e5e3dc", paper2: "#dad7cd", card: "#f8f6ef", ink: "#222a33", accent: "#b88226", onAccent: "#1f2630", mark: "#a5392c", green: "#5c7c68", blue: "#41648a", navy: "#2b3a4b", gray: "#8c8a80", label: "رمادي وعنبري" },
  // MID-TONE (user 2026-10-19: backgrounds are never light — esp. behind the isolated Sheikh); never black either. Use with <PaperBg dark>.
  oak:    { paper: "#7a5233", paper2: "#8d6540", card: "#f8f2e4", ink: "#2a1d13", accent: "#e3b869", onAccent: "#2a1d13", mark: "#a1402a", green: "#6a7d4a", blue: "#3f6e95", navy: "#7a5233", gray: "#c9b79a", label: "بلوط متوسط" },
  marine: { paper: "#3d6a8f", paper2: "#4b7aa0", card: "#f5f8fb", ink: "#16212e", accent: "#f0c75e", onAccent: "#16212e", mark: "#b5412f", green: "#5d8a78", blue: "#6fa3d6", navy: "#3d6a8f", gray: "#b9cde0", label: "أزرق متوسط" },
};
export const THEME_ORDER: MGThemeName[] = ["steel", "walnut", "olive", "teal", "slate"];
