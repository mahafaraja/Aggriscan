# Gradle 10 Compatibility Fixes

## Issue
Build failed: "Deprecated Gradle features were used in this build, making it incompatible with Gradle 10"

Reference: https://docs.gradle.org/9.3.1/userguide/command_line_interface.html#sec:command_line_warnings

## Fixes Applied

### 1. Removed deprecated `allprojects` block
**File:** `frontend/android/build.gradle`
- Removed the entire `allprojects` block (lines 15-21)
- Reason: Deprecated in Gradle 9, removed in Gradle 10

### 2. Fixed deprecated `file()` method usage
**File:** `frontend/android/app/build.gradle`
- Changed `file([...])` to `new File([...])` for entryFile
- Reason: `file()` method with list execution is deprecated

### 3. Removed dynamic version selector `+`
**File:** `frontend/android/app/build.gradle`
- Changed version from `2026004.+` to `2026004.0`
- Reason: Dynamic version selectors are deprecated in Gradle 10

### 4. Removed deprecated `buildToolsVersion`
**File:** `frontend/android/app/build.gradle`
- Removed `buildToolsVersion rootProject.ext.buildToolsVersion` line
- Reason: Deprecated in AGP 7.0+, now managed automatically

## Verification
Run: `cd frontend/android && ./gradlew build --warning-mode all`