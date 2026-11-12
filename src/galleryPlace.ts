import notes from "../data/gallery_notes.json";

/**
 * The gallery is the only reference for where and how big an element is (user 2026-11-10: «المعرض هو المرجع الوحيد»).
 * Every place the user sets in the gallery (data/gallery_notes.json → place.land / place.port {dx, dy, scale}) is applied by the engine
 * (MontageSpec `placed`) to EVERY item of that element's type in every video, in that orientation; an item's own dx/dy/k is added on top.
 * TYPE_OF maps a gallery element to the spec item type it draws (the same item RealLab shows in the gallery).
 */
export const TYPE_OF: Record<string, string> = {
  TornNote: "torn", WordScraps: "scraps", StatRow: "rows", RewriteWindow: "rewrite", Clock: "clock", VerseWords: "verse",
  NameCard1: "nameTag", NameCard3: "nameTag:pinned", Subscribe: "subscribe", Sources: "credit", PaperCover: "cover",
  PinnedPhoto: "scholar", TornPhoto: "tphoto", PopCard: "flag", NewsClip: "news", PaperScene: "scene",
  BgFullImage: "full", PaperMap: "pmap", TimelineTravel: "timeline", DashArc: "arc", DateCalendar: "date",
  KeyChip: "word", FamilyTree: "tree", PhoneChips: "phone",
  BrushX: "brushx", NoteCard: "note", TreeFx: "treefx", PanelToCanvas: "p2c", FlashCut: "flash", PhotoFrame: "pic", ReelVerseFull: "hadith",
};
type P = { dx: number; dy: number; k: number };
const N = notes as unknown as Record<string, { place?: Partial<Record<"land" | "port", { dx?: number; dy?: number; scale?: number }>> }>;
const BY_TYPE: Record<string, Partial<Record<"land" | "port", P>>> = {};
for (const [id, t] of Object.entries(TYPE_OF)) {
  const pl = N[id]?.place; if (!pl) continue;
  for (const o of ["land", "port"] as const) {
    const q = pl[o]; if (!q) continue;
    const p = { dx: Math.round(q.dx ?? 0), dy: Math.round(q.dy ?? 0), k: q.scale ?? 1 };
    if (p.dx || p.dy || p.k !== 1) (BY_TYPE[t] ??= {})[o] = p;
  }
}
/** the gallery place of an item (its type, nameTag split by style) for one orientation */
export const galleryPlace = (it: { t: string; style?: string }, o: "land" | "port"): P => {
  const key = it.t === "nameTag" && it.style === "pinned" ? "nameTag:pinned" : it.t;
  return BY_TYPE[key]?.[o] ?? { dx: 0, dy: 0, k: 1 };
};
