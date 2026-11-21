@echo off
chcp 65001 > nul
title Remotion Studio
cd /d "%~dp0"
echo ===================================================
echo           تشغيل استوديو Remotion للمعاينة
echo ===================================================
echo.
npm run dev
pause
