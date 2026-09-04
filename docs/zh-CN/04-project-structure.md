# 04 — 项目结构说明（五板块版）

> 最后更新：2026-09-04（五板块拆分重构）

## 全景图

```
ever-forge/                         # 平台共享层
│
├── 📄 CLAUDE.md                    # Claude 配置入口（五板块地图）
├── 📄 AI_COLLABORATION.md          # 多 AI 协作协议（目录规则/锁/冲突）
├── 📄 ONBOARDING.md                # 新 AI 首次对话入口
├── 📄 package.json / tsconfig.base.json / eslint.config.mjs
│
├── 📁 memory/                      # 跨 AI 共享记忆
├── 📁 .ai-locks/                   # 文件锁
├── 📁 .claude/                     # Claude Code 配置（settings + skills）
├── 📁 templates/                   # 项目模板（game-phaser / game-godot / PROGRESS）
├── 📁 shared/                      # 共享库（@creation-forge/*）
├── 📁 tools/                       # 平台级工具（scaffold-game / check / convert-encoding / extract_pdf / _archive）
├── 📁 pdf_libs/                    # PDF 依赖库
│
├── 🧭 造化仪表盘/                  # 板块1 · 中枢
│   ├── 📄 CLAUDE.md / README.md    # 中枢职责 + 板块门户
│   ├── 📄 目标规划.md / 个人待办.md # 全仓权威活数据
│   ├── 📁 works/                   # 工作日志（一事一记 + 视频草案）
│   ├── 📁 reports/                 # 仪表盘 HTML + 报告
│   ├── 📁 data/                    # 仪表盘数据文件（goals-issues.json 等）
│   └── 📁 tools/                   # collect-data / generate-dashboard / dashboard-server
│       │                           # todo-file / new-journal + dsh-harness/
│
├── 🚀 projects/                    # 板块2 · 项目库
│   ├── 📄 README.md                # 项目库门户
│   ├── 📁 GAME-002/                # 开仙门（Godot 4.7 独立游戏）
│   ├── 📁 IAA/                     # IAA 救火英雄等
│   ├── 📁 interaction-spec-system/ # 游戏交互规范生成系统
│   ├── 📁 game-bot/                # 游戏自动化机器人
│   ├── 📁 qin-court-audience/      # 秦殿听政（HTML 原型）
│   ├── 📁 情景认知小程序/           # 情景认知训练小程序
│   └── 📁 概念设计工作流/           # 概念设计参考与流程
│
├── 📚 docs/                        # 板块3 · 知识库（纯知识）
│   ├── 📄 README.md                # 30 秒选桶导航
│   ├── 📁 zh-CN/                   # 宪法 + 工程规范（manifesto / 01–07）
│   ├── 📁 knowledge/               # 领域知识索引
│   ├── 📁 workflows/               # 标准化协作流程
│   ├── 📁 tool-guides/             # 工具知识库
│   ├── 📁 specs/                   # 技术规范收口
│   ├── 📁 personal-work-records/   # 主美个人工作记录知识库
│   └── 📁 en/                      # 英文极简概述
│
├── 🎨 asset-pipeline/              # 板块4 · 美术制作
│   ├── 📄 CLAUDE.md                # 技术美术配置（Lovart 管线）
│   ├── 📁 docs/                    # 工作流/模板/踩坑记录
│   ├── 📁 templates/               # Prompt 模板（图标/建筑/精灵表…）
│   └── 📁 scripts/                 # 后处理脚本（产出在桌面 asset-pipeline-outputs/）
│
└── 📱 xiaohongshu/                 # 板块5 · 自媒体
    ├── 📄 CLAUDE.md                # 内容生产配置
    └── 📁 各期内容目录/             # 每期素材源声明 → 帖子 → 发布记录
```

## 架构原则

### 五板块自治 + 平台共享层

| 层 | 内容 | 规则 |
|----|------|------|
| 板块1 造化仪表盘/ | 个人日程/任务 + 各板块变动检测 → 工作日志 + Git 管理 | 全仓唯一中枢；目标/待办/works 权威在此 |
| 板块2 projects/ | 所有项目 | 新项目唯一合法位置 `projects/<项目名>/` |
| 板块3 docs/ | 纯知识（活数据已迁出） | 不在 docs/ 放待办/目标等状态表 |
| 板块4 asset-pipeline/ | AI 美术生产线 | 生成产出存桌面，不进仓库 |
| 板块5 xiaohongshu/ | 小红书内容生产 | 素材源单向下沉引用板块1 works/ |
| 平台层（根） | 协议/记忆/锁/模板/共享库/平台工具 | 非任何板块数据区；新增一级目录须用户批准 |

### 跨板块引用约定

- 板块间一律**显式相对链接**，不写裸短路径
- 数据依赖**单向下沉**：板块2–5 声明对板块1 的依赖（如素材源）；板块1 不反向依赖板块知识正文
- 改动其他板块文件须用户知情（断链小修除外）

## 各目录设计意图

### `造化仪表盘/`（板块1）— 中枢

**一事一记**：一个文件 = 问题解决日志 + 视频生产草案，命名 `YYYY-MM-DD-[ai标签]-简短描述.md`。
仪表盘工具链（collect-data → generate-dashboard → GH Pages）在本板块 tools/ + reports/ 内闭环，
通过 `git log/status -- <dir>` 检测各板块变动。详见 [运转线路图](./operational-loop.md) 与 板块1 CLAUDE.md。

### `projects/`（板块2）— 项目库

每个项目独立目录，自带 CLAUDE.md/README.md 管理自己：玩法原型 > 画面精美，快速迭代 > 一次做对。
模板起步：复制 `templates/game-phaser/` 或 `templates/game-godot/`。

### `docs/`（板块3）— 知识库

| 原则     | 说明                                 |
| -------- | ------------------------------------ |
| 中文为主 | 团队沟通语言是中文，文档优先用中文写 |
| 编号排序 | 01-07 按照从概念到细节的顺序排列     |
| 英文精简 | `en/` 下只放概览，详细内容指向中文   |
| 即查即用 | 每个文档独立可读，不要求按顺序读     |
| 纯知识   | 活数据（待办/目标）与仪表盘在板块1    |

### `asset-pipeline/`（板块4）— 美术制作

人-Claude-Lovart 三角协作生产线；生成产出（图片/视频/音频）一律存桌面 `asset-pipeline-outputs/` 不进仓库，
仓库内只保留工作流文档、规则、过程数据与参考图。详见 `asset-pipeline/CLAUDE.md`。

### `xiaohongshu/`（板块5）— 自媒体

每期一个目录，含素材源声明（指向板块1 works/）、帖子成品与发布数据。详见 `xiaohongshu/CLAUDE.md`。

### 平台层 — 共享设施

| 目录 | 用途 |
|------|------|
| `memory/` | 跨 AI 共享记忆（所有 AI 读写，锁保护） |
| `.ai-locks/` | 文件锁（修改共享文件前检查） |
| `.claude/` | Claude Code 配置（settings + skills） |
| `templates/` | 项目模板，复制即用 |
| `shared/` | 共享库，npm workspace 协议 `@creation-forge/*` 引用，不写 `../../../shared/...` |
| `tools/` | 平台级工具（板块工具随板块走，如 造化仪表盘/tools/） |

---

_[返回 docs 总导航](../README.md)_
