@echo off
REM ============================================================
REM  Agriscan - Install Release APK to a connected Android device
REM  Build the APK first with:  build-release-apk.bat
REM  (this script builds it automatically if it is missing)
REM  Requirements: Android Platform-Tools (adb) on PATH.
REM ============================================================
setlocal
set ROOT=%~dp0
set APK=%ROOT%frontend\android\app\build\outputs\apk\release\app-release.apk
set APP_ID=com.faraja_maha.agriscan

echo.
echo ============================================================
echo   Agriscan APK Installer
echo ============================================================
echo.

where adb >nul 2>nul
if errorlevel 1 (
    echo [ERROR] adb was not found in PATH.
    echo Install Android Platform-Tools and add it to PATH:
    echo   https://developer.android.com/tools/releases/platform-tools
    exit /b 1
)

if not exist "%APK%" (
    echo APK not found. Building it now with build-release-apk.bat...
    call "%ROOT%build-release-apk.bat" --skip-js
    if errorlevel 1 exit /b 1
)

if not exist "%APK%" (
    echo [ERROR] APK still missing at %APK%
    exit /b 1
)

echo [1/2] Checking for connected devices...
adb devices

echo.
echo [2/2] Installing APK...
adb install -r "%APK%"
if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed. Please check:
    echo   1. USB debugging is enabled on the device
    echo   2. Authorize the "Allow USB debugging" prompt
    echo   3. Allow "Install unknown apps" in device settings
    exit /b 1
)

echo.
echo ============================================================
echo   INSTALLED SUCCESSFULLY. Launching Agriscan...
echo ============================================================
adb shell am start -n %APP_ID%/.MainActivity
echo.
endlocal
