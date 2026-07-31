# 游戏交互规范生成系统 (Interaction Spec System)

> 🏭 生产线标准 —— MD 驱动的游戏交互规范生产线

## 项目定位

为造化坊所有游戏项目提供标准化的交互规范生成能力：

- **模板化**：通过 `_interaction-template.md` 复制 → 填参 → 生成 HTML
- **工具化**：CLI 命令一键生成可视化交互规范页面（网格可视化 + 组件陈列 + 手机原型标注）
- **方法论**：低保真交互原型工作流，在便宜阶段验证交互流程

## 核心理念

> 在便宜的阶段犯错——用线框图验证交互流，而不是用高保真。

## 文件结构

```
interaction-spec-system/
├── README.md                          # 本文件
├── specs/                             # 规范文档（MD 源 + 生成 HTML）
│   ├── _interaction-template.md       # 📋 模板（新建规范从这里复制）
│   ├── vertical-game-interaction-spec.md    # 📱 竖版交互规范（720×1334）
│   ├── horizontal-game-interaction-spec.md  # 📱 横版交互规范（1334×750）
│   └── game-lo-fi-prototype-spec.md   # 🔲 低保真原型方法论规范
├── tools/                             # 工具链
│   ├── build-interaction-spec.ts      # CLI 入口
│   └── lib/
│       ├── spec-parser.ts             # YAML 解析 + Markdown 提取
│       └── spec-renderer.ts           # 网格引擎 + HTML 渲染
└── skills/                            # 技能包主副本
    └── game-lo-fi-prototype/          # 低保真交互原型技能（8 文件）
```

## 使用方法

### 创建新交互规范

```bash
# 1. 复制模板
cp projects/interaction-spec-system/specs/_interaction-template.md \
   projects/interaction-spec-system/specs/<项目>-game-interaction-spec.md

# 2. 编辑 YAML frontmatter（平台/画布/网格/色彩参数）
# 3. 填写各章节内容

# 4. 生成 HTML
npm run build-spec -- projects/interaction-spec-system/specs/<项目>-game-interaction-spec.md

# 5. 在浏览器中打开 HTML 验证视觉效果
```

### 使用低保真原型工作流

说出关键词触发技能：
- 「低保真原型」
- 「lo-fi 原型」
- 「线框图验证」

AI 将自动走快速启动（3 步 / 15 分钟）或完整六步流程。

## 技术栈

| 层级 | 技术 |
|------|------|
| 解析 | TypeScript (YAML frontmatter + Markdown) |
| 渲染 | 纯 HTML/CSS（零依赖，自包含） |
| CLI | tsx (TypeScript 直接执行) |
| 技能 | Claude Code SKILL.md |

## 关联项目

- **全局工作流**：`docs/workflows/03-界面交互UI.md`（UI 交互设计四阶段）
- **GAME-002 开仙门**：首个实战验证项目
- **资产管线**：`projects/asset-pipeline/`（道具图标生产）

---

_版本：v1.0 | 创建：2026-07-31 | 上一阶段：交互规范生成系统 v1.0（2026-07-30）_
