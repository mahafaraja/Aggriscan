@echo off
cd /d "%~dp0"
echo Current directory: %CD%
copy /Y .env.render .env
echo Step 1: Copying .env.render to .env...
echo.
echo Step 2: Running expo prebuild...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: expo prebuild failed
    pause
    exit /b 1
)
echo.
echo Prebuild completed successfully!
pause