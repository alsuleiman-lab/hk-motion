# Uninstaller for TikTok LIVE Studio CPU Affinity Guard
# Run as Administrator to remove the Scheduled Task and background daemon

$taskName = "TikTokAffinityGuard"
schtasks /delete /tn $taskName /f 2>$null

Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*tiktok_affinity_daemon.ps1*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Output "TikTokAffinityGuard has been removed successfully."
