// (2026-11-21) clean_temp walked into symbolic links/junctions and deleted the real folder behind them; tools/montage_build.mjs sandboxes link real folders
export default async ({ add, expect, put, RUN, ROOT, path, fs }) => {
  add("clean.no_follow_links", "tools/clean_temp.mjs", "clean-temp-follows-links", "التنظيف يحذف الرابط نفسه ولا يدخل فيه: الملف الحقيقي خلف الرابط يبقى", async () => {
    const base = path.join(RUN, "clean_links"), real = path.join(base, "real"), victim = path.join(base, "victim");
    put(path.join(real, "keep.txt"), "x"); fs.mkdirSync(victim, { recursive: true }); fs.symlinkSync(real, path.join(victim, "link"), "junction");
    const src = fs.readFileSync(path.join(ROOT, "tools", "clean_temp.mjs"), "utf8"), a = src.indexOf("const dropLink"), b = src.indexOf("\n}\n", src.indexOf("function removeDirOrFile")) + 3;
    if (a < 0) return expect(false, "dropLink اختفى من clean_temp.mjs");
    const removeDirOrFile = new Function("fs", "path", src.slice(a, b) + ";return removeDirOrFile;")(fs, path);
    removeDirOrFile(victim);
    return expect(!fs.existsSync(victim) && fs.existsSync(path.join(real, "keep.txt")), `المجلد حُذف=${!fs.existsSync(victim)} الملف الحقيقي باقٍ=${fs.existsSync(path.join(real, "keep.txt"))}`);
  });
};
