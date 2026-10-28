# Source this at the start of EVERY work command:  source tools/env.sh
# Standing rule (user): never use drive C: while working; only the final EXPORT may use it. All temp files go to S:\.
export TEMP="S:\AI_Tools\Remotion_Workspace\.tmp" TMP="S:\AI_Tools\Remotion_Workspace\.tmp" TMPDIR="/s/AI_Tools/Remotion_Workspace/.tmp"
export HF_HOME="/s/AI_Tools/ComfyUI_models/huggingface" PIP_CACHE_DIR="/s/AI_Tools/Remotion_Workspace/.tmp/pip" PYTHONPYCACHEPREFIX="/s/AI_Tools/Remotion_Workspace/.tmp/pyc"
mkdir -p "$TMPDIR"
# User order 2026-10-22: never show console windows or browser tabs while working. Every Node child process is created with windowsHide:true.
export NODE_OPTIONS="--import file:///S:/AI_Tools/Remotion_Workspace/tools/hide_windows.mjs ${NODE_OPTIONS_EXTRA:-}"
