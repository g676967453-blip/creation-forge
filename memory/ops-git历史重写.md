---
name: git历史重写告警
description: ⚠️ 2026-08-20 git 历史已用 filter-repo 重写并强推 —— 所有 AI 的旧克隆必须重新 clone，禁止基于旧历史继续推送
metadata:
  type: project
  status: active
  priority: high
  created: 2026-08-20
  updated: 2026-08-20
---

# ⚠️ Git 历史重写告警（2026-08-20）

**状态：** 生效中 | **来源：** 全项目诊断修复（filter-repo 剔除已删媒体 blob，.git 102M → 44M）

## 发生了什么

- 2026-08-20 [claude] 用 `git filter-repo` 重写了 main 分支历史（剔除 asset-pipeline 已外移产出、_lovart_output、game-bot 运行产出等历史 blob），并已强制推送
- 旧远端 HEAD `8ca735f` → 新 HEAD `164d4b3`（内容与旧历史对应提交等价，哈希全部变化）

## 所有 AI 必须执行

- **任何机器上的旧克隆 = 无效**：直接 `git pull` 会报 divergent branches，`git push` 会被拒
- 正确操作：删掉旧克隆，`git clone git@github.com:g676967453-blip/creation-forge.git` 重新克隆
- 有未推送的本地工作时：先把改动复制出来（或 `git format-patch`），重新克隆后再apply

## 备注

- 重写前完整备份：`C:\Users\Administrator\backup-creation-forge-pre-filterrepo.git`（102M 镜像，确认新历史无问题后可删除）
- 旧历史若需找回，可从备份镜像恢复

关联：[[project-项目结构]]、[[asset-pipeline产出目录]]
