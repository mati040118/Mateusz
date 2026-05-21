@echo off
cd /d "%~dp0"
set USERPROFILE=%~dp0.expo-home
set APPDATA=%~dp0.appdata
set LOCALAPPDATA=%~dp0.localappdata
set npm_config_cache=%~dp0.npm-cache
set EXPO_NO_TELEMETRY=1
set EAS_NO_VCS=1

echo.
echo Logowanie do Expo przez przegladarke.
echo Otworzy sie strona Expo. Zaloguj sie tam tak jak normalnie w internecie.
echo Jesli nie masz konta, zaloz je na https://expo.dev/signup
echo.

npx.cmd eas account:login --browser

echo.
echo Sprawdzenie logowania:
npx.cmd eas whoami
pause
