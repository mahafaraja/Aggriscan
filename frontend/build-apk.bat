@echo off
REM Agriscan APK Build Script (No EAS Credits Required)
REM Builds APK directly using Gradle on Windows
REM Supports both Debug and Release variants

setlocal enabledelayedexpansion

echo =========================================
echo Agriscan APK Build Script
echo =========================================
echo.

REM Check if Java is installed
java -version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install JDK 17 from https://adoptium.net/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    pause
    exit /b 1
)

echo Select version to build:
echo.
echo 1) Local Backend - Debug (com.agriscan.local)
echo    - Backend: http://127.0.0.1:8000
echo    - Version Code: 100
echo.
echo 2) Render Backend - Debug (com.agriscan.cloud)
echo    - Backend: https://aggriscan.onrender.com
echo    - Version Code: 200
echo.
echo 3) Render Backend - RELEASE (com.agriscan.cloud)
echo    - Signed APK ready for app store / sharing
echo    - Backend: https://aggriscan.onrender.com
echo    - Version Code: 200
echo.
set /p choice=Enter choice (1-3): 

if "%choice%"=="1" goto build-local-debug
if "%choice%"=="2" goto build-render-debug
if "%choice%"=="3" goto build-render-release
echo Invalid choice
pause
exit /b 1

:build-local-debug
echo.
echo Building Local Backend Debug Version...
copy .env.local .env >nul
set VERSION=local
set PACKAGE=com.agriscan.local
set VERSION_CODE=100
set VERSION_NAME=1.0.0-local
set BUILD_VARIANT=debug
set GRADLE_TASK=assembleDebug
goto build

:build-render-debug
echo.
echo Building Render Backend Debug Version...
copy .env.render .env >nul
set VERSION=render
set PACKAGE=com.agriscan.cloud
set VERSION_CODE=200
set VERSION_NAME=1.0.0-cloud
set BUILD_VARIANT=debug
set GRADLE_TASK=assembleDebug
goto build

:build-render-release
echo.
echo Building Render Backend RELEASE Version...
copy .env.render .env >nul
set VERSION=render
set PACKAGE=com.agriscan.cloud
set VERSION_CODE=200
set VERSION_NAME=1.0.0-cloud
set BUILD_VARIANT=release
set GRADLE_TASK=assembleRelease
goto build

:build
echo.
echo Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo Step 2: Generating Android project (expo prebuild)...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: expo prebuild failed
    pause
    exit /b 1
)

echo.
echo Step 3: Configuring package name and version in AndroidManifest.xml...
if exist android\app\src\main\AndroidManifest.xml (
    powershell -Command "(Get-Content android\app\src\main\AndroidManifest.xml) -replace 'package=\"com.faraja_maha.agriscan\"', 'package=\"%PACKAGE%\"' | Set-Content android\app\src\main\AndroidManifest.xml"
)

echo.
echo Step 4: Cleaning Gradle cache and lock files...
cd android
call gradlew --stop 2>nul
cd ..
if exist android\.gradle\noVersion\buildLogic.lock del /f android\.gradle\noVersion\buildLogic.lock 2>nul
if exist android\.gradle\noVersion\*.lock del /f android\.gradle\noVersion\*.lock 2>nul

echo.
echo Step 5: Building %BUILD_VARIANT% APK (this may take 5-10 minutes)...
cd android
call gradlew clean
call gradlew %GRADLE_TASK%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Gradle build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo =========================================
echo Build completed successfully!
echo =========================================
echo.
if "%BUILD_VARIANT%"=="debug" (
    echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo APK location: android\app\build\outputs\apk\release\app-release.apk
)
echo.
echo To install on your device:
echo 1. Enable "Install from unknown sources" in Android settings
echo 2. Run: adb install android\app\build\outputs\apk\%BUILD_VARIANT%\app-%BUILD_VARIANT%.apk
echo.
if "%VERSION%"=="local" (
    echo For Local Backend version:
    echo   - Ensure backend is running at http://127.0.0.1:8000
    echo   - Use demo phone: +256762000000, code: 123456
) else (
    echo For Render Backend version:
    echo   - Backend is live at https://aggriscan.onrender.com
    echo   - Check health: https://aggriscan.onrender.com/health
    echo   - SMS, AI models, and all APIs are configured
)
echo.
pause