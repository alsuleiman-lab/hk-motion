# Installer for TikTok LIVE Studio CPU Affinity Guard
# Requires Administrator privileges (invoked via RunAs)

$ErrorActionPreference = "Continue"

$targetDir = "C:\ProgramData\TikTokAffinity"
$targetDaemon = Join-Path $targetDir "tiktok_affinity_daemon.ps1"
$sourceDaemon = "S:\AI_Tools\Remotion_Workspace\tools\tiktok_affinity_daemon.ps1"
$statusFile = "S:\AI_Tools\Remotion_Workspace\tools\tiktok_affinity_status.log"

$logLines = @()
function Log($msg) {
    $entry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    $script:logLines += $entry
    Write-Output $entry
}

Log "Starting TikTok Affinity Guard installation..."

try {
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    Copy-Item -Path $sourceDaemon -Destination $targetDaemon -Force
    Log "Copied daemon to $targetDaemon"

    # Immediately enforce affinity on all running TikTok processes
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
    $mask = [System.IntPtr]15 # 0x0F = 4 Cores (CPU 0, 1, 2, 3)

    $updated = 0
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
            $p.ProcessorAffinity = $mask
            $updated++
            Log "Enforced 4 cores on: $($p.ProcessName) (PID: $($p.Id))"
        } catch {
            Log "Failed on $($p.ProcessName): $_"
        }
    }
    Log "Immediate enforcement completed. Updated $updated processes."

    # Register Scheduled Task to run as SYSTEM at startup
    $taskName = "TikTokAffinityGuard"
    $taskAction = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$targetDaemon`""

    # Remove existing task if present
    schtasks /delete /tn $taskName /f 2>$null | Out-Null

    # Create new task triggered at system boot (onstart)
    $createCmd = "schtasks /create /tn `"$taskName`" /tr `"$taskAction`" /sc onstart /ru `"SYSTEM`" /rl highest /f"
    Invoke-Expression $createCmd

    # Run the task right now
    schtasks /run /tn $taskName

    Log "Scheduled Task '$taskName' successfully registered and started."
    Log "INSTALLATION_SUCCESS"
} catch {
    Log "INSTALLATION_ERROR: $_"
}

$logLines | Out-File -FilePath $statusFile -Encoding utf8 -Force
