import React from "react";
import { MontageFromSpec } from "./MontageSpec";
import type { MontageSpec, SpecItem } from "./MontageSpec";
import type { BrandName } from "./brand";
import { GALLERY_CUT, GALLERY_MATTE } from "./galleryCut";

/**
 * RealLab — the gallery draws an element through the montage engine itself (user 2026-10-30: «أريد شيء حقيقي فعلاً … بالمونتاج فريم حقيقي لي»):
 * a mini spec over his real recording, one item with the same fields a real spec uses, so size, place, title bar and source line are exactly what a
 * video gets, in both orientations (the engine picks the layout from the frame shape). Portrait fields are the item's own, landscape ones its `land`.
 * Screen modes (user 2026-10-31): full = his whole frame; half = a source beside him (split layout); iso = his background isolated (spec `matte` + `behind`).
 * Places follow the grid of the mode (data/layout_grids.json): landscape left [40,150,640,830] · right [1300,150,1880,830] · key [300,840,1620,985];
 * portrait band [40,1312,1040,1696] under the beard.
 */
const A = 0.1, U = 2.9;
type R = { item: SpecItem | SpecItem[]; spec?: Partial<MontageSpec> };
const ISO: Partial<MontageSpec> = { matte: { src: GALLERY_MATTE, start: 0 }, behind: [{ from: 0, to: 3 }] };
const SOURCE: SpecItem = { t: "credit", text: "المصدر: اسم الموقع — 29/10/2026", from: 0.3, to: U };
const it = (o: Record<string, unknown>) => o as unknown as SpecItem;
const REAL: Record<string, R> = {
  // writing
  TornNote: { item: it({ t: "torn", text: "البناء على القبور حرام", at: A, until: U, underline: 2, size: 54, y: 1380, land: { x: 960, y: 846, size: 50 } }) },
  WordScraps: { item: it({ t: "scraps", text: "كلام مهم من كلامه", at: A, until: U, y: 1420, land: { y: 870 } }) },
  StatRow: { item: it({ t: "rows", from: A, to: U, y0: 1040, step: 160, rowH: 140, title: { at: A, text: "من كلام أحد المعمّمين" }, rows: [{ at: 0.4, label: "البند الأول من كلامه", icon: "Quote" }, { at: 1.1, label: "البند الثاني من كلامه", icon: "Quote" }] }) },
  RewriteWindow: { item: it({ t: "rewrite", x: 90, y: 1345, w: 900, oldText: "العبارة القديمة", newText: "العبارة الأحسن", oldAt: A + 0.4, strikeAt: 0.9, newAt: 1.4, until: U, land: { x: 40, y: 200, w: 600 } }) },
  Clock: { item: it({ t: "clock", at: A, until: U, x: 390, y: 1350, size: 300, land: { x: 160, y: 300, size: 360 } }) },
  VerseWords: { item: it({ t: "verse", words: ["مُّحَمَّدٌ", "رَّسُولُ", "ٱللَّهِ"], times: [0.4, 0.9, 1.3], title: "سُورَةُ الفَتۡحِ", refText: "الآية 29", x: 90, y: 700, w: 900, size: 56, until: U, land: { x: 40, y: 150, w: 860, size: 54 } }), spec: { shifts: [{ from: 0, to: 3, dx: 430 }] } },
  // the channel's fixed pieces
  NameCard1: { item: it({ t: "nameTag", at: 0.2, x: 540, y: 1535, dur: 2.4 }) },
  NameCard3: { item: it({ t: "nameTag", at: 0.2, x: 540, y: 1535, dur: 2.4, style: "pinned" }) },
  Subscribe: { item: it({ t: "subscribe", at: 0.2, x: 490, y: 1490, dur: 2.5 }) },   // bottom right in both orientations (user 2026-10-31)
  Sources: { item: it({ t: "credit", text: "https://example.org/source-of-the-figure", from: A, to: U }) },
  PaperCover: { item: it({ t: "cover", style: "paper", kit: { line1: "عنوان الغلاف", line2: "سطر تحت العنوان" } }) },
  PushIn: { item: [], spec: { zooms: [{ from: 0.4, to: 1.9, amt: 0.08 }] } },
  // pictures and sources
  PinnedPhoto: { item: [it({ t: "scholar", src: "people/sheikh_ibn_uthaymeen_real.png", name: "ابن عثيمين", sub: "رحمه الله (ت 1421هـ)", at: A, until: U, x: 420, y: 1330, w: 220, h: 270, pos: "50% 20%" }), SOURCE] },
  TornPhoto: { item: [it({ t: "tphoto", src: "people/sheikh_ibn_uthaymeen_real.png", name: "ابن عثيمين", at: A, until: U, x: 410, y: 1330, w: 260, h: 280 }), SOURCE] },
  PopCard: { item: [it({ t: "flag", code: "it", at: A, until: U, x: 390, y: 1380, w: 300 })] },   // the spring pop is used with country flags (user 2026-10-30)
  NewsClip: { item: [it({ t: "news", src: "people/azharCourt.jpg", headline: "عنوان الخبر كما في الصحيفة", source: "الجزيرة نت — 28/10/2026", at: A, until: U, x: 190, y: 1340, w: 700, h: 177 }), SOURCE] },
  PaperScene: { item: it({ t: "scene", at: A, until: U, x: 140, y: 1330, w: 800, h: 340, pieces: [{ src: "collage/car.png", x: 30, y: 40, w: 300, at: 0.3, rot: -3, from: "left" }, { src: "collage/robe.png", x: 420, y: 10, w: 230, at: 0.9, rot: 2, from: "top" }] }) },
  // isolated background: he is cut out over what stands behind him
  BgFullImage: { item: it({ t: "full", src: "people/azharMosque.jpg", from: 0, to: 3, marker: { x: 640, y: 120, w: 420, h: 420, at: 1.5 }, land: { marker: { x: 1180, y: 20, w: 560, h: 560, at: 1.5 } } }), spec: ISO },
  PaperMap: { item: it({ t: "pmap", iso: true, from: A, to: U, x: 0, y: 0, w: 1080, h: 1920, center: [39.44, 33.13], spanLat: 12, landCenter: [41.5, 34.93], landSpan: 7,   // the route stays clear of him (user 2026-10-31: «لازم صورتي لا تغطي المكان الذي نتحدث عنه»)
    highlight: ["Syria"], pts: [{ name: "دمشق", lon: 36.3, lat: 33.5, at: 0.3 }, { name: "حلب", lon: 37.2, lat: 36.2, at: 0.7 }], legs: [{ from: [36.3, 33.5], to: [37.2, 36.2], at: 1.0, dur: 1.2, car: true }] }), spec: ISO },
  // movement and flow
  TimelineTravel: { item: it({ t: "timeline", stages: [{ at: A, date: "٦٩٠ هـ", title: "المرحلة الأولى", sub: "ميلاده" }, { at: 0.9, date: "٧٤٠ هـ", title: "المرحلة الثانية" }, { at: 1.7, date: "٧٩٠ هـ", title: "المرحلة الثالثة" }], from: 0, to: 3 }) },
  DashArc: { item: [
    it({ t: "arc", only: "land", at: A, until: U, arcAt: 0.9, a: { src: "people/ibn_uthaymeen.jpg", name: "ابن عثيمين", x: 1360, y: 330, w: 250, h: 320 }, b: { src: "broll/ahmed_el_tayeb.jpg", name: "أحمد الطيب", x: 310, y: 330, w: 250, h: 320 } }),
    it({ t: "arc", only: "port", at: A, until: U, arcAt: 0.9, a: { src: "people/ibn_uthaymeen.jpg", name: "ابن عثيمين", x: 640, y: 1320, w: 200, h: 220 }, b: { src: "broll/ahmed_el_tayeb.jpg", name: "أحمد الطيب", x: 240, y: 1320, w: 200, h: 220 } }),
  ] },
  PhoneChips: { item: it({ t: "phone", at: A, to: U, src: "gallery_opp_clip.mp4", dur: 3 }) },
};

