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

// ---- Add the grading workspace as a native Remotion inspector tab ----
const optionsPanelFile = path.resolve("node_modules/@remotion/studio/dist/esm/index-394460kk.mjs");
if (fs.existsSync(optionsPanelFile)) {
  let content = fs.readFileSync(optionsPanelFile, "utf8");
  const studioTabPatches = [
    {
      label: "remember Filter as a native sidebar tab",
      from: `  if (panel === "renders") {\n    return "renders";\n  }\n  return "inspector";`,
      to: `  if (panel === "renders") {\n    return "renders";\n  }\n  if (panel === "filter") {\n    return "filter";\n  }\n  return "inspector";`,
    },
    {
      label: "add native Filter tab selection",
      from: `  const onRendersSelected = useCallback201(() => {\n    setPanel("renders");\n    persistSelectedOptionsSidebarPanel("renders");\n  }, []);`,
      to: `  const onRendersSelected = useCallback201(() => {\n    setPanel("renders");\n    persistSelectedOptionsSidebarPanel("renders");\n  }, []);\n  const onFilterSelected = useCallback201(() => {\n    setPanel("filter");\n    persistSelectedOptionsSidebarPanel("filter");\n  }, []);`,
    },
    {
      label: "render Filter beside Composition and Jobs",
      from: `            /* @__PURE__ */ jsx337(RendersTab, {\n              onClick: onRendersSelected,\n              selected: panel === "renders"\n            })`,
      to: `            /* @__PURE__ */ jsx337(RendersTab, {\n              onClick: onRendersSelected,\n              selected: panel === "renders"\n            }),\n            /* @__PURE__ */ jsx337(Tab, {\n              selected: panel === "filter",\n              onClick: onFilterSelected,\n              children: "Filter"\n            })`,
    },
    {
      label: "mount the Filter tab content",
      from: `      panel === "inspector" ? /* @__PURE__ */ jsx337(InspectorPanel, {\n        composition,\n        currentDefaultProps,\n        readOnlyStudio,\n        setDefaultProps\n      }) : /* @__PURE__ */ jsx337(RenderQueue, {})`,
      to: `      panel === "inspector" ? /* @__PURE__ */ jsx337(InspectorPanel, {\n        composition,\n        currentDefaultProps,\n        readOnlyStudio,\n        setDefaultProps\n      }) : panel === "renders" ? /* @__PURE__ */ jsx337(RenderQueue, {}) : /* @__PURE__ */ jsx337("div", {\n        id: "remotion-native-filter-panel",\n        style: { flex: 1, minHeight: 0, overflow: "auto" }\n      })`,
    },
  ];
  let modified = false;
  for (const { label, from, to } of studioTabPatches) {
    if (content.includes(to)) continue;
    if (!content.includes(from)) {
      console.log(`[FILTER TAB PATTERN NOT FOUND] ${label} — check Remotion's installed version.`);
      continue;
    }
    content = content.replace(from, to);
    modified = true;
    console.log(`[FILTER TAB PATCHED] ${label}`);
  }
  if (modified) fs.writeFileSync(optionsPanelFile, content, "utf8");
} else {
  console.log("[FILTER TAB SKIPPED] Remotion Studio's OptionsPanel bundle was not found.");
}

const cjsOptionsPanelFile = path.resolve("node_modules/@remotion/studio/dist/components/OptionsPanel.js");
if (fs.existsSync(cjsOptionsPanelFile)) {
  let content = fs.readFileSync(cjsOptionsPanelFile, "utf8");
  const cjsTabPatches = [
    {
      label: "CJS: persist native Filter selection",
      from: `    if (panel === 'renders') {\n        return 'renders';\n    }\n    return 'inspector';`,
      to: `    if (panel === 'renders') {\n        return 'renders';\n    }\n    if (panel === 'filter') {\n        return 'filter';\n    }\n    return 'inspector';`,
    },
    {
      label: "CJS: add Filter tab selection handler",
      from: `    const onRendersSelected = (0, react_1.useCallback)(() => {\n        setPanel('renders');\n        (0, exports.persistSelectedOptionsSidebarPanel)('renders');\n    }, []);`,
      to: `    const onRendersSelected = (0, react_1.useCallback)(() => {\n        setPanel('renders');\n        (0, exports.persistSelectedOptionsSidebarPanel)('renders');\n    }, []);\n    const onFilterSelected = (0, react_1.useCallback)(() => {\n        setPanel('filter');\n        (0, exports.persistSelectedOptionsSidebarPanel)('filter');\n    }, []);`,
    },
    {
      label: "CJS: render native Filter tab",
      from: `(0, jsx_runtime_1.jsx)(RendersTab_1.RendersTab, { onClick: onRendersSelected, selected: panel === 'renders' })] }) }), panel === 'inspector' ?`,
      to: `(0, jsx_runtime_1.jsx)(RendersTab_1.RendersTab, { onClick: onRendersSelected, selected: panel === 'renders' }), (0, jsx_runtime_1.jsx)(Tabs_1.Tab, { selected: panel === 'filter', onClick: onFilterSelected, children: 'Filter' })] }) }), panel === 'inspector' ?`,
    },
    {
      label: "CJS: mount Filter tab content",
      from: `(0, jsx_runtime_1.jsx)(RenderQueue_1.RenderQueue, {}))] }));`,
      to: `(0, jsx_runtime_1.jsx)(RenderQueue_1.RenderQueue, {})) : (0, jsx_runtime_1.jsx)("div", { id: "remotion-native-filter-panel", style: { flex: 1, minHeight: 0, overflow: "auto" } }))] }));`,
    },
  ];
  let modified = false;
  for (const { label, from, to } of cjsTabPatches) {
    if (content.includes(to)) continue;
    if (!content.includes(from)) {
      console.log(`[FILTER TAB PATTERN NOT FOUND] ${label} — check Remotion's installed version.`);
      continue;
    }
    content = content.replace(from, to);
    modified = true;
    console.log(`[FILTER TAB PATCHED] ${label}`);
  }
  if (modified) fs.writeFileSync(cjsOptionsPanelFile, content, "utf8");
}

