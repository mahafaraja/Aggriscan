@echo off
cd /d "%~dp0.."
echo Building Android Release APK...
cd android
call gradlew.bat assembleRelease
echo.
echo ✓ APK built at: android\app\build\outputs\apk\release\app-release.apk
pause
