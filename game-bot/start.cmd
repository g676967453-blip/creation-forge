@echo off
chcp 65001 >nul
echo ========================================
echo   点兵成将 全自动游戏机器人
echo ========================================
echo.
echo 使用前请确认:
echo   1. MuMu Player 12 已启动
echo   2. OBS Studio 已启动 (如需录制)
echo   3. WebSocket 插件已在 OBS 中启用
echo.
echo 按任意键开始...
pause >nul
node "%~dp0loop.mjs"
pause
