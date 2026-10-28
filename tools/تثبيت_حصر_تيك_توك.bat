@echo off
chcp 65001 >nul
title تثبيت خدمة حصر تيك توك على 4 أنوية

:: Check for admin rights and auto-elevate
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [i] جاري طلب صلاحيات مسؤول النظام (Administrator)...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

echo ========================================================
echo     تثبيت خدمة حصر تيك توك على 4 أنوية معالج فقط
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "S:\AI_Tools\Remotion_Workspace\tools\install_tiktok_affinity.ps1"

echo.
echo ========================================================
echo  تم التثبيت بنجاح!
echo  تيك توك الآن وجميع محركاته محصورة على 4 أنوية فقط.
echo  الخدمة ستعمل تلقائياً دائماً حتى بعد إعادة التشغيل.
echo ========================================================
echo.
pause
