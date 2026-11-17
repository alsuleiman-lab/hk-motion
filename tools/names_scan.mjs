// Places he names → a paper map at the second he says them (user 2026-11-16, rules §8.1: «الأسماء: البلدان والمدن خرائط، والأشخاص صور في الثانية بالضبط»).
//   node tools/names_scan.mjs <p> [--write]   (reads .tmp/<p>/cut_words.json; writes .tmp/<p>/names.json; --write adds pmap items to data/specs/<p>.json)
// Countries: the Arabic table below (ISO3 = the codes of src/levantMap.ts / asiaMap.ts / worldMap.ts). Cities: data/geo/cities15000.txt, Arabic alternate names,
// population ≥ 150 000 (Arab and Muslim countries ≥ 40 000), minus a stop list of everyday words. Mentions within 6 s share one map; the map stays ≥ 1.5 s after the
// last name (rules §9.5) and at least 4 s. Never over an existing map / full-screen item. People are not guessed here: their pictures come from tools/fetch_images.mjs
// (names listed in the plan) and spec_draft places each at its first spoken second.
import fs from "node:fs";
import path from "node:path";

const [p, ...rest] = process.argv.slice(2);
if (!p) { console.error("usage: node tools/names_scan.mjs <p> [--write]"); process.exit(2); }
const T = path.join(".tmp", p);
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const words = read(path.join(T, "cut_words.json"), null);
if (!words) { console.error(`✘ ${T}/cut_words.json missing — run stage cut first`); process.exit(2); }

