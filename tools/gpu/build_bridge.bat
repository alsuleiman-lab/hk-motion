@echo off
rem Builds tools\gpu\bridge.dll with Visual Studio 2022 (no CUDA toolkit needed). Run from anywhere.
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
set "TMP=S:\AI_Tools\Remotion_Workspace\.tmp"
set "TEMP=%TMP%"
cd /d "%~dp0"
cl /nologo /O2 /EHsc /LD /std:c++17 /Fo"%TMP%\\" bridge.cpp /Fe:bridge.dll /link /nologo /OUT:bridge.dll
del /q bridge.exp bridge.lib 2>nul
