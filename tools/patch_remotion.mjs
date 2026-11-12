import fs from "node:fs";
import path from "node:path";

console.log("=== Patching Remotion to accept all valid names (Arabic, underscores, spaces, etc.) ===");

const files = [
  "node_modules/remotion/dist/esm/index.mjs",
  "node_modules/remotion/dist/cjs/validation/validate-composition-id.js",
  "node_modules/remotion/dist/cjs/validation/validate-folder-name.js",
  "node_modules/@remotion/studio/dist/esm/index-hfvxjqa8.mjs",
  "node_modules/@remotion/studio/dist/esm/index-394460kk.mjs",
  "node_modules/@remotion/studio/dist/components/composition-drag-data.js",
  "node_modules/@remotion/codemods/dist/esm/index.mjs",
  "node_modules/@remotion/codemods/dist/index.cjs",
  "node_modules/@remotion/eslint-config-flat/dist/esm/index.mjs",
  "node_modules/@remotion/eslint-config-flat/dist/index.cjs"
];

let totalPatched = 0;

for (const relPath of files) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`[SKIP] Not found: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;

  // Patterns to replace:
  // 1. Literal unicode in regex
  const p1 = /\/\^(\(\[a-zA-Z0-9-\\u4E00-\\u9FFF\]\)\+|\(\[a-zA-Z0-9-\u4E00-\u9FFF\]\)\+)\$\/g/g;
  if (p1.test(content)) {
    content = content.replace(p1, "/^[^/]+$/g");
    modified = true;
  }

  const p2 = /\/\^(\(\[a-zA-Z0-9-\\u4E00-\\u9FFF\]\)\+|\(\[a-zA-Z0-9-\u4E00-\u9FFF\]\)\+)\$\//g;
  if (p2.test(content)) {
    content = content.replace(p2, "/^[^/]+$/");
    modified = true;
  }

  // 2. Direct string regexes if any
  if (content.includes("/^([a-zA-Z0-9-\\u4E00-\\u9FFF])+$/g")) {
    content = content.replaceAll("/^([a-zA-Z0-9-\\u4E00-\\u9FFF])+$/g", "/^[^/]+$/g");
    modified = true;
  }
  if (content.includes("/^([a-zA-Z0-9-\\u4E00-\\u9FFF])+$/")) {
    content = content.replaceAll("/^([a-zA-Z0-9-\\u4E00-\\u9FFF])+$/", "/^[^/]+$/");
    modified = true;
  }
  if (content.includes("/^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g")) {
    content = content.replaceAll("/^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g", "/^[^/]+$/g");
    modified = true;
  }
  if (content.includes("/^([a-zA-Z0-9-\u4E00-\u9FFF])+$/")) {
    content = content.replaceAll("/^([a-zA-Z0-9-\u4E00-\u9FFF])+$/", "/^[^/]+$/");
    modified = true;
  }

  // 3. Error messages
  if (content.includes("Folder name can only contain a-z, A-Z, 0-9 and -.")) {
    content = content.replaceAll(
      "Folder name can only contain a-z, A-Z, 0-9 and -.",
      "Folder name cannot contain '/'."
    );
    modified = true;
  }
  if (content.includes("Composition id can only contain a-z, A-Z, 0-9, CJK characters and -.")) {
    content = content.replaceAll(
      "Composition id can only contain a-z, A-Z, 0-9, CJK characters and -.",
      "Composition id cannot contain '/'."
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`[PATCHED] ${relPath}`);
    totalPatched++;
  } else {
    console.log(`[UNCHANGED / ALREADY PATCHED] ${relPath}`);
  }
}

console.log(`\nDone. Patched ${totalPatched} file(s). Remotion now accepts all valid names without restrictions.`);

// ---- الأسهم في Studio = تحريك زمني فقط (سهم = إطار، Shift+سهم = ثانية، Alt = بداية/نهاية) لا تحريك العناصر ----
// الأصل: عند تحديد عنصر على الكانفس يحرّكه السهم (nudge)؛ نجعل السهم يقفز بالزمن دائماً.
// معالجان يحرّكان العنصر بالأسهم: (1) الـSDK على الكانفس (يمنع وصول السهم لمعالج الزمن)، (2) Studio SelectedOutlineKeyboardControls.
const TAG = "/* arrows = timeline seek only */";
const SDK_FROM = "if (direction === null || event.altKey || event.metaKey || event.ctrlKey || !editing.enabled) {";
const SDK_TO = `if (true ${TAG} || direction === null || event.altKey || event.metaKey || event.ctrlKey || !editing.enabled) {`;
const STUDIO_FROM = "if (allDragTargets.length === 0) {";
const STUDIO_TO = `if (true ${TAG}) {`;
const arrowPatches = [
  { file: "node_modules/@remotion/sdk/dist/esm/index.mjs", from: SDK_FROM, to: SDK_TO },
  { file: "node_modules/@remotion/sdk/dist/index.cjs", from: SDK_FROM, to: SDK_TO },
  { file: "node_modules/@remotion/studio/dist/esm/index-394460kk.mjs", from: STUDIO_FROM, to: STUDIO_TO },
  { file: "node_modules/@remotion/studio/dist/components/SelectedOutlineKeyboardControls.js", from: STUDIO_FROM, to: STUDIO_TO }
];
for (const { file, from, to } of arrowPatches) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) { console.log(`[SKIP] Not found: ${file}`); continue; }
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.includes(to)) { console.log(`[ARROWS ALREADY PATCHED] ${file}`); continue; }
  if (!content.includes(from)) { console.log(`[ARROWS PATTERN NOT FOUND - Remotion version changed? recheck] ${file}`); continue; }
  fs.writeFileSync(fullPath, content.replace(from, to), "utf8");
  console.log(`[ARROWS PATCHED] ${file}`);
}

