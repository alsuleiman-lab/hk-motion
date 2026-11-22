// (2026-11-22) the HadithCompare element (src/PickKit2.tsx): the difference between two wordings is COMPUTED (src/hadithDiff.ts), never typed by hand
import { pathToFileURL } from "node:url";
export default async ({ add, expect, path, ROOT }) => {
  const F = "src/hadithDiff.ts";
  const load = async () => (await import(pathToFileURL(path.join(ROOT, F)).href));
  const words = (s, d) => s.trim().split(/\s+/).filter((_, i) => d[i]);
  add("hadith.diff_words", [F, "src/PickKit2.tsx"], "hadith-compare-element", "مقارنة لفظي حديث: الكلمات المختلفة تُحسب من النصين (بلا تشكيل ولا همزات)", async () => {
    const { hadithDiff } = await load();
    const A = "إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى", B = "إنما الأعمال بالنية وإنما لامرئ ما نوى";
    const [da, db] = hadithDiff(A, B);
    return expect(words(A, da).join(" ") === "بِالنِّيَّاتِ لِكُلِّ امْرِئٍ" && words(B, db).join(" ") === "بالنية لامرئ", `A=${words(A, da)} B=${words(B, db)}`);
  });
  add("hadith.diff_same", [F], "hadith-compare-element", "لفظان متطابقان (ولو اختلف التشكيل والهمزة وعلامة ﷺ): لا فرق", async () => {
    const { hadithDiff } = await load();
    const [da, db] = hadithDiff("قال رسول الله ﷺ إنَّمَا الأعمال", "قال رسول الله إنما الأعمال");
    return expect(!da.some(Boolean) && !db.some(Boolean), `${da} | ${db}`);
  });
  add("hadith.diff_extra", [F], "hadith-compare-element", "زيادة في رواية: الكلمات الزائدة وحدها تُضيء، ولا يُضيء المتفق عليه", async () => {
    const { hadithDiff } = await load();
    const A = "فمن كانت هجرته إلى الله ورسوله فهجرته إلى الله ورسوله", B = "فمن كانت هجرته إلى الله ورسوله";
    const [da, db] = hadithDiff(A, B);
    return expect(words(A, da).join(" ") === "فهجرته إلى الله ورسوله" && !db.some(Boolean), `A=${words(A, da)} B-diff=${db.filter(Boolean).length}`);
  });
};
