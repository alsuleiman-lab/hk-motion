import { continueRender, delayRender, staticFile } from "remotion";

/**
 * LOCAL fonts (user rule 2026-10-16): fonts live in public/fonts and are loaded from disk — never downloaded from Google at render time.
 * Titles: Noto Kufi Arabic (variable, weight 800). Texts: Almarai (400/700/800). A missing font = download its .ttf into public/fonts first.
 */
const loaded = new Set<string>();
const load = (family: string, file: string, weight: string) => {
  const key = family + weight;
  if (loaded.has(key) || typeof document === "undefined") return family;
  loaded.add(key);
  const h = delayRender(`font ${family} ${weight}`);
  new FontFace(family, `url(${staticFile("fonts/" + file)})`, { weight, style: "normal" })
    .load()
    .then((f) => { document.fonts.add(f); continueRender(h); })
    .catch((e) => { console.error("font failed", family, e); continueRender(h); });
  return family;
};

export const FONT_TITLE = () => load("Noto Kufi Arabic", "NotoKufiArabic-Variable.ttf", "100 900");
export const FONT_TEXT = () => { load("Almarai", "Almarai-Regular.ttf", "400"); load("Almarai", "Almarai-Bold.ttf", "700"); return load("Almarai", "Almarai-ExtraBold.ttf", "800"); };

/** Qur'an text: ALWAYS a King Fahd Glorious Quran Printing Complex font — the user chose the *Sousi* one (2026-10-20). File: public/fonts/UthmanicSousi_V20.ttf (KFGQPC Uthmanic Script Sousi V20, via github.com/nuqayah/qpc-fonts). */
export const FONT_QURAN = () => load("KFGQPC Uthmanic Sousi", "UthmanicSousi_V20.ttf", "400");
export const QURAN_FONT = "KFGQPC Uthmanic Sousi";
export const FONT_NASKH = () => { load("Amiri", "Amiri-Regular.ttf", "400"); return load("Amiri", "Amiri-Bold.ttf", "700"); };
