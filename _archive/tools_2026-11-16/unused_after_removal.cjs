// Which src files become unreachable if the Root.tsx lines matching the given regexes are removed (dependency walk from src/index.ts).
//   node tools/unused_after_removal.cjs "Lesson58" "Musk" ...  -> prints the src files to delete together with those compositions.
// Then also remove their tools/ scripts, public/ assets and .tmp/render_work temps, and finally run tsc + `npx remotion compositions src/index.ts`.
const fs = require("fs"), path = require("path");
const files = new Map();
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(tsx?|json)$/.test(f.name)) files.set(p.split(String.fromCharCode(92)).join("/"), fs.readFileSync(p, "utf8")); } };
walk("src");
const resolve = (from, spec) => { if (!spec.startsWith(".")) return null; const base = path.posix.join(path.posix.dirname(from), spec); for (const e of ["", ".ts", ".tsx", ".json", "/index.ts", "/index.tsx"]) { if (files.has(base + e)) return base + e; } return null; };
const deps = (f) => { const t = files.get(f); const out = new Set(); for (const m of t.matchAll(/(?:from|require\()\s*["']([^"']+)["']/g)) { const r = resolve(f, m[1]); if (r) out.add(r); } return out; };
const reach = (roots) => { const seen = new Set(); const st = [...roots]; while (st.length) { const f = st.pop(); if (seen.has(f)) continue; seen.add(f); for (const d of deps(f)) st.push(d); } return seen; };
const before = reach(["src/index.ts"]);
const del = process.argv.slice(2).map((s) => new RegExp(s));
files.set("src/Root.tsx", files.get("src/Root.tsx").split(/\r?\n/).filter((l) => !del.some((r) => r.test(l))).join("\n"));
const after = reach(["src/index.ts"]);
console.log([...before].filter((f) => !after.has(f)).join("\n"));
