---
name: asset-pipeline产出目录
description: asset-pipeline 的生成产出（图片/视频/音频）统一存桌面 asset-pipeline-outputs/，不进 ceshi 仓库 —— 全局硬规则
metadata:
  type: project
  status: active
  priority: high
  created: 2026-08-20
  updated: 2026-08-20
---

# asset-pipeline 产出目录全局规则

**状态：** 🔑 全局硬规则（2026-08-20 起生效）| **来源：** 用户指示「asset-pipeline 产出的东西不放到 ceshi 项目下，在电脑桌面新建一个文件夹存放」

## 规则内容

1. **生成产出（图片/视频/音频）不入仓库** — 统一存桌面 `C:\Users\admin\Desktop\asset-pipeline-outputs\{项目名}\{类型}\`（沿用原 outputs/ 的目录结构）
2. **仓库内保留** — 工作流 MD 文档、规则、映射表/批次状态（csv/json）、参考图（`_references/`、`cankao/`）
3. **存量已外移** — 2026-08-20：397 个媒体文件搬到桌面（仓库 712M → 16M），git 中 22 个已跟踪文件以删除记录提交
4. **游戏项目引用方式** — 按需复制桌面产出到自己的 assets/ 目录，或用绝对路径引用

## 落地位置

- `AI_COLLABORATION.md` §2.3 硬性目录规则表 +1 行（所有 AI 必须遵守）
- 主 `CLAUDE.md` 项目结构区块全局规则备注
- `asset-pipeline/CLAUDE.md` 资产目录约定（含修复 `j:/ceshi` 旧路径）

## 注意事项

- 桌面路径含中文（用户目录），下载示例用 `--output-dir` 英文前向斜杠写法 `C:/Users/admin/Desktop/asset-pipeline-outputs/...`
- 产出文件无 git 备份，重要成品建议由用户自行备份到云盘

关联：[[project-项目结构]]、[[project-当前目标]]
