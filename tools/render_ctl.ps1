param([string]$Action = "status", [string]$Match = "baraka_render")
$sig='[DllImport("ntdll.dll")] public static extern int NtSuspendProcess(IntPtr h); [DllImport("ntdll.dll")] public static extern int NtResumeProcess(IntPtr h);'
Add-Type -MemberDefinition $sig -Name Nt -Namespace W -ErrorAction SilentlyContinue
$all = Get-CimInstance Win32_Process
$roots = $all | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match $Match }
$ids = New-Object System.Collections.Generic.List[int]
function Add-Tree($p){ $ids.Add($p); foreach($c in ($all | Where-Object { $_.ParentProcessId -eq $p })){ Add-Tree $c.ProcessId } }
foreach($r in $roots){ Add-Tree $r.ProcessId }
if ($ids.Count -eq 0) { Write-Output "none"; exit }
$n = 0
foreach($i in $ids){ try { $p=[System.Diagnostics.Process]::GetProcessById($i); if($Action -eq "pause"){ [void][W.Nt]::NtSuspendProcess($p.Handle); $n++ } elseif($Action -eq "resume"){ [void][W.Nt]::NtResumeProcess($p.Handle); $n++ } } catch {} }
Write-Output "$Action $n/$($ids.Count)"