const norm = (s) => String(s).replace(/[ً-ْـ]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const bare = (w) => w.replace(/^(و|ف)?(ب|ل|ك)?(ال)?/, "");
const key = (s) => norm(s).split(" ").map(bare).filter(Boolean).join(" ");

// [Arabic forms…] → ISO3, centre [lon, lat]
const COUNTRIES = [
  [["سوريا", "سورية", "الشام"], "SYR", [38.5, 35]], [["العراق"], "IRQ", [43.7, 33.2]], [["لبنان"], "LBN", [35.9, 33.9]], [["الاردن"], "JOR", [36.5, 31.2]],
  [["فلسطين"], "PSX", [35.2, 31.9]], [["اسرائيل"], "ISR", [34.9, 31.4]], [["مصر"], "EGY", [30.8, 26.8]], [["السعوديه", "المملكه العربيه السعوديه", "بلاد الحرمين"], "SAU", [45, 24]],
  [["اليمن"], "YEM", [48, 15.6]], [["عمان", "سلطنه عمان"], "OMN", [57, 21]], [["الامارات"], "ARE", [54.3, 24]], [["قطر"], "QAT", [51.2, 25.3]], [["الكويت"], "KWT", [47.6, 29.3]],
  [["تركيا"], "TUR", [35, 39]], [["ايران"], "IRN", [53.7, 32.4]], [["قبرص"], "CYP", [33.2, 35.1]], [["السودان"], "SDN", [30, 15.5]], [["ليبيا"], "LBY", [17, 27]],
  [["الجزائر"], "DZA", [2.6, 28]], [["تشاد"], "TCD", [18.7, 15.4]], [["اثيوبيا", "الحبشه"], "ETH", [40.5, 9.1]], [["اريتريا"], "ERI", [39.8, 15.2]],
  [["افغانستان"], "AFG", [66, 33.9]], [["باكستان"], "PAK", [69.3, 30.4]], [["الهند"], "IND", [79, 22]], [["بنغلادش", "بنجلاديش"], "BGD", [90.3, 23.7]], [["الصين"], "CHN", [104, 35]],
  [["اوزبكستان"], "UZB", [64.6, 41.4]], [["تركمانستان"], "TKM", [59.5, 38.9]], [["طاجيكستان"], "TJK", [71.3, 38.9]], [["قيرغيزستان"], "KGZ", [74.8, 41.2]], [["كازاخستان"], "KAZ", [66.9, 48]],
  [["منغوليا"], "MNG", [103.8, 46.9]], [["تايلاند"], "THA", [101, 15.9]], [["سريلانكا"], "LKA", [80.8, 7.9]], [["نيبال"], "NPL", [84.1, 28.4]], [["ميانمار", "بورما"], "MMR", [96, 21.9]],
  [["بريطانيا", "انجلترا", "المملكه المتحده"], "GBR", [-2, 54]], [["فرنسا"], "FRA", [2.2, 46.2]], [["المانيا"], "DEU", [10.4, 51.2]], [["ايطاليا"], "ITA", [12.6, 42.8]],
  [["اسبانيا", "الاندلس"], "ESP", [-3.7, 40.4]], [["البرتغال"], "PRT", [-8.2, 39.4]], [["سويسرا"], "CHE", [8.2, 46.8]], [["السويد"], "SWE", [18.6, 60.1]], [["النرويج"], "NOR", [8.5, 60.5]],
  [["الدنمارك"], "DNK", [9.5, 56.3]], [["هولندا"], "NLD", [5.3, 52.1]], [["بلجيكا"], "BEL", [4.5, 50.5]], [["النمسا"], "AUT", [14.6, 47.5]], [["اليونان"], "GRC", [21.8, 39.1]],
  [["بولندا"], "POL", [19.1, 51.9]], [["التشيك"], "CZE", [15.5, 49.8]], [["ايرلندا"], "IRL", [-8.2, 53.4]], [["ايسلندا"], "ISL", [-19, 64.9]], [["لوكسمبورغ"], "LUX", [6.1, 49.8]],
];
const ATLAS = new Set(["TUR", "SYR", "SAU", "LBN", "JOR", "ISR", "PSX", "IRQ", "IRN", "EGY", "CYP", "UZB", "TKM", "THA", "TJK", "LKA", "PAK", "NPL", "MNG", "LAO", "KGZ", "KAZ", "IND", "CHN", "MMR", "BTN", "BGD", "AFG"]);

const places = new Map(); // key → {name, kind, iso3, lon, lat}
for (const [forms, iso3, [lon, lat]] of COUNTRIES) for (const f of forms) places.set(key(f), { name: forms[0], kind: "country", iso3, lon, lat });
// Cities: a chosen list (the open gazetteer turned everyday words into cities: «رياض، دين، أنه»). Names keep their article: «الرياض» never matches «رياض».
// Left out on purpose: names that are everyday words or another place (عمّان = عُمان، قم، مشهد، المدينة alone، بدر، أحد، تونس/الجزائر city = country).
const CITIES = `دمشق 36.29 33.51 SYR|حلب 37.16 36.2 SYR|حمص 36.72 34.73 SYR|حماه 36.75 35.13 SYR|اللاذقيه 35.78 35.52 SYR|طرطوس 35.89 34.89 SYR|ادلب 36.63 35.93 SYR|دير الزور 40.14 35.33 SYR|الرقه 39.01 35.95 SYR|درعا 36.1 32.62 SYR|السويداء 36.57 32.71 SYR|القامشلي 41.23 37.05 SYR|الحسكه 40.75 36.5 SYR|جبله 35.93 35.36 SYR|منبج 37.95 36.53 SYR|الغوطه 36.4 33.5 SYR|داريا 36.24 33.46 SYR|دوما 36.4 33.57 SYR|عفرين 36.87 36.51 SYR|سراقب 36.8 35.86 SYR|معره النعمان 36.67 35.65 SYR
|بغداد 44.36 33.31 IRQ|البصره 47.78 30.51 IRQ|الموصل 43.13 36.34 IRQ|الكوفه 44.4 32.03 IRQ|النجف 44.33 32 IRQ|كربلاء 44.02 32.62 IRQ|سامراء 43.87 34.2 IRQ|الفلوجه 43.78 33.35 IRQ|اربيل 44.01 36.19 IRQ|كركوك 44.39 35.47 IRQ|تكريت 43.68 34.6 IRQ|الرمادي 43.3 33.42 IRQ
|بيروت 35.5 33.89 LBN|طرابلس 35.84 34.44 LBN|صيدا 35.37 33.56 LBN|الضاحيه 35.51 33.85 LBN|الزرقاء 36.09 32.07 JOR|اربد 35.85 32.56 JOR
|القدس 35.22 31.78 PSX|بيت المقدس 35.22 31.78 PSX|غزه 34.47 31.5 PSX|الخليل 35.1 31.53 PSX|نابلس 35.26 32.22 PSX|رام الله 35.2 31.9 PSX|يافا 34.75 32.05 PSX|حيفا 34.99 32.79 PSX|عكا 35.07 32.93 PSX|جنين 35.3 32.46 PSX|رفح 34.25 31.29 PSX|خان يونس 34.3 31.34 PSX
|القاهره 31.24 30.04 EGY|الاسكندريه 29.92 31.2 EGY|الجيزه 31.21 30.01 EGY|سيناء 33.8 29.5 EGY|اسوان 32.9 24.09 EGY|الاقصر 32.64 25.69 EGY|اسيوط 31.18 27.18 EGY|المنصوره 31.38 31.04 EGY|طنطا 31 30.79 EGY
|مكه 39.83 21.42 SAU|مكه المكرمه 39.83 21.42 SAU|المدينه المنوره 39.61 24.47 SAU|الرياض 46.72 24.69 SAU|جده 39.17 21.49 SAU|الطائف 40.42 21.27 SAU|الدمام 50.1 26.43 SAU|تبوك 36.57 28.38 SAU|القصيم 43.97 26.33 SAU
|صنعاء 44.21 15.35 YEM|عدن 45.03 12.78 YEM|تعز 44.02 13.58 YEM|حضرموت 49 16 YEM|مارب 45.3 15.46 YEM|صعده 43.76 16.94 YEM
|دبي 55.3 25.27 ARE|ابوظبي 54.37 24.47 ARE|ابو ظبي 54.37 24.47 ARE|الدوحه 51.53 25.29 QAT|مسقط 58.4 23.59 OMN
|اسطنبول 28.98 41.01 TUR|انقره 32.85 39.93 TUR|عنتاب 37.38 37.07 TUR|غازي عنتاب 37.38 37.07 TUR|انطاكيه 36.16 36.2 TUR|قونيه 32.48 37.87 TUR|اورفا 38.79 37.16 TUR
|طهران 51.39 35.69 IRN|اصفهان 51.67 32.65 IRN|تبريز 46.29 38.08 IRN|شيراز 52.53 29.59 IRN
|كابل 69.18 34.53 AFG|قندهار 65.7 31.61 AFG|اسلام اباد 73.05 33.68 PAK|كراتشي 67 24.86 PAK|لاهور 74.35 31.55 PAK|دلهي 77.2 28.6 IND|بخارى 64.42 39.77 UZB|سمرقند 66.96 39.65 UZB
|الخرطوم 32.53 15.5 SDN|بنغازي 20.07 32.12 LBY
|لندن -0.13 51.51 GBR|باريس 2.35 48.86 FRA|برلين 13.4 52.52 DEU|روما 12.5 41.9 ITA|مدريد -3.7 40.42 ESP|قرطبه -4.78 37.88 ESP|غرناطه -3.6 37.18 ESP|اشبيليه -5.98 37.39 ESP|بروكسل 4.35 50.85 BEL|امستردام 4.9 52.37 NLD|ستوكهولم 18.07 59.33 SWE|فيينا 16.37 48.21 AUT|اثينا 23.73 37.98 GRC|جنيف 6.14 46.2 CHE`;
const cities = new Map();
for (const row of CITIES.replace(/\n/g, "").split("|")) { const m = /^(.+?) (-?[\d.]+) (-?[\d.]+) ([A-Z]{3})$/.exec(row.trim()); if (m) cities.set(norm(m[1]), { name: m[1], kind: "city", iso3: m[4], lon: +m[2], lat: +m[3] }); }
// spoken forms of one token: «وبالرياض» → الرياض; «بدمشق» → دمشق (and the raw word, for «بغداد»)
const forms = (w) => {
  const a = w.replace(/^(و|ف)(?=..)/, ""), out = new Set([w, a]);
  out.add(a.replace(/^(ب|ك)(?=ال)/, "").replace(/^لل/, "ال"));
  if (!a.startsWith("ال")) out.add(a.replace(/^(ب|ل|ك)(?=...)/, ""));
  return [...out];
};
const maxLen = Math.max(...[...places.keys(), ...cities.keys()].map((k) => k.split(" ").length));
const raw = words.map((w) => norm(w.w)), nw = raw.map(bare);
const hits = [];
for (let i = 0; i < nw.length; i++) for (let n = Math.min(maxLen, 3); n >= 1; n--) {
  const tail = raw.slice(i + 1, i + n).join(" ");
  const pl = forms(raw[i]).map((f) => cities.get((f + (tail ? " " + tail : "")).trim())).find(Boolean) ?? places.get(nw.slice(i, i + n).join(" "));
  if (pl) { hits.push({ ...pl, said: words.slice(i, i + n).map((w) => w.w).join(" "), at: +words[i].s.toFixed(2) }); i += n - 1; break; }
}
// group: mentions within 6 s → one map
const groups = [];
for (const h of hits) { const g = groups.at(-1); if (g && h.at - g.at.at(-1) <= 6) { g.hits.push(h); g.at.push(h.at); } else groups.push({ hits: [h], at: [h.at] }); }
fs.writeFileSync(path.join(T, "names.json"), JSON.stringify({ places: hits, maps: groups.length }, null, 1));
console.log(`names: ${hits.length} place mention(s) in ${groups.length} map(s)`);
for (const g of groups) console.log(`  ${g.at[0].toFixed(1)} s  ${g.hits.map((h) => h.said + (h.kind === "city" ? "" : " (بلد)")).join("، ")}`);

if (rest.includes("--write")) {
  const specF = path.join("data", "specs", `${p}.json`), spec = read(specF, null);
  if (!spec) { console.error(`✘ ${specF} missing`); process.exit(2); }
  const busy = (spec.items ?? []).filter((it) => ["pmap", "full", "verse", "hadith"].includes(it.t)).map((it) => [it.from ?? it.at, it.to ?? it.until ?? (it.at ?? 0) + 5]);
  let added = 0;
  for (const g of groups) {
    const from = +(g.at[0] - 0.1).toFixed(2), to = +Math.max(g.at.at(-1) + 1.5, from + 4).toFixed(2);
    if (busy.some(([a, b]) => from < b && to > a)) continue;
    const codes = [...new Set(g.hits.map((h) => h.iso3).filter(Boolean))];
    const pts = g.hits.filter((h) => h.kind === "city").map((h) => ({ name: h.said.replace(/^(و|ف)?(ب|ل)?/, ""), lon: +h.lon.toFixed(2), lat: +h.lat.toFixed(2), at: h.at }));
    const all = g.hits.map((h) => [h.lon, h.lat]), lons = all.map((a) => a[0]), lats = all.map((a) => a[1]);
    const center = [+((Math.min(...lons) + Math.max(...lons)) / 2).toFixed(1), +((Math.min(...lats) + Math.max(...lats)) / 2).toFixed(1)];
    const spanLat = +Math.min(60, Math.max(8, (Math.max(...lats) - Math.min(...lats)) * 1.8, (Math.max(...lons) - Math.min(...lons)) * 1.1)).toFixed(1);
    const atlas = codes.every((c) => ATLAS.has(c));
    spec.items.push({ t: "pmap", from, to, center, spanLat, landCenter: center, landSpan: spanLat,   /* size and place: the gallery's (galleryRef specs, user 2026-11-17) */
      highlight: codes, highlightAt: Object.fromEntries(codes.map((c) => [c, g.hits.find((h) => h.iso3 === c).at])), ...(atlas ? { atlas: true } : { geo: "world" }), pts, auto: "names_scan" });
    busy.push([from, to]); added++;
  }
  spec.items.sort((a, b) => (a.at ?? a.from) - (b.at ?? b.from));
  fs.writeFileSync(specF, JSON.stringify(spec, null, 1));
  console.log(`✔ ${added} map(s) added to ${specF}${groups.length - added ? ` (${groups.length - added} skipped: another map / full-screen item there)` : ""}`);
}
