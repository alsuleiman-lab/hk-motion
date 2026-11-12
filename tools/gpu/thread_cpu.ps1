# CPU per THREAD of the Electron processes (Chromium names its threads: CrRendererMain, Compositor, CompositorTileWorker, VizCompositorThread, ...).
#   powershell -File tools/gpu/thread_cpu.ps1 -Seconds 8 [-Delay 0] [-Name electron]      -> % of ONE core per (process type, thread name)
param([int]$Seconds = 8, [int]$Delay = 0, [string]$Name = "electron")
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public static class TT {
  [DllImport("kernel32.dll", SetLastError=true)] public static extern IntPtr OpenThread(int access, bool inherit, int id);
  [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll")] public static extern bool GetThreadTimes(IntPtr h, out long c, out long e, out long k, out long u);
  [DllImport("kernel32.dll")] public static extern int GetThreadDescription(IntPtr h, out IntPtr desc);
  [DllImport("kernel32.dll")] public static extern IntPtr LocalFree(IntPtr p);
  public static string Desc(int id) { IntPtr h = OpenThread(0x1800, false, id); if (h == IntPtr.Zero) return "?"; IntPtr p; string s = "?"; if (GetThreadDescription(h, out p) >= 0 && p != IntPtr.Zero) { s = Marshal.PtrToStringUni(p); LocalFree(p); } CloseHandle(h); return s; }
  public static long Cpu(int id) { IntPtr h = OpenThread(0x1800, false, id); if (h == IntPtr.Zero) return -1; long c, e, k, u; GetThreadTimes(h, out c, out e, out k, out u); CloseHandle(h); return k + u; }
}
"@
Start-Sleep -Seconds $Delay
$procs = Get-CimInstance Win32_Process -Filter "Name='$Name.exe'" | % { $t = 'browser'; if ($_.CommandLine -match '--type=([\w-]+)') { $t = $Matches[1] }; [pscustomobject]@{ Id = $_.ProcessId; Type = $t } }
$snap = { $h = @{}; foreach ($p in $procs) { try { foreach ($th in (Get-Process -Id $p.Id -ErrorAction Stop).Threads) { $h["$($p.Id):$($th.Id)"] = @{ type = $p.Type; tid = $th.Id; cpu = [TT]::Cpu($th.Id) } } } catch {} }; $h }
$a = & $snap; Start-Sleep -Seconds $Seconds; $b = & $snap
$g = @{}
foreach ($k in $b.Keys) { if (-not $a.ContainsKey($k)) { continue }; $d = ($b[$k].cpu - $a[$k].cpu) / 1e7 / $Seconds * 100; if ($d -le 0.5) { continue }; $n = $b[$k].type + " | " + [TT]::Desc($b[$k].tid); if (-not $g.ContainsKey($n)) { $g[$n] = 0.0 }; $g[$n] += $d }
"{0} processes; % of one core over {1}s (machine = {2} logical cores):" -f $procs.Count, $Seconds, [Environment]::ProcessorCount
$g.GetEnumerator() | Sort Value -Desc | Select -First 22 | % { "{0,-55} {1,7:N1}%" -f $_.Key, $_.Value }
"sum {0:N1}% of one core" -f (($g.Values | Measure -Sum).Sum)
