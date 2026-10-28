# TikTok LIVE Studio CPU Affinity Guard Daemon
# Enforces maximum 4 CPU cores (Cores 0, 1, 2, 3 -> Affinity Mask 0x0F = 15)
# Covers TikTok LIVE Studio and all child engines (MediaSDK_Server, AISDK_Server, etc.)

param(
    [int]$AffinityMask = 15 # 0x0F = 4 cores (CPU 0, 1, 2, 3)
)

$targetNames = @(
    "TikTok LIVE Studio",
    "TikTok LIVE Studio Launcher",
    "MediaSDK_Server",
    "dshow_server",
    "task_server",
    "AISDK_Server",
    "VoiceAssistant",
    "dump_reporter",
    "app_shell_updater"
)

$maskIntPtr = [System.IntPtr]$AffinityMask

function Enforce-TikTokAffinity {
    try {
        $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object {
            $name = $_.ProcessName
            if ($targetNames -contains $name) { return $true }
            try {
                if ($_.Path -and $_.Path -like "*TikTok LIVE Studio*") { return $true }
            } catch {}
            return $false
        }

        foreach ($p in $procs) {
            try {
                if ($p.ProcessorAffinity -ne $maskIntPtr) {
                    $p.ProcessorAffinity = $maskIntPtr
                }
            } catch {}
        }
    } catch {}
}

# Run loop indefinitely with negligible CPU usage (check every 2 seconds)
while ($true) {
    Enforce-TikTokAffinity
    Start-Sleep -Seconds 2
}
