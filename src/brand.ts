/**
 * The channel's ONE identity in shape, in FIVE colour palettes (user 2026-10-29: «هوية واحدة ولكن 5 أنماط لونية، هي هوية من حيث الشكل، و5 من حيث اللون»).
 * Every overlay, bar, chip, card, base and cover of the montage kit reads its colours from `BRAND` at render time; a video picks its palette with the spec field
 * `"brand": "<name>"` (MontageSpec calls applyBrand before its children render). The shapes, fonts, sizes and motion never change between palettes.
 * tools/brand_audit.mjs flags any colour in the kit that is not a palette token. Outside the identity by nature: real photos and clips, the verse screen, map and flag colours.
 */
export type BrandTokens = {
  card: string;        // card paper (light)
  paper: string;       // light panel / track
  paper2: string;
  ink: string;         // text on light
  accent: string;      // the one highlight: numbers, chips, buttons, timer
  accentDeep: string;
  onAccent: string;    // text on the accent
  navy: string;        // bars, panels
  navyDeep: string;
  mark: string;        // hand-drawn marks only (circle, strike, stamp)
  gray: string;        // secondary text, labels
  light: string;       // secondary text on dark
  green: string;       // a calm second series colour (charts)
  blue: string;        // a calm third series colour (charts)
  base: string;        // decorated video background (dark, calm, never black)
  base2: string;
  base3: string;
};
export type BrandName = "steel" | "olive" | "maroon" | "kraft" | "teal";

/** the five palettes: same tokens, same roles; all calm and dark-based, never black, never pink/purple/neon */
export const PALETTES: Record<BrandName, BrandTokens & { label: string }> = {
  steel:  { label: "فولاذي",        card: "#f6f8fa", paper: "#e2e8ee", paper2: "#d6dee6", ink: "#16212e", accent: "#2f5f94", accentDeep: "#24456e", onAccent: "#ffffff", navy: "#14365c", navyDeep: "#0f2a48", mark: "#b5412f", gray: "#8793a1", light: "#c9d4e0", green: "#5d8a78", blue: "#3d7bc4", base: "#1b2a3d", base2: "#24384f", base3: "#132031" },
  olive:  { label: "زيتوني نحاسي",  card: "#f3f1ea", paper: "#e3e2d6", paper2: "#d4d3c4", ink: "#1a2420", accent: "#3f7a63", accentDeep: "#2f5e4c", onAccent: "#ffffff", navy: "#23443b", navyDeep: "#1a332c", mark: "#b8742f", gray: "#87928a", light: "#cfd8cf", green: "#6f9a5e", blue: "#4f8a8b", base: "#262420", base2: "#33302a", base3: "#1b1a17" },
  maroon: { label: "عنابي رملي",    card: "#f5efe6", paper: "#e9e0d2", paper2: "#ddd1bf", ink: "#2a1c1f", accent: "#8f3b3b", accentDeep: "#6e2c2e", onAccent: "#ffffff", navy: "#4a2328", navyDeep: "#381a1e", mark: "#c9a25a", gray: "#9a8a86", light: "#e0d2c8", green: "#6f8a6a", blue: "#5f7f9a", base: "#2a1c1f", base2: "#3a272b", base3: "#1e1416" },
  kraft:  { label: "كرافت وحبر",    card: "#f1e7d3", paper: "#e5d8bd", paper2: "#d8c7a6", ink: "#2c2418", accent: "#b07a2a", accentDeep: "#8a5e1e", onAccent: "#ffffff", navy: "#3d3122", navyDeep: "#2e2519", mark: "#a83a2a", gray: "#8f8170", light: "#e3d6bd", green: "#6b7f4e", blue: "#4f6f8a", base: "#2a2219", base2: "#3a3024", base3: "#1e1912" },
  teal:   { label: "أزرق مخضر",     card: "#f2f6f6", paper: "#dfe8e8", paper2: "#cfdcdc", ink: "#142326", accent: "#2a7f86", accentDeep: "#1f6066", onAccent: "#ffffff", navy: "#1d4448", navyDeep: "#153437", mark: "#c0533a", gray: "#84969a", light: "#c6d8da", green: "#5d8a78", blue: "#3d7bc4", base: "#18242c", base2: "#21313b", base3: "#111a20" },
};
export const BRAND_NAMES = Object.keys(PALETTES) as BrandName[];

/** the ACTIVE palette (live object: components read BRAND.<token> while rendering, so applyBrand recolours everything) */
export const BRAND: BrandTokens = { ...PALETTES.steel };
let CURRENT: BrandName = "steel";
/** switch the active palette (call before the children render; MontageSpec does it from the spec's `brand`) */
export const applyBrand = (name: BrandName = "steel") => {
  if (name === CURRENT || !PALETTES[name]) return;
  const { label: _l, ...tokens } = PALETTES[name];
  Object.assign(BRAND, tokens);
  CURRENT = name;
};
export const currentBrand = () => CURRENT;

/** title bar + key-phrase chip (the BarTheme shape of TitleBar.tsx); getters, so it follows the active palette */
export const BRAND_BAR = {
  get timerBg() { return `linear-gradient(${BRAND.accent},${BRAND.accentDeep})`; },
  get titleBg() { return `linear-gradient(${BRAND.navy},${BRAND.navyDeep})`; },
  get timerText() { return BRAND.card; },
  get titleText() { return BRAND.card; },
  get subText() { return BRAND.light; },
};

/** every hex the identity allows (brand_audit.mjs): the tokens of all five palettes; white/black only for shadows and alpha overlays */
export const BRAND_HEX = [...new Set(BRAND_NAMES.flatMap((n) => Object.values(PALETTES[n]).filter((v) => v.startsWith("#")))), "#ffffff", "#000000"];

/** a palette colour with transparency: alpha(BRAND.accent, .9) → "rgba(47,95,148,0.9)" (read at render time, so it follows the palette) */
export const alpha = (hex: string, a: number) => { const n = parseInt(hex.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

/** the default decorated background (blue stars, KhBg) per palette: steel keeps the approved colours; never green, never black */
export const STARS: Record<BrandName, [string, string, string]> = {
  steel: ["#2f5578", "#3d6a8f", "#5a4332"],
  olive: ["#3b3328", "#4a4134", "#2a2620"],
  maroon: ["#4a2a2e", "#5e3a3c", "#3a2a22"],
  kraft: ["#4a3a28", "#5c4a33", "#2e2519"],
  teal: ["#24485a", "#2f5f6e", "#3b3a30"],
};
export const currentStars = () => STARS[CURRENT];
