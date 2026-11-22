import fs from "node:fs";
import path from "node:path";

/* Windows environment names are case-insensitive, but a plain-object copy of process.env ({...process.env}, a bash-inherited env) keeps the
   spelling it was given: `Path` or `PATH`, `ProgramFiles` or `PROGRAMFILES`. Every lookup here ignores case, and PATH is edited under the key it already has. */
const keysOf = (env, name) => Object.keys(env).filter((k) => k.toLowerCase() === name.toLowerCase());
const getEnv = (env, name) => { for (const k of keysOf(env, name)) if (env[k] !== undefined && env[k] !== "") return String(env[k]); return undefined; };
const same = (a, b) => path.win32.resolve(a).replace(/[\\/]+$/, "").toLowerCase() === path.win32.resolve(b).replace(/[\\/]+$/, "").toLowerCase();
const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };

/** Resolve Git Bash explicitly on Windows. `bash.exe` on PATH can be the
 * WindowsApps WSL launcher, which fails with EACCES when WSL is unavailable.
 * Throws only when called (never at import): a tool that never launches bash keeps working without Git. */
export const bashExecutable = (env = process.env, platform = process.platform) => {
  if (platform !== "win32") return "bash";
  const given = getEnv(env, "HK_GIT_BASH");
  if (given !== undefined) {   // an explicit choice is validated loudly, never silently replaced
    if (/\\WindowsApps\\/i.test(given)) throw new Error(`HK_GIT_BASH="${given}" يشير إلى مشغّل WSL في WindowsApps وهو يفشل بـEACCES؛ ضعه على bash.exe الخاص بـGit (…\\Git\\bin\\bash.exe). HK_GIT_BASH points at the WindowsApps/WSL alias.`);
    if (!isFile(given)) throw new Error(`HK_GIT_BASH="${given}" ليس ملفاً موجوداً؛ صحّح مساره إلى bash.exe الخاص بـGit أو احذف المتغير. HK_GIT_BASH does not point at an existing file.`);
    return given;
  }
  const tried = [];
  for (const name of ["ProgramFiles", "ProgramW6432", "ProgramFiles(x86)"]) {
    const base = getEnv(env, name); if (!base) continue;
    const candidate = path.win32.join(base, "Git", "bin", "bash.exe"); tried.push(candidate);
    if (!/\\WindowsApps\\/i.test(candidate) && isFile(candidate)) return candidate;
  }
  const local = getEnv(env, "LOCALAPPDATA");
  if (local) { const candidate = path.win32.join(local, "Programs", "Git", "bin", "bash.exe"); tried.push(candidate); if (isFile(candidate)) return candidate; }
  throw new Error(`Git Bash was not found (جرّبت: ${tried.join("، ") || "لا ProgramFiles في البيئة"}). ثبّت Git for Windows أو اضبط HK_GIT_BASH على مسار bash.exe؛ لن أستعمل مشغّل WindowsApps/WSL.`);
};

/** Put the selected Git Bash first so shell scripts can call `bash` too. The result has ONE path variable, under the name it already had. */
export const envWithBash = (env = process.env, platform = process.platform) => {
  if (platform !== "win32") return { ...env };
  const exe = bashExecutable(env, platform), out = { ...env };
  if (!path.win32.isAbsolute(exe)) return out;
  const dir = path.win32.dirname(exe), pathKeys = keysOf(out, "PATH"), key = pathKeys[0] ?? "Path";
  const entries = [];   // the union of every spelling (an earlier buggy copy may hold both `Path` and `PATH`), blanks dropped, Git first
  for (const k of pathKeys) for (const e of String(out[k] ?? "").split(";")) if (e.trim() && !entries.some((x) => same(x, e))) entries.push(e);
  for (const k of pathKeys) delete out[k];
  out[key] = [dir, ...entries.filter((e) => !same(e, dir))].join(";");
  return out;
};
