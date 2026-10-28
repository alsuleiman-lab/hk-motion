@echo off
chcp 65001 >nul
title فحص أنوية تيك توك

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "S:\AI_Tools\Remotion_Workspace\tools\check_tiktok_affinity.ps1"
echo.
pause
