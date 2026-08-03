@echo off
cd /d "%~dp0"
echo =========================================
echo Agriscan Release APK Build
echo =========================================
echo.
echo Current directory: %CD%
echo.

REM Ensure .env is set for Render backend
copy /Y .env.render .env >nul
echo Using Render backend: https://aggriscan.onrender.com
echo.

REM Step 0: Install npm dependencies if node_modules is missing
if not exist node_modules (
    echo Step 0: Installing npm dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
    echo.
)

REM Step 1: Delete stale CMake cache and build artifacts manually
echo Step 1: Cleaning stale build artifacts...
if exist android\app\.cxx (
    echo Removing stale CMake cache...
    rmdir /s /q android\app\.cxx 2>nul
)
if exist android\app\build\intermediates\cxx (
    echo Removing stale CXX intermediates...
    rmdir /s /q android\app\build\intermediates\cxx 2>nul
)
if exist android\build (
    rmdir /s /q android\build 2>nul
)
echo Clean done.
echo.

REM Step 2: Generate codegen artifacts for react-native-vector-icons first
echo Step 2: Generating codegen artifacts...
cd android
echo Running codegen for react-native-vector-icons...
call gradlew :react-native-vector-icons:generateCodegenArtifactsFromSchema
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Codegen for vector-icons may have issues, continuing...
)
cd ..
echo.

REM Step 3: Run the full build
echo Step 3: Building Release APK (this may take 10-15 minutes)...
cd android
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Release build failed
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
echo APK location: android\app\build\outputs\apk\release\app-release.apk
echo.
echo To install on your device:
echo adb install android\app\build\outputs\apk\release\app-release.apk
echo.
echo Backend: https://aggriscan.onrender.com
echo Health:  https://aggriscan.onrender.com/health
echo.
pause
