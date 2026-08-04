@echo off
REM Agriscan Frontend Build Script for Windows
REM Builds two versions: Local Backend and Render Backend

echo =========================================
echo Agriscan Frontend Build Script
echo =========================================
echo.

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo EAS CLI not found. Installing...
    call npm install -g eas-cli
)

REM Check if user is logged in to EAS
eas whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please login to EAS first:
    call eas login
)

echo Select build type:
echo.
echo 1) Build Local Backend Version - LOCAL BUILD (com.agriscan.local)
echo    - Backend: http://127.0.0.1:8000
echo    - Version Code: 100
echo    - Build: Local (no EAS credits used)
echo.
echo 2) Build Render Backend Version - LOCAL BUILD (com.agriscan.cloud)
echo    - Backend: https://aggriscan.onrender.com
echo    - Version Code: 200
echo    - Build: Local (no EAS credits used)
echo.
echo 3) Build Both Versions - LOCAL BUILD
echo.
echo 4) Build Local Backend - EAS CLOUD (requires credits)
echo.
echo 5) Build Render Backend - EAS CLOUD (requires credits)
echo.
set /p choice=Enter choice (1-5): 

if "%choice%"=="1" goto local-local
if "%choice%"=="2" goto render-local
if "%choice%"=="3" goto both-local
if "%choice%"=="4" goto local-eas
if "%choice%"=="5" goto render-eas
echo Invalid choice
pause
exit /b 1

:local-local
echo.
echo Building Local Backend Version (LOCAL BUILD)...
echo Profile: local-backend-dev
echo Package: com.agriscan.local
echo Version Code: 100
echo.
call eas build --platform android --profile local-backend-dev --local
goto complete

:render-local
echo.
echo Building Render Backend Version (LOCAL BUILD)...
echo Profile: render-backend-dev
echo Package: com.agriscan.cloud
echo Version Code: 200
echo.
call eas build --platform android --profile render-backend-dev --local
goto complete

:both-local
echo.
echo Building Local Backend Version (LOCAL BUILD)...
echo Profile: local-backend-dev
echo Package: com.agriscan.local
echo Version Code: 100
echo.
call eas build --platform android --profile local-backend-dev --local
echo.
echo Building Render Backend Version (LOCAL BUILD)...
echo Profile: render-backend-dev
echo Package: com.agriscan.cloud
echo Version Code: 200
echo.
call eas build --platform android --profile render-backend-dev --local
goto complete

:local-eas
echo.
echo Building Local Backend Version (EAS CLOUD)...
echo Profile: local-backend
echo Package: com.agriscan.local
echo Version Code: 100
echo.
call eas build --platform android --profile local-backend
goto complete

:render-eas
echo.
echo Building Render Backend Version (EAS CLOUD)...
echo Profile: render-backend
echo Package: com.agriscan.cloud
echo Version Code: 200
echo.
call eas build --platform android --profile render-backend
goto complete

:local
echo.
echo Building Local Backend Version...
echo Profile: local-backend
echo Package: com.agriscan.local
echo Version Code: 100
echo.
call eas build --platform android --profile local-backend
goto complete

:render
echo.
echo Building Render Backend Version...
echo Profile: render-backend
echo Package: com.agriscan.cloud
echo Version Code: 200
echo.
call eas build --platform android --profile render-backend
goto complete

:both
echo.
echo Building Local Backend Version...
echo Profile: local-backend
echo Package: com.agriscan.local
echo Version Code: 100
echo.
call eas build --platform android --profile local-backend
echo.
echo Building Render Backend Version...
echo Profile: render-backend
echo Package: com.agriscan.cloud
echo Version Code: 200
echo.
call eas build --platform android --profile render-backend
goto complete

:complete
echo.
echo =========================================
echo All builds completed successfully!
echo =========================================
echo.
echo Next steps:
echo 1. Download APK^(s^) from EAS build dashboard
echo 2. Install on Android device^(s^)
echo 3. Test the app with appropriate backend
echo.
echo For Local Backend version:
echo   - Ensure backend is running at http://127.0.0.1:8000
echo   - Use demo phone: +256762000000, code: 123456
echo.
echo For Render Backend version:
echo   - Ensure backend is deployed at https://aggriscan.onrender.com
echo   - Check health: https://aggriscan.onrender.com/health
echo.
pause