// (2026-11-22, user order, mandatory: the Studio's left list is FOLDERS by kind — حلقات، ريلز، بثوث، دروس، كرتون … — and inside each ONE folder per project) the list had loose rows between
// the folders. tools/studio_tree.mjs reads the tree from the code and fails on a loose composition, a repeated id, a kind folder holding another kind, a composition with no project folder,
// two sibling folders of one name. READ-ONLY on the real workspace (the real src/Root.tsx is only read); the fake specs and the fake Root are written under .tmp/selftest only.
export default async ({ add, expect, put, RUN, ROOT, path }) => {
  const { pathToFileURL } = await import("node:url");
  const load = async () => (await import(pathToFileURL(path.join(ROOT, "tools", "studio_tree.mjs")).href));
  const FILES = ["tools/studio_tree.mjs", "src/studioFolders.ts"];

  add("studio_folders.real_tree", FILES, null, "قائمة الاستوديو الحقيقية: كل تركيبة في مجلد نوعها ثم مجلد مشروعها، لا واحدة في الأعلى، ولا معرّف مكرر", async () => {
    const { buildTree } = await load(), t = buildTree();
    const top = new Set(t.comps.map((c) => c.path[0]));
    return expect(t.problems.length === 0 && t.comps.length > 0 && !top.has(undefined), t.problems.slice(0, 4).join(" | ") || "لا تركيبات");
  });

  add("studio_folders.spec_lands_by_itself", FILES, null, "مواصفة جديدة تقع وحدها في مجلد نوعها ومجلد مشروعها: الحلقة وريلها بالاسم نفسه، ومقاطع الدرس معاً، ومقاطع البث تحت البث، والمعرّفات كما هي", async () => {
    const { buildTree } = await load(), d = path.join(RUN, "studio_folders_specs");
    const sp = (n, o) => put(path.join(d, `${n}.json`), { title: `عنوان ${n}`, frames: 1800, cut: `${n}_cut_s.mp4`, date: "2026-11-22", ...o });
    sp("zzf-ep", { title: "حلقة تجريبية للمجلدات" }); sp("zzf-ep-reel", { kind: "reel" }); sp("zzbook9_1", { kind: "reel" }); sp("zzbook9_2", { kind: "reel" });
    sp("s1122_zzclip", { kind: "reel" }); sp("stream_1122_7", {}); sp("zzf-off", { studio: false });
    const t = buildTree({ specDir: d }), at = (id) => t.comps.find((c) => c.id === id)?.path.join(" / ");
    const bad = [];
    const chk = (id, want) => { const got = at(id); if (got !== want) bad.push(`${id}: ${got} ≠ ${want}`); };
    chk("Zzf-Ep", "حلقات / حلقة تجريبية للمجلدات"); chk("Zzf-Ep-Both", "حلقات / حلقة تجريبية للمجلدات"); chk("Zzf-Ep-Reel", "ريلز / حلقة تجريبية للمجلدات");
    chk("Zzbook9_1", "دروس / zzbook9"); chk("Zzbook9_2", "دروس / zzbook9");
    chk("S1122_zzclip", "بثوث / بث 22-11"); chk("Stream_1122_7-L", "بثوث / بث 22-11");
    if (at("Zzf-Off") !== undefined) bad.push("مواصفة studio:false ظهرت");
    return expect(bad.length === 0 && t.problems.length === 0, bad.concat(t.problems).join(" | "));
  });

  add("studio_folders.catches_mistakes", FILES, null, "الفاحص يرفض: تركيبة في الأعلى، بلا مجلد مشروع، في مجلد نوع آخر، معرّف مكرر، ومجلدان بالاسم نفسه", async () => {
    const { buildTree } = await load(), r = path.join(RUN, "studio_folders_fake");
    put(path.join(r, "src", "Root.tsx"), `<ByRecency>
  <Composition id="ZzLoose" component={X} durationInFrames={30} fps={30} width={1080} height={1920} />
  <Folder name="دبلجة"><Composition id="Dub-ZzNoProject" component={X} durationInFrames={30} fps={30} width={1080} height={1920} /></Folder>
  <Folder name="ريلز"><Folder name="p"><Composition id="Dub-ZzWrongKind" component={X} durationInFrames={30} fps={30} width={1080} height={1920} /></Folder></Folder>
  <Folder name="دبلجة"><Folder name="q"><Composition id="Dub-ZzOk" component={X} durationInFrames={30} fps={30} width={1080} height={1920} /><Composition id="Dub-ZzOk" component={X} durationInFrames={30} fps={30} width={1080} height={1920} /></Folder></Folder>
</ByRecency>`);
    put(path.join(r, "src", "compositionTitles.ts"), "export const COMPOSITION_TITLES = {};\n");
    const t = buildTree({ root: r, specDir: path.join(r, "data", "specs") }), all = t.problems.join(" | ");
    const need = [["ZzLoose", "في أعلى القائمة"], ["Dub-ZzNoProject", "بلا مجلد مشروع"], ["Dub-ZzWrongKind", "والمفروض"], ["Dub-ZzOk", "مكرر"], ["دبلجة", "بالاسم نفسه"]];
    const miss = need.filter(([k, w]) => !t.problems.some((p) => p.includes(k) && p.includes(w))).map(([k, w]) => `${k}/${w}`);
    return expect(miss.length === 0, `لم يُرفض: ${miss.join("، ")} — ما رُفض: ${all}`);
  });

  add("studio_folders.kind_rule_agrees", FILES, null, "قاعدة نوع المواصفة في الاستوديو (src/studioFolders.ts) = قاعدة tools/comp_kinds.mjs", async () => {
    const K = await import(pathToFileURL(path.join(ROOT, "tools", "comp_kinds.mjs")).href);
    const SF = await (async () => { const ew = process.emitWarning; process.emitWarning = () => {}; try { return await import(pathToFileURL(path.join(ROOT, "src", "studioFolders.ts")).href); } finally { process.emitWarning = ew; } })();
    const cases = [["zz-full", {}], ["zz-reel", { kind: "reel" }], ["tirmidhi32_3", {}], ["q2_01", { kind: "reel" }], ["stream_zz", { kind: "reel" }], ["Stream-Zz", {}], ["zz-lesson", { kind: "lesson" }], ["zz-stream", { kind: "stream" }]];
    const bad = cases.filter(([p, s]) => SF.specKind(p, s) !== K.specKind(p, s)).map(([p, s]) => `${p}: ${SF.specKind(p, s)} ≠ ${K.specKind(p, s)}`);
    return expect(bad.length === 0, bad.join(" | "));
  });
};
