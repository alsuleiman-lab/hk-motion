# CPU use per process group over a window: powershell -File tools/gpu/cpu_by_process.ps1 -Seconds 10 [-Delay 0]
# Groups: electron by --type (browser / renderer / gpu-process / utility), python, ffmpeg, node, chrome, other top consumers. % of the WHOLE machine (all logical CPUs).
param([int]$Seconds = 10, [int]$Delay = 0)
Start-Sleep -Seconds $Delay
$ncpu = [Environment]::ProcessorCount
function Snap { $h = @{}; Get-CimInstance Win32_Process | % { $h[$_.ProcessId] = @{ name = $_.Name; cmd = $_.CommandLine; t = [double]($_.KernelModeTime + $_.UserModeTime) } }; $h }
$a = Snap; Start-Sleep -Seconds $Seconds; $b = Snap
$g = @{}
foreach ($id in $b.Keys) {
  if (-not $a.ContainsKey($id)) { continue }
  $d = ($b[$id].t - $a[$id].t) / 1e7 / $Seconds / $ncpu * 100
  if ($d -le 0.05) { continue }
  $n = $b[$id].name; $c = [string]$b[$id].cmd
  if ($n -eq 'electron.exe') { if ($c -match '--type=([\w-]+)') { $n = "electron:" + $Matches[1] } else { $n = 'electron:browser' } }
  elseif ($n -eq 'python.exe' -and $c -match 'gpu_compositor') { $n = 'python:gpu_compositor' }
  elseif ($n -eq 'ffmpeg.exe') { if ($c -match 'h264_nvenc') { $n = 'ffmpeg:encode' } else { $n = 'ffmpeg:decode' } }
  if (-not $g.ContainsKey($n)) { $g[$n] = 0.0 }
  $g[$n] += $d
}
$tot = ($g.Values | Measure -Sum).Sum
"total {0:N1}%" -f $tot
$g.GetEnumerator() | Sort Value -Desc | Select -First 16 | % { "{0,-28} {1,6:N1}%" -f $_.Key, $_.Value }
