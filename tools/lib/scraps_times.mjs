// Word times for WordScraps (user 2026-11-06: «لابد من كتابة الكلمة عند قولها»): each scrap appears at the moment its word is spoken.
// align(text, at, until, words) → one time per word of `text` (seconds on the cut's timeline), or null where a word could not be found.
const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
const lev1 = (a, b) => { if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 3) return false; let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1); return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i); };
export const align = (text, at, until, words) => {
  const win = words.map((w, i) => ({ ...w, i, n: norm(w.w) })).filter((w) => w.s >= at - 0.6 && w.s <= until + 1.5);
  let k = 0, lastT = at; const out = [], hits = []; let miss = 0;   // each unmatched word widens the next search by 1 s (a corrected spelling must not lose the words after it)   // a word is searched only within 1.6 s of the previous one (a repeat far away is not this word)
  for (const raw of text.split(" ")) {
    const q = norm(raw); let hit = -1;
    for (let j = k; j < win.length && j < k + 12 && win[j].s <= lastT + 1.6 + miss; j++) if (win[j].n === q || (bare(q).length >= 3 && bare(win[j].n) === bare(q))) { hit = j; break; }
    // the transcriber garbles a letter now and then («ضمني» ← «ضمي»): a one-letter difference on a word of 3+ letters still counts (user 2026-11-08: the scrap showed 0.6 s before its word)
    if (hit < 0) for (let j = k; j < win.length && j < k + 12 && win[j].s <= lastT + 1.6 + miss; j++) if (bare(q).length >= 3 && lev1(bare(q), bare(win[j].n))) { hit = j; break; }
    if (hit < 0) { out.push(null); hits.push(-1); miss += 1; continue; }
    out.push(Math.round(win[hit].s * 100) / 100); hits.push(hit); k = hit + 1; lastT = win[hit].s; miss = 0;
  }
  // a corrected spelling («رامبال» written for the transcribed «رمبل»): an unmatched word whose two neighbours matched with exactly one transcript word between them takes that word's time
  for (let i = 1; i < out.length - 1; i++) if (out[i] == null && hits[i - 1] >= 0 && hits[i + 1] >= 0 && hits[i + 1] - hits[i - 1] === 2) out[i] = Math.round(win[hits[i - 1] + 1].s * 100) / 100;
  return out;
};
