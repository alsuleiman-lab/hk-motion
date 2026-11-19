// ONE NAME FOR THE CUT (user 2026-11-19: «ما نحتاج ملفات كثيرة»): a new version of the cut video takes the place of the old file under the SAME name, atomically, instead of a new
// `<p>_cut_s_b<n>.mp4` beside it every time. The Studio plays the light copy (its name carries a version), never this heavy file, so replacing it is safe; its light copy
// (`<name>_prev_<v>.mp4/.m4a`, registered in data/preview_proxies.json) moves to the same name and the old light copy goes. If the file is held open (a render reading it) the rename fails and
// the caller keeps the versioned name as before. Returns true when the new file now has the old file's name.
import fs from "node:fs";
import path from "node:path";

export const swapInPlace = ({ fresh, target, freshVersion }) => {
  try {
    const LIST = path.join("data", "preview_proxies.json"), px = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, "utf8")) : {};
    const rel = (f) => path.relative("public", f).replace(/\\/g, "/");
    const fb = fresh.replace(/\.mp4$/i, ""), tb = target.replace(/\.mp4$/i, ""), kf = rel(fresh), kt = rel(target), v0 = px[kt];
    fs.renameSync(fresh, target);   // atomic replace
    const v1 = freshVersion ?? px[kf];
    if (v1) for (const ext of ["mp4", "m4a"]) { const from = `${fb}_prev_${v1}.${ext}`, to = `${tb}_prev_${v1}.${ext}`; if (fs.existsSync(from)) { try { fs.rmSync(to, { force: true }); } catch { /* held */ } fs.renameSync(from, to); } }
    if (v0 && v0 !== v1) for (const ext of ["mp4", "m4a"]) { try { fs.rmSync(`${tb}_prev_${v0}.${ext}`, { force: true }); } catch { /* the Studio still reads it: the next proxy run removes it */ } }
    delete px[kf];
    if (v1 && fs.existsSync(`${tb}_prev_${v1}.mp4`)) px[kt] = v1; else delete px[kt];   // no light copy for the new file: the Studio plays it itself until `check` makes one
    fs.writeFileSync(LIST, JSON.stringify(px, null, 1));
    return true;
  } catch { return false; }
};
