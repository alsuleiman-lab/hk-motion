---
name: never-restart-studio-under-review
description: "Don't restart the Remotion Studio while the user reviews; reload only hk_server with tools/hk_restart.mjs"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-20T06:59:07.480Z
---

Never stop/restart the review Studio (port 3200) while the user may be watching it. src/ changes hot-reload in the page by themselves; a tools/hk_server.mjs change needs only `node tools/hk_restart.mjs` (≈1 s, Studio untouched).

**Why:** 2026-11-20, I restarted the Studio to load new server endpoints; his page went blank with a red error bar: «يجب أن لا يختفي».

**How to apply:** before any restart, check whether only the tools server changed; use hk_restart. A real Studio restart only with his OK. Related: [[fix-first-then-investigate]], [[no-idle-services]].
