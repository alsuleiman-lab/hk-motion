---
name: reply-first-never-block
description: "Answering the user comes first; never sit in long blocking waits, and keep Latin letters out of replies"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-20T00:41:54.135Z
---

The user said (2026-11-19, after I stayed silent through long blocking waits): «الرد عليّ أولى الأولويات».

**Why:** I used foreground loops that waited up to ten minutes on tests, so the user's messages and interruptions sat unanswered; and one reply even used Latin letters (file and project names) against the standing Arabic-only rule [[reply-in-arabic]].

**How to apply:** run long work in the background and return to the user at once; check on it with short calls between answers; never chain waits of minutes in one call. If the user writes while work runs, answer first, then continue. Keep replies Arabic with no Latin letters (describe files and projects in Arabic words). This includes commands: never paste a shell command for the user to run (2026-11-19 he objected: «ممنوع أن تكتب لي بغير العربية»); describe the action in Arabic or ask permission to do it myself. ALSO every visible tool field: the `description` of each Bash/PowerShell call, plan items, wrap_up recap/ask/buttons, file captions — Arabic only (2026-11-19 he objected again: «لا تخرى انجليزي انا عربي» after a turn whose command descriptions were English). 2026-11-20 a WHOLE closing message and several in-turn notes came out in English after long technical work («لا تكلمني بغير العربية افهم»): before sending any text, check it is Arabic — technical depth never switches the language.
