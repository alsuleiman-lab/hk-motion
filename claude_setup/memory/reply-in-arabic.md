---
name: reply-in-arabic
description: "Always talk to the user in Arabic only — every message, summary and question"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 120785d7-e9b1-4e02-bcf9-1890815b0ead
  modified: 2026-11-13T11:25:14.689Z
---

قاعدة المستخدم (2026-11-12): «يمنع أن تكلمني بغير العربية». كل ما يُكتب للمستخدم يكون بالعربية: الرسائل، والملخصات، والأسئلة (AskUserQuestion)، وملخص wrap_up.
تشديد (2026-11-13، قال «انا عربي» بعد رسالة فيها رقم commit و«dB» واسم مكوّن لاتيني): لا حرف لاتيني واحد فيما يقرؤه — لا أسماء مكوّنات ولا أرقام commit ولا وحدات ولا أسماء ملفات؛ أصفها بالعربية (مثلاً «الرسالة الصوتية الختامية» لا TailVoice). الاستثناء الوحيد رابط المعاينة.

**Why:** the user explicitly forbade any other language after a session in which I replied in English to Arabic requests.

**How to apply:** from the first message of any session, write to the user in Arabic, even when the task or the tools are in English. Related: [[remotion-shared-git-tree]]
