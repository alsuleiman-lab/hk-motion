#!/bin/bash
# usage: cut_batch.sh <plan.json> [id id …] — قص كل مقاطع الخطة بالتتابع بـcut_smart (سكتات وتلعثم وبوابة الصوت) ويستأنف ما قُصّ؛ السجل في .tmp/<p>/cut_batch.log
# بعد كل قص يُفحص الكلام الضائع (lost_speech_check): ما قُصّ من كلام يُعاد القص مرة بإبقائه (الكلام الهادئ تفوته عتبة الطاقة والكشف الصوتي).
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
plan=$1; shift; ids="$*"
[ -z "$ids" ] && ids=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).clips.map(c=>c.id).join(" "))' "$plan")
p=$(basename "$(dirname "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).words)' "$plan")")")
log=.tmp/$p/cut_batch.log
for id in $ids; do
  if [ -f public/${id}_cut.mp4 ] && [ -f .tmp/$id/cut_words.json ] && [ -f .tmp/$id/lost_ok ]; then echo "[$(date +%H:%M:%S)] $id مقصوص من قبل" >> $log; continue; fi
  r=$(bash tools/stream/cut_smart.sh $id 2>&1 | grep -E "cut OK|FAILED|keep joins|^[0-9.]+$" | tr '\n' ' ')
  kr=$(node tools/stream/lost_speech_check.mjs $id --ranges 2>/dev/null | tail -1)
  if [ -n "$kr" ]; then
    r2=$(KS="$kr" bash tools/stream/cut_smart.sh $id 2>&1 | grep -E "cut OK|FAILED|^[0-9.]+$" | tr '\n' ' ')
    echo "[$(date +%H:%M:%S)] $id أُعيد القص بإبقاء كلام كان سيضيع ($kr): $r2" >> $log
  fi
  chk=$(node tools/stream/lost_speech_check.mjs $id 2>&1 | head -3 | tr '\n' ' ')
  case "$chk" in *✘*) ;; *) touch .tmp/$id/lost_ok;; esac
  echo "[$(date +%H:%M:%S)] $id $r | $chk" >> $log
done
echo "[$(date +%H:%M:%S)] انتهى القص" >> $log
