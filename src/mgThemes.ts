/**
 * Motion-graphics theme = the active brand palette (src/brand.ts). The theme names remain only so older compositions compile.
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
/** the theme = the ACTIVE brand palette, read live (src/brand.ts, user 2026-10-29: one identity in shape, 5 colour palettes chosen per video with the spec field `brand`).
 *  Every older theme name maps to it, so old compositions follow the active palette too. */
const live = {} as MGTheme;
for (const k of ["paper", "paper2", "card", "ink", "accent", "onAccent", "mark", "green", "blue", "navy", "gray"] as const) Object.defineProperty(live, k, { get: () => BRAND[k], enumerable: true });
Object.defineProperty(live, "label", { get: () => "الهوية", enumerable: true });
export const THEMES: Record<MGThemeName, MGTheme> = { steel: live, walnut: live, olive: live, teal: live, slate: live, oak: live, marine: live };
export const THEME_ORDER: MGThemeName[] = ["steel", "walnut", "olive", "teal", "slate"];
