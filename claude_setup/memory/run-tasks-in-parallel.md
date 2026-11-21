---
name: run-tasks-in-parallel
description: "In a montage, run independent stages together (research, element builds, cover, cut) — never one after another while the user waits"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-20T19:49:02.084Z
---

During the «GTA 6» episode (2026-11-20) I fought one join click step by step while nothing else ran. The user stopped me: «تأخرت يجب تشغيل اكثر من مهمة معا».

**Why:** a montage has many independent pieces. Running them one at a time wastes the user's time.

**How to apply:**
- As soon as the transcript is read, launch the parallel work at once:
  - research and verification (news, hadith, verse, facts) in a subagent;
  - custom elements for the spoken «مونتاج» orders in subagents;
  - cover and images in a subagent;
  - the cut in the background.
- I keep only the cut gate and the integration.
- A small blocker, such as one click at a join, must not hold everything else.
- See also [[reply-first-never-block]].
