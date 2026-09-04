@echo off
chcp 65001 >nul
set "GODOT=F:\Godot_v4.7-stable_win64.exe"
set "PROJ=%~dp0"
if not exist "%GODOT%" (
  echo [错误] 未找到 Godot：%GODOT%
  echo 请确认路径，或用 Godot 项目管理器打开本文件夹。
  pause
  exit /b 1
)
echo 正在用 Godot 4.7 打开：%PROJ%
start "" "%GODOT%" --path "%PROJ%"
