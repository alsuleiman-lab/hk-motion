param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("AVerMedia", "LG")]
    [string]$Target
)

$ErrorActionPreference = 'Stop'
$modulePath = "C:\Users\mshms\Documents\WindowsPowerShell\Modules\AudioDeviceCmdlets\3.1.0.2\AudioDeviceCmdlets.psd1"
if (Test-Path $modulePath) {
    Import-Module $modulePath -ErrorAction SilentlyContinue
} else {
    Import-Module AudioDeviceCmdlets -ErrorAction SilentlyContinue
}

$recDevices = Get-AudioDevice -List | Where-Object { $_.Type -eq "Recording" }
$cur = Get-AudioDevice -Recording

if ($Target -eq "AVerMedia") {
    $dev = $recDevices | Where-Object { $_.Name -like "*AVerMedia*Digital*" -or ($_.Name -like "*AVerMedia*" -and $_.Name -notlike "*Line*") } | Select-Object -First 1
    if (-not $dev) {
        $dev = $recDevices | Where-Object { $_.Name -like "*AVerMedia*" } | Select-Object -First 1
    }
    if ($dev) {
        if ($cur.ID -ne $dev.ID) {
            Set-AudioDevice -Index $dev.Index
            Write-Output "SWITCHED:AVerMedia:$($dev.Name)"
        } else {
            Write-Output "ALREADY_DEFAULT:$($dev.Name)"
        }
    } else {
        Write-Output "NOT_FOUND:AVerMedia"
    }
}
elseif ($Target -eq "LG") {
    $dev = $recDevices | Where-Object { $_.Name -like "*LG-TONE*" } | Select-Object -First 1
    if ($dev) {
        if ($cur.ID -ne $dev.ID) {
            Set-AudioDevice -Index $dev.Index
            Write-Output "SWITCHED:LG:$($dev.Name)"
        } else {
            Write-Output "ALREADY_DEFAULT:$($dev.Name)"
        }
    } else {
        Write-Output "NOT_FOUND:LG"
    }
}

