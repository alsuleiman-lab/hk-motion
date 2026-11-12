#!/bin/bash
# Hibernate the PC after the render queue — ONLY while the user is asleep (user orders 2026-11-11/12: «بعد انتهاء الرندرة اعمل الجهاز في حالة السبات»، «لما أروح أنام»).
# .tmp/user_sleeping is set by the prompt hook when he says he goes to sleep and cleared by any other message from him (he is awake → never hibernate).
# Waits for the queue (no queued/running job, no live worker), gives Claude 20 min to check the exports (.tmp/hibernate_now skips the wait), then hibernates.
cd /s/AI_Tools/Remotion_Workspace
echo $$ > .tmp/hibernate_watcher.pid
alive() { [ -f data/render_queue/worker.pid ] && kill -0 "$(cat data/render_queue/worker.pid)" 2>/dev/null; }
while true; do
  busy=$(node -e 'const s=JSON.parse(require("fs").readFileSync("data/render_queue/state.json","utf8"));console.log(s.jobs.filter(j=>["queued","running","rendering"].includes(j.state)).length)')
  if [ "$busy" = "0" ] && ! alive; then break; fi
  [ -f .tmp/user_sleeping ] || { echo "$(date) he is awake: watcher ends" >> .tmp/sleep_hook.log; rm -f .tmp/hibernate_watcher.pid; exit 0; }
  sleep 60
done
echo "$(date) queue finished" >> .tmp/sleep_hook.log
for i in $(seq 1 20); do [ -f .tmp/hibernate_now ] && break; sleep 60; done
rm -f .tmp/hibernate_now .tmp/hibernate_watcher.pid
if [ -f .tmp/user_sleeping ]; then echo "$(date) hibernating" >> .tmp/sleep_hook.log; shutdown.exe /h; else echo "$(date) he is awake: no hibernate" >> .tmp/sleep_hook.log; fi
