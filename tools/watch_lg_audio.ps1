# Watcher script to automatically set LG-TONE as default audio input upon connection
$targetName = "LG-TONE"

$modulePath = "C:\Users\mshms\Documents\WindowsPowerShell\Modules\AudioDeviceCmdlets\3.1.0.2\AudioDeviceCmdlets.psd1"
if (Test-Path $modulePath) {
    Import-Module $modulePath -ErrorAction SilentlyContinue
} else {
    Import-Module AudioDeviceCmdlets -ErrorAction SilentlyContinue
}

$logFile = "S:\AI_Tools\Remotion_Workspace\tools\watch_lg.log"

function Log-Message($msg) {
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$time] $msg" -ErrorAction SilentlyContinue
}

Log-Message "Watcher started."

function Ensure-LgDefaultInput {
    try {
        $recordingDevices = Get-AudioDevice -List | Where-Object { $_.Type -eq "Recording" }
        $lgMic = $recordingDevices | Where-Object { $_.Name -like "*$targetName*" }
        
        if ($lgMic) {
            $currentDefault = Get-AudioDevice -Recording
            # If LG is not currently default, switch to it
            if ($currentDefault.ID -ne $lgMic.ID) {
                Set-AudioDevice -Index $lgMic.Index
                Log-Message "Switched default input to: $($lgMic.Name)"
            }
        }
    } catch {
        Log-Message "Error: $_"
    }
}

# Run check once immediately
Ensure-LgDefaultInput

# Continuously listen with minimal polling (every 3 seconds, ultra lightweight ~0% CPU)
while ($true) {
    Start-Sleep -Seconds 3
    Ensure-LgDefaultInput
}