export const hasReal = (id: string) => id in REAL;
/** gallery grid mode: the item moves by (dx, dy) through the fields the engine reads in that orientation (portrait: x / y / y0; landscape: its `land` override when it has one) */
const shift = (o: SpecItem, dx: number, dy: number, orient: "land" | "port"): SpecItem => {
  if (!dx && !dy) return o;
  const mv = (q: Record<string, unknown>) => { const n = { ...q }; for (const [k, d] of [["x", dx], ["y", dy], ["y0", dy]] as const) if (typeof n[k] === "number") n[k] = (n[k] as number) + d; return n; };
  const n = { ...(o as unknown as Record<string, unknown>) };
  if (orient === "land" && n.land && typeof n.land === "object") n.land = mv(n.land as Record<string, unknown>);
  else return mv(n) as unknown as SpecItem;
  return n as unknown as SpecItem;
};
export const realScene = (id: string, brand?: BrandName, dx = 0, dy = 0, orient: "land" | "port" = "land"): React.ReactNode => {
  const r = REAL[id]; if (!r) return null;
  const spec = {
    id: "gallery_" + id, title: "عنوان الفيديو", frames: 90, brand, cut: GALLERY_CUT,
    ...(r.spec ?? {}),
    items: (Array.isArray(r.item) ? r.item : [r.item]).map((q, i) => (i === 0 ? shift(q, dx, dy, orient) : q)),
  } as unknown as MontageSpec;
  return <MontageFromSpec spec={spec} />;
};
