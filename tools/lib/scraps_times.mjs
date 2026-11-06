// Word times for WordScraps (user 2026-11-06: «لابد من كتابة الكلمة عند قولها»): each scrap appears at the moment its word is spoken.
// align(text, at, until, words) → one time per word of `text` (seconds on the cut's timeline), or null where a word could not be found.
const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
export const align = (text, at, until, words) => {
  const win = words.map((w, i) => ({ ...w, i, n: norm(w.w) })).filter((w) => w.s >= at - 1.5 && w.s <= until + 1.5);
  let k = 0; const out = [];
  for (const raw of text.split(" ")) {
    const q = norm(raw); let hit = -1;
    for (let j = k; j < win.length && j < k + 6; j++) if (win[j].n === q || (bare(q).length >= 3 && bare(win[j].n) === bare(q))) { hit = j; break; }
    if (hit < 0) { out.push(null); continue; }
    out.push(Math.round(win[hit].s * 100) / 100); k = hit + 1;
  }
  return out;
};
