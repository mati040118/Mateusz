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
echo Budowanie instalowanej wersji APK dla Androida.
echo Najpierw sprawdzam logowanie do Expo.
echo.

npx.cmd eas whoami
if errorlevel 1 goto login_needed
goto build_apk

:login_needed
echo.
echo Nie jestes zalogowany do Expo.
echo Za chwile otworzy sie logowanie w przegladarce.
echo Jesli nie masz konta, zaloz je na https://expo.dev/signup
echo.
npx.cmd eas account:login --browser
if errorlevel 1 goto login_failed

:build_apk

npm.cmd run check:node-spawn
if errorlevel 1 goto node_blocked
npm.cmd run patch:eas-windows
npm.cmd run build:android:apk
pause
exit /b

:login_failed
echo.
echo Logowanie nie powiodlo sie. Uruchom plik zaloguj-do-expo.bat i sprobuj ponownie.
pause
exit /b

:node_blocked
echo.
echo Windows blokuje budowanie aplikacji przez Node.
echo Sprobuj uruchomic ten plik normalnie dwuklikiem z folderu aplikacji albo jako administrator.
echo Jesli dalej nie dziala, zainstaluj Node.js LTS zamiast wersji 26: https://nodejs.org
echo.
pause
