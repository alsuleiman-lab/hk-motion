/**
 * The channel's ONE colour identity (user 2026-10-27: «هوية واحدة لكل الفيديوهات بألوان بطاقة البند»; replaces the per-video themes).
 * Taken from the item card (EuKit StatRow in the steel theme). Every overlay, bar, chip, card, base and cover reads from here;
 * tools/brand_audit.mjs flags any other colour in the montage kit. Change a value here → every video follows.
 * Outside the identity by nature: real photos and clips, the verse screen, map and flag colours.
 */
export const BRAND = {
  card: "#f6f8fa",       // card paper (light)
  paper: "#e2e8ee",      // light panel / track
  paper2: "#d6dee6",
  ink: "#16212e",        // text on light
  accent: "#2f5f94",     // the one highlight: numbers, chips, buttons, timer
  accentDeep: "#24456e",
  onAccent: "#ffffff",   // text on the accent
  navy: "#14365c",       // bars, panels
  navyDeep: "#0f2a48",
  mark: "#b5412f",       // hand-drawn marks only (circle, strike, stamp)
  gray: "#8793a1",       // secondary text, labels
  light: "#c9d4e0",      // secondary text on dark
  green: "#5d8a78",      // a calm second series colour (charts)
  blue: "#3d7bc4",       // a calm third series colour (charts)
  base: "#1b2a3d",       // decorated video background (dark, calm, never black)
  base2: "#24384f",
  base3: "#132031",
} as const;

/** title bar + key-phrase chip (the BarTheme shape of TitleBar.tsx) */
export const BRAND_BAR = {
  timerBg: `linear-gradient(${BRAND.accent},${BRAND.accentDeep})`,
  titleBg: `linear-gradient(${BRAND.navy},${BRAND.navyDeep})`,
  timerText: BRAND.card,
  titleText: BRAND.card,
  subText: BRAND.light,
};

/** every hex the identity allows (brand_audit.mjs); white/black only for shadows and alpha overlays */
export const BRAND_HEX = [...Object.values(BRAND), "#ffffff", "#000000"];
