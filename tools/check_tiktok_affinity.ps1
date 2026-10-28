# Check TikTok LIVE Studio CPU Affinity
$ErrorActionPreference = "SilentlyContinue"

$targetNames = @(
    "TikTok LIVE Studio",
    "TikTok LIVE Studio Launcher",
    "MediaSDK_Server",
    "dshow_server",
    "task_server",
    "AISDK_Server",
    "VoiceAssistant"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "           حالة أنوية المعالج لعمليات تيك توك              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$procs = Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $name = $_.ProcessName
    if ($targetNames -contains $name) { return $true }
    try {
        if ($_.Path -and $_.Path -like "*TikTok LIVE Studio*") { return $true }
    } catch {}
    return $false
}

if (-not $procs) {
    Write-Host "برنامج تيك توك غير مشغّل حالياً." -ForegroundColor Yellow
} else {
    foreach ($p in $procs) {
        $aff = $null
        try {
            $aff = $p.ProcessorAffinity.ToInt64()
        } catch {}

        $statusStr = if ($aff -eq 15) {
            "[محصور بنجاح على 4 أنوية - Cores 0,1,2,3]"
        } elseif ($aff -eq $null) {
            "[يتطلب تشغيل الفحص كمسؤول لقراءة القيمة]"
        } else {
            "[قناع الأنوية: $aff]"
        }

        $color = if ($aff -eq 15) { "Green" } else { "Yellow" }
        Write-Host ("{0,-25} (PID: {1,-6}) CPU: {2,-8:N1}s  --> {3}" -f $p.ProcessName, $p.Id, $p.CPU, $statusStr) -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
