@echo off
rem =============================================
rem  救火英雄 · 窗口配置编辑器 一键打开
rem  双击本文件：自动启动本地服务 + 打开编辑器
rem  数据在浏览器 localStorage，同一浏览器下自动恢复
rem =============================================
chcp 65001 >nul
cd /d "%~dp0"

rem 端口已被占用（服务已在跑）→ 直接开浏览器
netstat -ano | findstr /r ":8080 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [OK] 本地服务已在运行
    start "" "http://127.0.0.1:8080/window-editor.html"
    exit /b 0
)

rem 服务未启动 → 后台拉起 node server.js，再开浏览器
echo [..] 正在启动本地服务...
start "fire-hero-window-editor" /min cmd /c "node server.js 8080"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8080/window-editor.html"
echo [OK] 已打开编辑器；若浏览器未弹出，请手动访问：
echo      http://127.0.0.1:8080/window-editor.html
echo 关闭提示窗口前请勿退出（node 黑窗口 = 服务器本体，可最小化）
pause >nul
