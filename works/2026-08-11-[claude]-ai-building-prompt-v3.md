---
date: 2026-08-11
ai: claude
type: 设计
status: 完成
tags: [AI绘画, Prompt工程, SLG城池皮肤, Lovart, GPT Image 2]
---

# [2026-08-11] 同一提示词 ×10：从「写十个提示词」到「一句跑十次」的方法论转折

---

## 📋 问题解决日志

### 遇到了什么

前几轮（v1/v2 凤凰+长城）每次都是写 10 个不同提示词来生成 10 张变体。结果是风格不统一、部分提示词跑偏（如 45° 等距视角丢失），而且无法判断问题出在提示词本身还是 AI 的随机性。

### AI 怎么协作的

用户指出关键问题：**「我需要的是同样的提示词文本内容，连续生成十次，而不是帮我写十份提示词生成十个」**。

这是方法论层面的纠正。之前的思路是"10 个创意 → 10 个提示词"，但正确的思路是"1 个验证过的好提示词 → 10 次独立生成 → 10 个天然变体"。

具体操作：
1. 从已有的 gw-phoenix_05.png 反查原始提示词（从 pre-compaction transcript 中恢复）
2. 原封不动用同一句提示词跑 10 次
3. 10 张图在统一风格下产生天然差异

**并发限制问题**：Lovart API 并发上限约 5-6 个，10 并发会触发 `Concurrent task limit reached`。解决方案：分两批 5+5，间隔 30 秒。

### 产出结果

**锁定提示词模板结构**（从 gw-phoenix_05 提炼）：

```
a single 3D isometric building, 45-degree top-down view,
a [主体元素] + [辅助元素作为配件],
[主体描述 — 主导视觉],
[辅助描述 — 微型/配件感],
the entire structure reading as both X and Y in one bold unified form,
blind box toy proportions big chunky block forms minimal fine details cartoon toy texture,
bold readable silhouette,
Rise of Kingdoms semi-realistic 3D rendered style, clean polished rendering,
[色彩方案],
centered filling the frame, pure green #00FF00 solid background,
game asset for 2D isometric mobile SLG world map city skin
```

**今日测试的主题**：

| 批次 | 主题 | 主体 | 辅助 | 文件 |
|------|------|------|------|------|
| phoenix-tower-v3 | 凤凰形塔楼 | 长城塔楼 | 凤凰渐变塔身 | `phoenix-tower-v3_01-10.png` |
| lantern-city-v1 | 孔明灯+城池 | 孔明灯 | 城池底座 | `lantern-city-v1_01-10.png` |
| balloon-city-v1/v2 | 热气球+城池 | 热气球 | 古城吊篮 | `balloon-city-v1/2_*.png` |
| whale-city-v1/v2 | 鲸鱼+城池 | 巨鲸 | 古城屋顶簇 | `whale-city-v1/2_*.png` |
| general-statue-v2 | 将军雕像+军营 | 将军雕像持剑 | 军营底座 | `general-statue-v2_01-05.png` |

### 关联项目

- `projects/asset-pipeline/` — 游戏美术资产生产管线
- Lovart 项目：`4a1e820eeb2e4240b59c78ed3fa03463`

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：用 AI 生成游戏建筑资产时，写 10 个不同提示词 → 风格不统一、部分跑偏、难以定位原因
- 为什么这是个问题：AI 出图有随机性，不同提示词的差异+随机性的差异混在一起，无法判断哪个环节出了问题
- 如果没有 AI 会怎样：传统做法是手绘/建模每个建筑，工时可预见但风格统一靠画师个人把控

### 第二幕：AI 怎么协作解决的

- 我是这样问 AI 的：「同一句提示词，连续生成十次，不是十个不同提示词」
- AI 给了什么方案：从历史记录中反查已验证的好提示词，原封不动跑 10 次
- 中间有什么调整/追问：并发限制问题（5+5 分批）、城市细节过于写实（v1→v2 概括化迭代）
- 最终方案是什么：**一句好提示词 × N 次独立生成 = N 个天然风格统一变体**

### 第三幕：效果展示

- 最终效果：5 个不同主题各 ×5-10 张，共 ~50 张城池皮肤素材
- 演示方式：文件目录截图 + 精选对比图
- 学到的关键点：
  1. **一句好提示词跑十次 > 十句不同提示词各跑一次**
  2. 提示词模板化：只换主题词，结构锁死
  3. 主体/辅助的主次关系是 prompt 结构的关键

### 一句话总结（金句候选）

> **不要写十个提示词——找到一句对的，跑十次。**

### 配图/视频素材清单

- [ ] gw-phoenix_05.png（参考基准图）
- [ ] phoenix-tower-v3 10 张拼图对比
- [ ] balloon-city v1 vs v2 城市概括化前后对比
- [ ] whale-city v1 vs v2 盲盒关键词强化前后对比
- [ ] 提示词模板结构图（主体/辅助/色彩/技术约束的层次）
- [ ] 金句卡片

---

_关联记忆：[[ai-building-prompt-formula]] | 产出目录：`projects/asset-pipeline/outputs/buildings/_drafts/`_
