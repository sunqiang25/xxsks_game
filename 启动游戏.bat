@echo off
chcp 65001 >nul
title 口算太空大冒险 - 本地服务器
cd /d "%~dp0"

echo.
echo   ========================================
echo      🚀 口算太空大冒险 · 本地服务器
echo   ========================================
echo.
echo   正在启动... 请保持此窗口开着。
echo.
echo   本机可访问：  http://localhost:8000
echo.
echo   手机访问（需连同一个 WiFi）：
echo   ----------------------------------------

REM 列出本机所有 IPv4 地址，方便手机访问
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  echo      http://%%a:8000
)

echo   ----------------------------------------
echo.
echo   在手机浏览器输入上面任意一个网址即可开玩。
echo   iPhone 用 Safari，安卓用 Chrome，可“添加到主屏幕”。
echo.
echo   关闭游戏：直接关掉此窗口即可。
echo.

REM 优先用 Python 起静态服务器；没有则尝试 Node
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8000
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p 8000
  goto :eof
)

echo   [错误] 未找到 Python 或 Node，无法启动服务器。
pause
