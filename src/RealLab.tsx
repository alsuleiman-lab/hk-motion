import React from "react";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec, SpecItem } from "./MontageSpec";
import type { BrandName } from "./brand";
import { GALLERY_CUT } from "./galleryCut";

/**
 * RealLab — the gallery draws an element through the montage engine itself (user 2026-10-30: «أريد شيء حقيقي فعلاً … بالمونتاج فريم حقيقي لي»):
 * a mini spec over his real recording, one item with the same fields a real spec uses, so size, place, layout switch (his window pushed right over the
 * decorated base for the written items), title bar and source line are exactly what a video gets. No screen split here: it is only for verses and hadiths (user 2026-10-30); every item sits where the normal-mode grid puts it (data/layout_grids.json).
 */
const A = 0.1, U = 2.9;
type R = { item: SpecItem | SpecItem[] };
const LEFT_SOURCE: SpecItem = { t: "credit", text: "المصدر: اسم الموقع — 29/10/2026", from: 0.3, to: U };
const REAL: Record<string, R> = {
  Word: { item: { t: "word", text: "١٠ ملايين دولار تبرُّع", at: A, until: U, x: 720, y: 1450, size: 56, tone: "gold", land: { x: 300, y: 870, size: 52 } } },
  TornNote: { item: { t: "torn", text: "البناء على القبور حرام", at: A, until: U, underline: 2, size: 54, land: { x: 300, y: 870, size: 52 } } as SpecItem },
  BlurRise: { item: { t: "blur", text: "هل يجوز فتح المقام؟", at: A, until: U, y: 1470, size: 58, accentWords: [2], land: { y: 890 } } },
  PinnedPhoto: { item: [{ t: "scholar", src: "people/sheikh_ibn_uthaymeen_real.png", name: "ابن عثيمين", sub: "رحمه الله (ت 1421هـ)", at: A, until: U, w: 250, h: 407, pos: "50% 20%" }, LEFT_SOURCE] },
  NewsClip: { item: [{ t: "news", src: "zaynab_shrine/news_aj_reception_head.png", source: "الجزيرة نت — 28/10/2026", at: A, until: U, x: 40, y: 1450, w: 420, h: 106 }, LEFT_SOURCE] },
  PopCard: { item: [{ t: "pic", src: "people/azharMosque.jpg", at: A, until: U, x: 40, y: 1450, w: 420, h: 236 }, LEFT_SOURCE] },
  FlashCut: { item: [{ t: "flash", src: "people/azharMosque.jpg", name: "الجامع الأزهر — القاهرة", at: A, until: U, x: 40, y: 1450, w: 330, h: 219, crops: [{ fx: 0.5, fy: 0.5, zoom: 1 }, { fx: 0.5, fy: 0.35, zoom: 2.2 }], beats: [A, 1.2] }, LEFT_SOURCE] },
  PaperScene: { item: { t: "scene", at: A, until: U, x: 40, y: 1450, w: 420, h: 300, pieces: [{ src: "collage/car.png", x: 10, y: 10, w: 200, at: 0.3, rot: -3, from: "left" }, { src: "collage/robe.png", x: 200, y: 20, w: 180, at: 0.9, rot: 2, from: "top" }] } },
  NameCard1: { item: { t: "nameTag", at: 0.2, x: 540, y: 1535, dur: 2.4 } },
  NameCard3: { item: { t: "nameTag", at: 0.2, x: 540, y: 1535, dur: 2.4, style: "pinned" } },
  Subscribe: { item: { t: "subscribe", at: 0.2, x: 540, y: 1530, dur: 2.5 } },
  VerseWords: { item: { t: "verse", words: ["مُّحَمَّدٌۭ", "رَّسُولُ", "ٱللَّهِ"], times: [0.4, 0.9, 1.3], title: "سُورَةُ الفَتۡحِ", refText: "الآية 29", x: 90, y: 700, w: 900, size: 62, until: U } },
  RewriteWindow: { item: { t: "rewrite", x: 90, y: 1345, w: 900, oldText: "العبارة القديمة", newText: "العبارة الأحسن", oldAt: A + 0.4, strikeAt: 0.9, newAt: 1.4, until: U, land: { x: 40, y: 200, w: 640 } } },
  StatRow: { item: { t: "rows", from: A, to: U, y0: 1040, step: 160, rowH: 140, title: { at: A, text: "من كلام أحد المعمّمين" }, rows: [{ at: 0.4, label: "البند الأول من كلامه", icon: "Quote" }, { at: 1.1, label: "البند الثاني من كلامه", icon: "Quote" }] } },
  Sources: { item: { t: "credit", text: "https://example.org/source-of-the-figure", from: A, to: U } },
};

export const hasReal = (id: string) => id in REAL;
/** gallery grid mode: the item moves by (dx, dy) through the same x / y / y0 fields (and the landscape override `land`) a real spec uses; his window stays */
const shift = (o: SpecItem, dx: number, dy: number): SpecItem => {
  if (!dx && !dy) return o;
  const mv = (q: Record<string, unknown>) => { const n = { ...q }; for (const [k, d] of [["x", dx], ["y", dy], ["y0", dy]] as const) if (typeof n[k] === "number") n[k] = (n[k] as number) + d; return n; };
  const n = mv(o as unknown as Record<string, unknown>);
  if (n.land && typeof n.land === "object") n.land = mv(n.land as Record<string, unknown>);
  return n as unknown as SpecItem;
};
export const realScene = (id: string, brand?: BrandName, dx = 0, dy = 0): React.ReactNode => {
  const r = REAL[id]; if (!r) return null;
  const spec = {
    id: "gallery_" + id, title: "عنوان الفيديو", frames: 90, brand, cut: GALLERY_CUT,
    items: (Array.isArray(r.item) ? r.item : [r.item]).map((o, i) => (i === 0 ? shift(o, dx, dy) : o)),
  } as unknown as MontageSpec;
  return <MontageFromSpec spec={spec} />;
};
