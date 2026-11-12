// register a lesson clip composition in src/Root.tsx (Folder «الدروس») + Arabic title. usage: node tools/stream/clip_register.mjs <id> <CompId>
import fs from "node:fs"; import { execSync } from "node:child_process";
const [id, comp] = process.argv.slice(2); const R = "src/Root.tsx"; let r = fs.readFileSync(R, "utf8");
const v = "L_" + id.replace(/[^A-Za-z0-9]/g, "_");
if (!r.includes(`${v}Spec`)) {
  r = r.replace('import saintRambalSpec from', `import ${v}Spec from "../data/specs/${id}.json";\nconst ${v}Comp: React.FC = () => <MontageFromSpec spec={${v}Spec as unknown as MontageSpec} />;\nimport saintRambalSpec from`);
  const line = `        <Composition id="${comp}" component={${v}Comp} durationInFrames={${v}Spec.frames} fps={30} width={1080} height={1920} />\n`;
  if (!r.includes('<Folder name="الدروس">')) r = r.replace('      <Folder name="البثوث">', `      <Folder name="الدروس">\n${line}      </Folder>\n      <Folder name="البثوث">`);
  else r = r.replace('      <Folder name="الدروس">\n', `      <Folder name="الدروس">\n${line}`);
  fs.writeFileSync(R, r);
}
const s = JSON.parse(fs.readFileSync(`data/specs/${id}.json`, "utf8"));
execSync(`node tools/set_title.mjs ${comp} "${s.title.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
