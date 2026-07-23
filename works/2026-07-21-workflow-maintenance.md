# [2026-07-21] 工作流文档维护 + asset-pipeline 新建

---

## 📋 问题解决日志

### 遇到了什么

1. 工作流体系建立后，用户手动巡检并更新了多份文档，使其与实际操作保持一致
2. SKILL 存放在 `.claude/skills/`，用户确认了位置并了解其局限性（不可直接复制共享给朋友）
3. 新建了 `projects/asset-pipeline/` 项目

### 产出结果

**文档更新（用户手动）**：

| 文件 | 变更 |
|------|------|
| `docs/workflows/小红书-制作帖子.md` | v1→v2，适配扁平目录结构，Pixso 单文件导入 |
| `docs/workflows/Pixso-导入操作.md` | 协议更新为 Streamable HTTP，路径更新为扁平结构 |
| `docs/workflows/GAME002-功能开发.md` | 新增 UI 制作流程引用（先走 GAME002-UI制作 再写代码） |
| `docs/workflows/README.md` | 新增 GAME002-UI制作 流程（v2，策划→美术需求） |
| `projects/xiaohongshu/CLAUDE.md` | 项目结构简化（去掉文案库/HTML库 中间层），单文件导入规范 |

**新增项目**：
| 项目 | 路径 |
|------|------|
| asset-pipeline | `projects/asset-pipeline/` |

**SKILL 分享结论**：`.claude/skills/` 中的文件绑定项目上下文，不能直接复制。可分享的是 `docs/tool-guides/git/` 和 `github/`（通用工具知识）以及双层结构的思路。

### 关联项目

造化坊 · 基础设施 + 小红书 + GAME-002 + asset-pipeline
