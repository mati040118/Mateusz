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
echo Sprawdzanie logowania Expo:
npx.cmd eas whoami

echo.
echo Sprawdzanie czy Node moze budowac aplikacje:
npm.cmd run check:node-spawn

echo.
echo Jesli powyzej nie ma bledu, uruchom zbuduj-android-apk.bat.
pause
