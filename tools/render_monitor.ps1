# نافذة ويندوز صغيرة (فوق كل النوافذ): اسم الفيديو + شريط تقدم الرندر.
# powershell -STA -ExecutionPolicy Bypass -File tools\render_monitor.ps1 [-Log render_work\eu_port.log] [-Title "..."]
param([string]$Log = "S:\AI_Tools\Remotion_Workspace\render_work\eu_port.log",
      [string]$Title = "اشتعال أوروبي - مظاهرات في فرنسا وإيطاليا وبلجيكا (طولي)")
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$f = New-Object Windows.Forms.Form
$f.Text = "تقدم الرندر"; $f.TopMost = $true; $f.Size = '460,150'; $f.StartPosition = 'Manual'
$f.Location = New-Object Drawing.Point(([Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width - 480), 20)
$f.RightToLeft = 'Yes'; $f.RightToLeftLayout = $true; $f.FormBorderStyle = 'FixedToolWindow'; $f.BackColor = '#E8EEF5'
$t = New-Object Windows.Forms.Label; $t.Text = $Title; $t.Font = New-Object Drawing.Font('Segoe UI', [single]10, [Drawing.FontStyle]::Bold); $t.ForeColor = '#27425E'
$t.SetBounds(10, 8, 425, 40); $f.Controls.Add($t)
$b = New-Object Windows.Forms.ProgressBar; $b.SetBounds(10, 52, 425, 22); $b.Maximum = 100; $f.Controls.Add($b)
$i = New-Object Windows.Forms.Label; $i.SetBounds(10, 80, 425, 22); $i.Font = New-Object Drawing.Font('Segoe UI', [single]9); $f.Controls.Add($i)
$ni = New-Object Windows.Forms.NotifyIcon; $ni.Icon = [Drawing.SystemIcons]::Information; $ni.Visible = $true
$script:notified = @{}
function Notify($key, $head, $body, $icon) { if (-not $script:notified[$key]) { $script:notified[$key] = $true; $ni.BalloonTipIcon = $icon; $ni.BalloonTipTitle = $head; $ni.BalloonTipText = $body; $ni.ShowBalloonTip(15000); [Media.SystemSounds]::Asterisk.Play(); $j = "C:\Users\mshms\AppData\Local\Programs\Janib\resources\janib.ps1"; if (Test-Path $j) { try { & $j -Action notify -Source "رندر الفيديو" -Title $head -Body $body } catch {} } } }
$tm = New-Object Windows.Forms.Timer; $tm.Interval = 3000
$tm.Add_Tick({
  $txt = ''; try { $txt = Get-Content $Log -Raw -Encoding UTF8 } catch {}
  $m = [regex]::Matches($txt, '\[\w+\] (\d+)%\s+([\d.]+) min'); $d = [regex]::Match($txt, 'DONE ([\d.]+) min')
  if ($d.Success) { $b.Value = 100; $i.Text = "اكتمل 100%  —  " + $d.Groups[1].Value + " د"; $t.ForeColor = '#2E7D52'; Notify 'done' 'انتهى الرندر ✅' $Title 'Info'; return }
  if ($txt -match 'attempt 3 failed') { $i.Text = "فشل الرندر"; $t.ForeColor = '#C0504D'; Notify 'fail' 'فشل الرندر ❌' $Title 'Error'; return }
  if ($m.Count -gt 0) {
    $p = [int]$m[$m.Count-1].Groups[1].Value; $mn = [double]$m[$m.Count-1].Groups[2].Value
    $b.Value = [Math]::Min($p, 100); $eta = if ($p -gt 0) { [Math]::Round($mn * (100 - $p) / $p) } else { 0 }
    $i.Text = "$p%   —   مضى $([Math]::Round($mn,1)) د   —   متبقٍ ≈ $eta د"
  } else { $i.Text = "جارٍ التجهيز..." }; if ($b.Value -ge 50) { Notify 'half' 'نصف الرندر' "$Title — 50%" 'Info' }
})
$tm.Start(); [void]$f.ShowDialog(); $ni.Visible = $false
