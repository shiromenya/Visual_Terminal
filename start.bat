@echo off
chcp 65001 > nul
echo ========================================================
echo   Graphical Terminal - ノーコード・グラフィカルターミナル
echo ========================================================
echo.
echo サーバーを起動しています...
cd /d "%~dp0"
start http://localhost:3456
node server.js
pause
