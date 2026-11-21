// THE COVER FIRST (user 2026-11-21, GTA 6 reels rendered without their cover: «يعني يكون الغلاف في أوله»): every episode and reel spec starts with the cover item
// that shows the project's cover picture. One place for the rule:
//   coverItem(id, spec)  → the default {t:"cover", style:"image", src, srcPort} (spec_draft.mjs and reel_from_episode.mjs put it first; copies .tmp/<p>/covers/<name>.png
//                          to public/<p>/cover_<name>.png when only the cover agent's file exists — a NEW name, never a replacement)
//   coverFailure(id, spec) → "" or the Arabic reason a FULL render / final review refuses the spec (gpu_render.mjs, render_queue.mjs admit, final_review.mjs)
//   node tools/cover_item.mjs <spec-id>          → check (exit 1 + reason on failure)
//   node tools/cover_item.mjs <spec-id> --fix    → put the default cover item first when there is none (an existing cover item is only moved to the front)
// Names: episode <p> = public/<p>/cover_land.png (portrait cover_port.png when it exists); reel <p>-<x> (fromEpisode.project = <p>) = public/<p>/cover_<x with _>.png.
// Exempt: kinds that have no cover (cartoon: «كرتون: بلا غلاف», paper, ad, explainer).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
export const NO_COVER_KINDS = ["cartoon", "paper", "ad", "explainer"];
const IMG = /\.(png|jpe?g|webp|gif|avif)$/i;

export function coverNames(id, spec = {}) {
  const proj = spec.fromEpisode?.project ?? id;
  const name = spec.kind === "reel" ? (id.startsWith(proj + "-") ? id.slice(proj.length + 1) : id).replace(/-/g, "_") : "land";
  return { proj, name, src: `${proj}/cover_${name}.png`, agent: path.join(".tmp", proj, "covers", `${name}.png`) };
}

export function coverItem(id, spec = {}) {
  const { proj, src, agent } = coverNames(id, spec);
  const pub = path.join(root, "public", src), fromAgent = path.join(root, agent);
  if (!fs.existsSync(pub) && fs.existsSync(fromAgent)) { fs.mkdirSync(path.dirname(pub), { recursive: true }); fs.copyFileSync(fromAgent, pub); }
  const port = spec.kind !== "reel" && fs.existsSync(path.join(root, "public", proj, "cover_port.png")) ? `${proj}/cover_port.png` : null;
  return { t: "cover", style: "image", src, srcPort: spec.kind === "reel" ? src : port ?? src };
}

/** the cover item(s) to the front, the rest in their order */
export const coverFirst = (items) => [...items.filter((i) => i.t === "cover"), ...items.filter((i) => i.t !== "cover")];

const files = (v, out = []) => { if (typeof v === "string") { if (IMG.test(v)) out.push(v); } else if (v && typeof v === "object") for (const x of Object.values(v)) files(x, out); return out; };

export function coverFailure(id, spec) {
  if (!spec || NO_COVER_KINDS.includes(spec.kind)) return "";
  const first = (spec.items ?? [])[0], want = coverNames(id, spec).src;
  if (!first || first.t !== "cover") return `✘ الغلاف ليس أول عنصر في مونتاج «${id}»: كل حلقة وريل تبدأ بالغلاف (أمر المستخدم 2026-11-21: «يعني يكون الغلاف في أوله»). أضفه: node tools/cover_item.mjs ${id} --fix (الصورة public/${want}). لا رندر.`;
  const pics = [...new Set(files(first))], miss = pics.filter((f) => !fs.existsSync(path.join(root, "public", f)));
  if (!pics.length) return `✘ عنصر الغلاف في «${id}» بلا صورة: ضع صورة الغلاف (public/${want}). لا رندر.`;
  if (miss.length) return `✘ صورة الغلاف مفقودة في «${id}»: ${miss.map((f) => `public/${f}`).join("، ")} — انسخها من وكيل الغلاف (${coverNames(id, spec).agent}) أو صحّح المسار. لا رندر.`;
  return "";
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const id = process.argv[2]; if (!id) { console.error("usage: node tools/cover_item.mjs <spec-id> [--fix]"); process.exit(2); }
  const f = path.join(root, "data", "specs", `${id}.json`); let spec; try { spec = JSON.parse(fs.readFileSync(f, "utf8")); } catch { console.error(`✘ لا مواصفة ${f}`); process.exit(2); }
  if (process.argv.includes("--fix") && !NO_COVER_KINDS.includes(spec.kind)) {
    const had = (spec.items ?? []).some((i) => i.t === "cover");
    spec.items = coverFirst(had ? spec.items : [coverItem(id, spec), ...(spec.items ?? [])]);
    fs.writeFileSync(f, JSON.stringify(spec, null, 1)); console.log(had ? "✔ الغلاف نُقل إلى أول المونتاج" : `✔ أُضيف الغلاف أول المونتاج: ${spec.items[0].src}`);
  }
  const why = coverFailure(id, spec); console.log(why || `✔ الغلاف أول عنصر في «${id}» وصورته موجودة`); process.exit(why ? 1 : 0);
}
