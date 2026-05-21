@echo off
cd /d "%~dp0"
set USERPROFILE=%~dp0.expo-home
set APPDATA=%~dp0.appdata
set LOCALAPPDATA=%~dp0.localappdata
set npm_config_cache=%~dp0.npm-cache
set EXPO_NO_TELEMETRY=1
set EAS_NO_VCS=1
npm.cmd run start
pause
