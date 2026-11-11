' Runs tools/resume_after_reboot.mjs hidden at logon (Windows task «RemotionResumeWork»). No window.
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "S:\AI_Tools\Remotion_Workspace"
sh.Run """C:\Program Files\nodejs\node.exe"" tools\resume_after_reboot.mjs logon", 0, False
