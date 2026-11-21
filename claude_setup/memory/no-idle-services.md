---
name: no-idle-services
description: Stop every service or job of mine that is not in use; run long jobs through tools/bg.sh; announce readiness with tools/ready.mjs
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-19T21:57:12.214Z
---

The user (2026-11-19): «مطلوب منك أن توقف أي خدمة غير مستعملة حتى ما تستهلك موارد الجهاز. هذا أمر خطير جداً… تعمل المستحيل لأجل تنفيذه بدقة واحترافية».

**Why:** two copies of my check ran at once, and one kept making browser stills on the CPU after I stopped its task (on Windows stopping the task kills only the top bash; Git Bash shells are hidden from the Windows parent chain). The auto-mode classifier also refused my direct process kills.

**How to apply:** in the HK-Motion tree (`S:\AI_Tools\Remotion_Workspace_next`) start every long background job with `bash tools/bg.sh <label> [--ttl MIN] -- <cmd>`; check `node tools/proc.mjs ls` before ending a reply and stop what is not needed (`proc.mjs stop`). Never leave a Studio, server or check running unused. When a montage reaches review, announce it with `node tools/ready.mjs <p> <Comp>` (or `--not "…"`) and send its text as is. Related: [[reply-first-never-block]], [[hk-motion-backup-tree]].
