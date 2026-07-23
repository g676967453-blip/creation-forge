# [2026-07-21] Lovart + Photoshop 游戏道具图标生产线

---

## 📋 问题解决日志

### 遇到了什么

游戏需要大量道具图标（256×256，二次元风格，透明底）。Lovart 最小画布 1024×1024，如何高效批量产出？

### AI 怎么协作的

**第一轮：建 asset-pipeline 基础设施**

把 Lovart + Claude Code 协作抽象为独立的「美术资产生产线」项目，放在 `projects/asset-pipeline/`。包含：
- 三角协作模型（人=眼睛，Claude=双手，Lovart=引擎）
- 5 篇方法论文档 + 4 个 Prompt 模板
- 后处理脚本（色键抠图 + 切片）
- 集中产出目录 `outputs/`

**第二轮：火影忍者 16 道具试点**

用火影忍者主题跑了完整链路，过程中迭代了 3 版：

v1：4×4 网格 + 绿底色键抠图 → 可用，但有绿色残留和格子线问题
v2：尝试 Lovart 自带 `edit_media` 抠图 → 3 次尝试全部失败（不输出真透明通道，只出灰色棋盘格）
v3：回到绿底色键 + despill 溢色抑制 → PIL 管线跑通，但边缘仍有细微绿边

**第三轮：PS 脚本尝试（最折腾）**

想让 PS 自动完成抠图+切图，写了 7 版 JSX 脚本。PS 2026 移除了大量旧 API（`similar`、`grow`、魔术棒选区、Color Range 的 Action Manager），每版都在不同步骤失败：

| 版本 | 尝试的方法 | 失败原因 |
|------|-----------|---------|
| v1 | Color Range + duplicate/crop | Color Range 不生效 |
| v2 | 魔术棒 + similar() | `similar` 已移除 |
| v3 | Color Range Action Manager(stringID) | 完全不执行 |
| v4 | 按用户操作步骤 Action Manager | 执行了但不产生选区 |
| v5 | Color Range charID 格式 | 完全无反应 |
| v6 | 多点魔术棒取样 | 被当成套索工具 |
| v7 | 仅切图（手动抠图） | `flatten()` 把透明填白 |
| v8（最终） | 仅切图，`mergeVisibleLayers` + 256×256 不 trim | ✅ 跑通 |

**最终方案：分工协作**

| 步骤 | 谁做 | 工具 |
|------|------|------|
| 生成 4×4 绿底网格 | 🤖 Lovart | `chat --include-tools nano_banana_pro` |
| 色彩范围抠图 | 👤 人（PS） | 选择→色彩范围→反选→Ctrl+J |
| 4×4 切片 16×256 | 🤖 脚本 | `ps_chroma_slice.jsx` |

### 产出结果

| 产出 | 路径 |
|------|------|
| asset-pipeline 项目 | `projects/asset-pipeline/` |
| 道具网格 Prompt 模板 | `templates/item-grid.md` |
| PS 切图脚本（最终版） | `scripts/ps_chroma_slice.jsx` |
| PIL 色键+切片（备选） | `scripts/postprocess.py` + `scripts/slice_grid.py` |
| 道具图标工作流文档 | `docs/06-道具图标工作流.md` |

### 关联项目

造化坊 · 基础设施（asset-pipeline）

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：用 AI 批量生成游戏道具图标——生成、抠图、切片三个环节怎么串？
- 为什么这是个问题：AI 能生成但不能抠图（Lovart 的 `edit_media` 不输出真透明），PS 能抠图但不能批量（一个一个切太慢）
- 如果没有 AI 会怎样：手工画 16 个道具图标 + 抠图 + 切图，至少半天

### 第二幕：AI 怎么协作解决的

- 我是这样问 AI 的：「梳理游戏道具图标生成工作流程，4×4 网格，256×256 输出」
- AI 先建了完整的 asset-pipeline 基础设施（方法论文档 + 模板 + 脚本）
- 中间踩了 Lovart 抠图工具的坑——看起来是透明，实际是灰色棋盘格
- PS 脚本写了 7 版才跑通——PS 2026 移除了大量旧 API
- 最终方案：AI 生成 + 人抠图 + 脚本切图，分工明确

### 第三幕：效果展示

- 最终效果：一张 1024 绿底网格 → 30 秒抠图 → 10 秒切出 16 张 256×256 透明 PNG
- 学到的关键点：
  1. AI 工具的能力边界比想象中窄——Lovart 抠图说"已透明"实际没透明
  2. PS 2026 的 JSX API 是重灾区——7 版才找到能跑的方案
  3. 人机分工要务实——该人做的（视觉判断）别让机器做，该机器做的（重复切图）别让人做

### 一句话总结（金句候选）

> AI 生产线上，人的 30 秒抠图 + 脚本的 10 秒切图 > 3 小时的纯手工 > 永远调不通的全自动。

---

_创建日期：2026-07-21 | 标签：基础设施 / Lovart / PS脚本 / 道具图标 / 工作流_
