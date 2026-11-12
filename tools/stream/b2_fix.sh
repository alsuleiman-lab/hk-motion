#!/bin/bash
# usage: b2_fix.sh <p> <orient port|land>
cd /s/AI_Tools/Remotion_Workspace; source tools/env.sh >/dev/null 2>&1
p=$1; o=$2; f=data/specs/$p.json
node tools/writing_sync.mjs $f --fix 2>&1 | tail -2
node tools/scraps_times.mjs $f 2>&1 | tail -1
node tools/stream/fix_overlaps.mjs $p 2>&1 | tail -1
node tools/stream/close_gaps.mjs $p 2>&1 | tail -1
node tools/scraps_times.mjs $f 2>&1 | tail -1
node tools/sfx_bind.mjs $f 2>&1 | tail -1
node tools/grid_plan.mjs $f --o $o --write 2>&1 | tail -3
