@echo off
REM ============================================================
REM  Agriscan - OFFICIAL Android Release Build Script
REM ------------------------------------------------------------
REM  This is the ONE build script for the Agriscan mobile app.
REM  It bundles the JS app (Expo) and compiles the release APK
REM  from the native Android project with Gradle.
REM
REM  Prerequisites:
REM    - Node.js 20+ and npm
REM    - Android SDK installed and on PATH
REM    - JAVA_HOME pointing at JDK 17
REM
REM  Output:
REM    frontend\android\app\build\outputs\apk\release\app-release.apk
REM
REM  Usage:
REM    build-release-apk.bat            full build
REM    build-release-apk.bat --skip-js  skip npm install + type-check
REM  Then install to a device with:  install-apk.bat
REM ============================================================
setlocal
set ROOT=%~dp0
set FRONTEND=%ROOT%frontend
set APK=%FRONTEND%\android\app\build\outputs\apk\release\app-release.apk

echo.
echo ============================================================
echo   Agriscan Release Build
echo ============================================================
echo.

if "%~1"=="--skip-js" goto buildapk

echo [1/3] Installing JavaScript dependencies...
cd /d "%FRONTEND%"
call npm install
if errorlevel 1 (
    echo.
    echo [FAILED] npm install - please check your npm/network.
    exit /b 1
)

echo.
echo [2/3] Type-checking the app...
cd /d "%FRONTEND%"
call npx tsc --noEmit
if errorlevel 1 (
    echo.
    echo [FAILED] TypeScript check - fix the errors above then retry.
    exit /b 1
)

:buildapk
echo.
echo [3/3] Building release APK with Gradle...
cd /d "%FRONTEND%\android"
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo.
    echo [FAILED] Gradle build - see the output above.
    exit /b 1
)

echo.
echo ============================================================
echo   BUILD SUCCESSFUL
echo ------------------------------------------------------------
echo   APK: %APK%
echo   Install to your phone with:  install-apk.bat
echo ============================================================
echo.
endlocal
