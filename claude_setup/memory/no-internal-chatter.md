---
name: no-internal-chatter
description: Report only results in plain Arabic; never narrate agents/sub-steps or bring problems to the user — fix them and report when done
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-21T10:54:19.837Z
---

On 2026-11-21, during the root-fix work, I sent the user step-by-step updates such as «وكيل التجربة أكّد…», «ما زلت أنتظر…» and «الكرت مشغول، هل أوقف التدريب؟». He answered: «ايش وكيل الترجمة هذا؟… ليش تتكلم كلام غريب وما تعطي فكرة صحيحة… انت مكلف بالاصلاح، مو مكلف تجي تشكي لي همومك. انهي اصلاحك يلا بأحسن صورة ممكنة».

**Why:** internal machinery (agents, hand-backs, background jobs) means nothing to him. Each status message costs him attention, and a question about an obstacle I can solve myself reads as complaining.

**How to apply:**
- No messages about agents, sub-steps or waiting. Speak once, when the work is done: what now works, the proof in one line, and what is truly left.
- An obstacle I can solve (a busy GPU, low disk, a defect) gets solved with the best sensible default, and is mentioned only in the final report.
- Ask only a real decision that is his, and only one.
- Plain everyday Arabic, short sentences, and no invented terms.
- Related: [[reply-first-never-block]], [[fill-dont-ask-waivers]].
