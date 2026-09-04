# 美术资产生产线 (Asset Pipeline)

> **人-Claude-Lovart 三角协作的美术生产基础设施**

## 这是什么？

这是造化坊的 AI 美术生产基础设施。不是一个游戏项目，而是一条**生产线**——定义了人类（创意总监）、Claude（技术美术）、Lovart（渲染引擎）三者如何协作，高效产出游戏美术资产。

## 核心思路

```
你说"想要一个冷峻的剑修角色" → Claude 写 Prompt → Lovart 生成 → 你看结果
                                                                        │
                                               "头发不够银" ←──────────────┘
                                                                        │
                                          Claude 调 Prompt → Lovart 再生成 → 你确认 → 入库
```

- **人类负责看**（视觉判断、方向决策）
- **Claude 负责做**（Prompt 设计、命令执行、文件管理）
- **Lovart 负责渲染**（图像/视频/音频生成）

## 目录结构

```
asset-pipeline/
├── CLAUDE.md                 ← AI 协作入口（Claude 的角色定义 + 行为规则）
├── README.md                 ← 本文件
├── docs/                     ← 方法论文档
│   ├── 01-协作模型.md         ← 三角协作核心循环
│   ├── 02-Prompt工程.md       ← Prompt 设计方法与技巧
│   ├── 03-工作流阶段.md       ← 草稿→成品→集成的三阶段流程
│   ├── 04-质量验收标准.md     ← 通用 PASS/FAIL 检查清单
│   └── 05-踩坑记录.md         ← 已知问题与规避方法
├── templates/                ← 可复用的 Prompt 模板
│   ├── sprite-sheet.md       ← 精灵表
│   ├── character-portrait.md ← 角色原画
│   ├── icon.md               ← 图标
│   └── vfx.md                ← 特效
├── scripts/                  ← 后处理工具
│   └── postprocess.py        ← 品红抠除 + NEAREST 缩放
└── outputs/                  ← 所有项目的 AI 生成资产
    └── {项目名}/
        ├── portraits/
        ├── sprites/
        └── icons/
```

## 快速开始

### 1. 首次使用 — 配置 Lovart 项目

```bash
# 检查当前状态
python3 agent_skill.py config --json

# 如果没有活跃项目，添加你的 Lovart 项目
python3 agent_skill.py project-add --project-id "你的项目ID" --name "项目名称"
```

### 2. 生成第一张图

对 Claude 说：
> "帮我生成一个像素风格的 ____ 角色，____ 色调，用于角色选择界面"

Claude 会：
1. 从 `templates/` 选取合适的模板
2. 填入你的描述，组装 Prompt
3. 调用 Lovart 生成
4. 下载文件到 `outputs/` 对应目录
5. 把文件路径发给你查看

### 3. 迭代修改

> "头发不够银白，眼神不够锐利"

Claude 会复用同一个 thread_id，保留上下文，只调整你指出的部分。

## 推荐模型选择

| 阶段 | 模型 | 速度 | 质量 | 成本 |
|------|------|------|------|------|
| 草稿探索 | Nano Banana Pro | 快 | 中 | 低 |
| 成品输出 | Midjourney | 中 | 高 | 中 |

## 相关链接

- Lovart 网页端：https://www.lovart.ai/canvas
- Lovart Skill 目录：`~/.claude/skills/lovart-api/`
- 开仙门（首个接入项目）：`../GAME-002/`
