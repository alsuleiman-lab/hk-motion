import subprocess
import time
import os

LOG_FILE = r"S:\AI_Tools\Remotion_Workspace\tools\watch_lg.log"

def log(msg):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except:
        pass

log("Python LG Audio Watcher started.")

PS_CMD = '''
Import-Module "C:\\Users\\mshms\\Documents\\WindowsPowerShell\\Modules\\AudioDeviceCmdlets\\3.1.0.2\\AudioDeviceCmdlets.psd1" -ErrorAction SilentlyContinue
$lg = Get-AudioDevice -List | Where-Object { $_.Type -eq "Recording" -and $_.Name -like "*LG-TONE*" }
if ($lg) {
    $cur = Get-AudioDevice -Recording
    if ($cur.ID -ne $lg.ID) {
        Set-AudioDevice -Index $lg.Index
        Write-Output "SWITCHED"
    }
}
'''

while True:
    try:
        # Run check
        res = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", PS_CMD],
            capture_output=True,
            text=True,
            creationflags=0x08000000 # CREATE_NO_WINDOW
        )
        if "SWITCHED" in res.stdout:
            log("Switched default audio input to LG-TONE.")
    except Exception as e:
        log(f"Error: {e}")
    time.sleep(3)
