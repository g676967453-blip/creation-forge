# game-bot — 游戏自动化机器人

> 状态：在役 | 注册：2026-08-10（仪表盘） | 工作流：[游戏自动化](../docs/workflows/游戏自动化.md)

## 是什么

AI 游戏自动化流程脚本 —— 用 AI 驱动模拟器（MuMu）+ OCR + 录屏，自动跑手游操作流程，用于游戏体验/验收自动化。

## 目录结构

```
game-bot/
├── lib/              # 核心库：ai.mjs（AI 交互）/ mumuctl.mjs（模拟器控制）/ obs.mjs（录屏）/ ocr.mjs（OCR）
├── identify/         # 游戏识别配置（候选包 + 截图/文本 + report.json）
├── config.json       # 游戏包名、模拟器 CLI、adb 路径等配置
├── act.mjs / loop.mjs / step.mjs   # 流程执行脚本
├── debug-ocr.mjs / ocr-test.mjs / quick-test.mjs / test.mjs  # 调试与验证
└── start.cmd         # 启动入口
```

## 规则

- **流程脚本入库，运行产出不入库**（截图/运行日志/OCR 结果已被 .gitignore 忽略）
- 已适配候选游戏：点兵成将、指尖三国、诛仙回合、群英之战（见 config.json）

## 使用

1. 启动 MuMu 模拟器并打开目标游戏
2. 运行 `node act.mjs`（或 `start.cmd`）
3. 查看仪表盘「游戏自动化」页签追踪进度
