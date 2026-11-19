#!/usr/bin/env bash
# THE WAY TO RUN A LONG JOB (user 2026-11-19: no service left running unused). Registers it, low priority, and ties it to THIS shell:
# when the task is stopped (its bash dies) the job and everything under it are stopped within 5 s. Usage, from the project root:
#   bash tools/bg.sh <label> [--ttl MIN] [--project p] -- <cmd> <args…>
# (tools/proc.mjs run --wait under the hood; Git Bash hides its shells from Windows, so the real Windows pid comes from /proc/$$/winpid)
label="$1"; shift
# every bash above this one (stopping a task kills the TOP shell, which may be several levels up): their Windows pids, comma-separated
owners=""; p=$$
while [ -n "$p" ] && [ "$p" != "1" ] && [ -r /proc/$p/winpid ]; do owners="$owners,$(cat /proc/$p/winpid)"; p=$(cat /proc/$p/ppid 2>/dev/null); done
export HK_OWNER="${owners#,}"
node tools/proc.mjs run --wait --label "$label" "$@"
