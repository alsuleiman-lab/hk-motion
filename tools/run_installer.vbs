Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute "powershell.exe", "-NoProfile -ExecutionPolicy Bypass -File ""S:\AI_Tools\Remotion_Workspace\tools\install_tiktok_affinity.ps1""", "", "runas", 1
