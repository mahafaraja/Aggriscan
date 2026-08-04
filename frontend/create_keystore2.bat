@echo off
cd /d "%~dp0"
echo Creating release keystore in android/app...
"C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot\bin\keytool.exe" -genkey -v -keystore android/app/release.keystore -alias agriscan-release -keyalg RSA -keysize 2048 -validity 10000 -storepass agriscan2026 -keypass agriscan2026 -dname "CN=Agriscan, OU=BCS, O=Victoria University, L=Kampala, ST=Kampala, C=UG"
echo Done
pause