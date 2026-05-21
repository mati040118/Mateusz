@echo off
cd /d "%~dp0"
set USERPROFILE=%~dp0.expo-home
set APPDATA=%~dp0.appdata
set LOCALAPPDATA=%~dp0.localappdata
set npm_config_cache=%~dp0.npm-cache
set EXPO_NO_TELEMETRY=1
set EAS_NO_VCS=1
set EAS_PROJECT_ROOT=%~dp0

echo.
echo Budowanie APK z tokenem Expo.
echo Token utworzysz na stronie:
echo https://expo.dev/accounts/[twoj-login]/settings/access-tokens
echo.
echo Nie wklejaj tokenu nikomu. Ten plik nie zapisuje go na stale.
echo.

set /p EXPO_TOKEN=Wklej token Expo i nacisnij Enter: 

npm.cmd run patch:eas-windows
npm.cmd run build:android:apk

set EXPO_TOKEN=
pause
