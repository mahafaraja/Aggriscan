@echo off
cd /d "%~dp0.."
echo Building Android Debug APK...
cd android
call gradlew.bat assembleDebug
echo.
echo ✓ APK built at: android\app\build\outputs\apk\debug\app-debug.apk
pause
