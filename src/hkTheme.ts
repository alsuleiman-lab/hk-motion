/**
 * HK-MOTION THEMES (user 2026-11-19: «غيّر لي ستايل البرنامج: فضي دخاني ليلي، وبيج على سكري على بني خفيف نهاري»).
 * Two looks for the Studio's own chrome (never the montage canvas): NIGHT = smoky silver on graphite, DAY = beige on sugar with a light brown accent.
 * The Studio's palette
 * (it is a set of CSS variables, --remotion-studio-*, which the look overrides), plus our own variables (--hk-*) that our own pieces
 * (the HK row, the gallery sheet, the colour sheet, the brand line) read. The choice is kept in this browser (localStorage) and switched by the «ليلي/نهاري» button of the HK row.
 * The black of the canvas surround and everything drawn by the montage are not touched.
 */
export type Theme = "night" | "day";
const KEY = "__hk_theme";
type Pal = Record<string, string>;
const PAL: Record<Theme, Pal> = {
  night: {
    "--hk-bg": "#23262b", "--hk-bg2": "#2b2e34", "--hk-deep": "#17181c", "--hk-raised": "#33363d", "--hk-card": "#2b2f36",
    "--hk-text": "#e6e9ec", "--hk-dim": "#9aa3ad", "--hk-line": "rgba(210,218,226,.20)", "--hk-accent": "#b9c3ce", "--hk-accent-text": "#14171a",
    "--hk-btn": "#3a3e46", "--hk-btn-on": "#7f8a96", "--hk-danger": "#8c3b3b", "--hk-ok": "#6fbf8a", "--hk-warn": "#d8c58a", "--hk-input": "#17181c",
    "--hk-line-strong": "rgba(210,218,226,.34)", "--hk-brand": "linear-gradient(90deg,#d5dbe2,#7e8892 55%,#d5dbe2)",
  },
  day: {
    "--hk-bg": "#f3e9d6", "--hk-bg2": "#ecdfc6", "--hk-deep": "#e3d3b4", "--hk-raised": "#e8d9bc", "--hk-card": "#f8f0df",
    "--hk-text": "#3b2e20", "--hk-dim": "#7d6a52", "--hk-line": "rgba(92,64,34,.22)", "--hk-accent": "#a86a2f", "--hk-accent-text": "#fffaf0",
    "--hk-btn": "#e2cfa9", "--hk-btn-on": "#b9824a", "--hk-danger": "#b4523f", "--hk-ok": "#4c8a52", "--hk-warn": "#9a6a1c", "--hk-input": "#fbf5e8",
    "--hk-line-strong": "rgba(92,64,34,.36)", "--hk-brand": "linear-gradient(90deg,#d9a35f,#8a5a2b 55%,#d9a35f)",
  },
};
/** the Studio's own palette is a set of CSS variables (--remotion-studio-*): the look overrides them, so every panel, the timeline and the icons follow without touching a single rule of the Studio */
const STUDIO: Record<Theme, Record<string, string>> = {
  night: {
    "background": "#25282d", "background-transparent": "rgba(37,40,45,0)", "input-background": "#33373e", "tab-hover-background": "#2c3036", "light-color": "#dfe3e7", "light-text": "#9aa3ad", "ruler-color": "#8a929b",
    "line-color": "#3a3e45", "timeline-track-separator": "#1a1c20", "timeline-background-color": "#1b1d21", "timeline-negative-start-background-color": "#2e3137", "timeline-negative-start-border-color": "#454951",
    "timeline-selected-background-color": "#3d4148", "timeline-selected-label-background-color": "#b8bec6", "blue": "#aeb9c6", "blue-hovered": "#cdd6e0", "blue-disabled": "#4a525c", "timeline-blue": "#9fb0c3",
    "notification-background": "#17181b", "render-status-background": "#2a2d32", "easing-selected-background": "rgba(174,185,198,.18)", "focus-color": "#6b7480",
    "timeline-video-gradient": "linear-gradient(to top,#6f7a86,#8d98a4)", "timeline-audio-gradient": "linear-gradient(#5d8a72,#6f9c83 60%)", "timeline-captions-gradient": "linear-gradient(to top,#8a7a5d,#a38f6c)",
  },
  day: {
    "background": "#f3e9d6", "background-transparent": "rgba(243,233,214,0)", "input-background": "#fbf5e8", "tab-hover-background": "#ead9bb", "light-color": "#5a4630", "light-text": "#7d6a52", "ruler-color": "#8b7658",
    "line-color": "#d8c6a2", "timeline-track-separator": "#d9c7a3", "timeline-background-color": "#ece0c8", "timeline-negative-start-background-color": "#e2d3b4", "timeline-negative-start-border-color": "#cdb98f",
    "timeline-selected-background-color": "#e0cda7", "timeline-selected-label-background-color": "#c9975f", "blue": "#d1995a", "blue-hovered": "#dca96d", "blue-disabled": "#dcc9a6", "timeline-blue": "#c08a4d",
    "notification-background": "#f8f0df", "render-status-background": "#efe2c8", "easing-selected-background": "rgba(209,153,90,.22)", "focus-color": "#b8a07a",
    "white": "#3b2e20", "keyboard-shortcut-key-color": "#5a4630", "light-gray": "#6f5c44",
    "white-alpha-05": "rgba(92,64,34,.05)", "white-alpha-06": "rgba(92,64,34,.06)", "white-alpha-08": "rgba(92,64,34,.08)", "white-alpha-10": "rgba(92,64,34,.10)", "white-alpha-12": "rgba(92,64,34,.12)", "white-alpha-15": "rgba(92,64,34,.15)",
    "white-alpha-20": "rgba(92,64,34,.20)", "white-alpha-25": "rgba(92,64,34,.25)", "white-alpha-30": "rgba(92,64,34,.30)", "white-alpha-35": "rgba(92,64,34,.35)", "white-alpha-40": "rgba(92,64,34,.42)", "white-alpha-45": "rgba(92,64,34,.47)",
    "white-alpha-50": "rgba(92,64,34,.52)", "white-alpha-60": "rgba(92,64,34,.62)", "white-alpha-70": "rgba(92,64,34,.72)", "white-alpha-72": "rgba(92,64,34,.74)", "white-alpha-80": "rgba(70,48,26,.82)", "white-alpha-90": "rgba(60,42,22,.92)",
    "timeline-video-gradient": "linear-gradient(to top,#b9824a,#d1a06a)", "timeline-audio-gradient": "linear-gradient(#7a9a6a,#8aab7a 60%)", "timeline-captions-gradient": "linear-gradient(to top,#a8672b,#c78a4c)",
    "error-code-frame-background": "#f1e6cf", "error-code-frame-line-background": "#eadcc0",
  },
};
const chromeCss = (t: Theme): string => {
  const rules = Object.entries(STUDIO[t]).map(([k, x]) => `--remotion-studio-${k}:${x}`).join(";");
  const smoke = t === "night" ? "linear-gradient(165deg,rgba(255,255,255,.05),rgba(0,0,0,.22) 70%)" : "linear-gradient(165deg,rgba(255,255,255,.4),rgba(120,84,40,.07) 70%)";
  return `html[data-hk-theme="${t}"]{${rules}}
html[data-hk-theme="${t}"] [style*="background-color: var(--remotion-studio-background)"]{background-image:${smoke}}
html[data-hk-theme="${t}"] body{color:var(--hk-text)}`;
};
const vars = (t: Theme) => `html[data-hk-theme="${t}"]{${Object.entries(PAL[t]).map(([k, x]) => `${k}:${x}`).join(";")};color-scheme:${t === "day" ? "light" : "dark"}}`;

const get = (): Theme => { try { return localStorage.getItem(KEY) === "day" ? "day" : "night"; } catch { return "night"; } };
let style: HTMLStyleElement | null = null;
export const applyTheme = (t: Theme): void => {
  document.documentElement.setAttribute("data-hk-theme", t);
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
  if (!style) { style = document.createElement("style"); style.id = "__hk_theme_css"; document.head.appendChild(style); }
  style.textContent = `${vars("night")}\n${vars("day")}\n${chromeCss(t)}`;
  const bar = document.getElementById("__hk_brand_bar"); if (bar) bar.style.background = PAL[t]["--hk-brand"];
  window.dispatchEvent(new CustomEvent("hk-theme", { detail: t }));
};
export const currentTheme = get;
export const toggleTheme = (): Theme => { const n: Theme = get() === "night" ? "day" : "night"; applyTheme(n); return n; };
export const installTheme = (): void => { applyTheme(get()); };
