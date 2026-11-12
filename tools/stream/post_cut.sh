#!/bin/bash
# usage: post_cut.sh <p>  — onset check, large-v3 words, merge
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
PY=S:/AI_Tools/ComfyUI_windows_portable/python_embeded/python.exe
export PATH="/s/AI_Tools/ComfyUI_windows_portable/python_embeded/Lib/site-packages/torch/lib:$PATH"
p=$1
rm -f .tmp/$p/cut_words.aligned.json .tmp/$p/cut_words_large.raw.json
$PY -I tools/onset_check.py $p 2>&1 | tail -3
$PY tools/words_cut_large.py $p > .tmp/$p/large.log 2>&1 || { echo "large failed"; tail -3 .tmp/$p/large.log; }
node tools/merge_words_large.mjs $p 2>&1 | tail -2
