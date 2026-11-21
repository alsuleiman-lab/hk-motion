---
name: fix-first-then-investigate
description: "For a placement fix from the Studio, apply the move within a minute, then dig into causes after"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-20T06:43:21.499Z
---

When the user reports an element out of place (Studio «راسلني» message), apply the move immediately (`el.mjs size <p> #id --land k= dx= dy=`) and let them check; investigate the root cause only afterwards.

**Why:** 2026-11-20, court photo at 0:05: I spent 4 minutes tracing the code before moving it; the user: «4 دقائق مرت ولم تعدل مكان عنصر، هذا فساد كبير». The one-line size move fixed it at once.

**How to apply:** one quick look → one size/move command → ask them to refresh. Long peeks/renders only after, in the background. Related: [[reply-first-never-block]].
