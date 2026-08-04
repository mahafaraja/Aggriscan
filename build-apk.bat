@echo off
REM Agriscan APK Build Script (Root Level)
REM Delegates to frontend/build-apk.bat
REM Usage: build-apk.bat [1|2|3]

cd /d "%~dp0frontend"
call build-apk.bat %*