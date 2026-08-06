# 交互规范系统 · 进度表

> 最后更新：2026-08-06 | 基线版本：v2.0.0（迁入自 idle-rpg-mobile-design-system）

## 当前状态

- **阶段**：运转中
- **进度**：v2.0.0 完成（设计系统总则 + 组件母版库 + 页面模板 + 交互规范 + HTML 预览页）
- **阻塞**：无

## 版本路线

| 版本 | 来源 | 目标 | 状态 |
|------|------|------|------|
| v1.0 | 造化坊自建 | MD→HTML 生成器 + 竖版/横版规范 + 22 组件 + 调参工具 | ✅（已归档） |
| v2.0 | idle-rpg-mobile-design-system | 通用竖版手游 UI 设计系统迁入 | ✅ |
| v2.1 | 后续迭代 | 基于文档在 Figma 中建立变量、样式和组件库 | 🔶 进行中（2026-08-06 完成场景模式库） |

## 文件结构

```
interaction-spec-system/
├── README.md                               # 项目说明
├── PROGRESS.md                             # 本文件
├── STATUS.md                               # 项目状态快照
├── project.json                            # 项目元数据
├── docs/
│   ├── README.md                           # 文档索引
│   ├── design-system.md                    # 设计系统总则（07 章）
│   ├── component-spec.md                   # 组件母版库详规（含第 7 节游戏复合组件）
│   ├── screen-patterns.md                  # 游戏界面模板
│   ├── game-screen-patterns.md             # 游戏场景界面模式库（v2.1 新增）
│   ├── page-content-templates.md           # 页面内容字段模板（v2.1 新增）
│   ├── interaction-guidelines.md           # 交互、反馈与恢复规范
│   └── design-system-preview.html          # 可浏览预览页（CSS only）
├── assets/
│   └── README.md                           # 资源目录说明
└── _archive/
    └── v1.0/                               # v1.0 归档（22 组件 + 渲染器 + 调参工具）
```

## 下一步

1. 继续按 [v2.1 内容补完计划](docs/v2.1-production-plan.md) 推进 Figma 组件化、页面内容模板和工程交接三条内容线
2. 已完成 [Figma 变量与样式清单](docs/figma/variables-and-styles.md)
3. 已完成 [工程资源命名与导出规范](docs/engineering/export-and-naming.md)
4. 已完成 [游戏场景界面模式库](docs/game-screen-patterns.md)（2026-08-06，基于上线产品界面分析抽象 8 场景 + 11 复合组件）
5. 已完成 [页面内容字段模板](docs/page-content-templates.md)（2026-08-06，覆盖主界面 / 列表 / 网格 / 详情 / 筛选 / 弹窗 / 状态页）
6. 下一步补 [Figma 组件与变体清单](docs/figma/component-inventory.md)；场景模式库与页面内容字段模板待同步至 HTML 预览页

## 核心文件说明

| 文件 | 行数 | 内容 |
|------|------|------|
| [design-system.md](docs/design-system.md) | — | 07 章完整设计系统：系统说明、设计指令、组件规范、网格框架、界面模板、完整资源管理规范、协作说明 |
| [component-spec.md](docs/component-spec.md) | — | 组件母版库：操作/输入/选择/信息/反馈/容器/弹层，含按钮等级、通用状态矩阵与验收清单 |
| [screen-patterns.md](docs/screen-patterns.md) | 81 | 界面模板：主界面/全屏窗口/弹窗/Tips/状态通知，含结构与验收规则 |
| [interaction-guidelines.md](docs/interaction-guidelines.md) | 94 | 交互规范：手势定义/L1-L4反馈/点击提交/导航页面栈/加载弱网恢复/状态切换/动效无障碍 |
| [game-screen-patterns.md](docs/game-screen-patterns.md) | — | 游戏场景界面模式库：加载/大厅/关卡/战斗/布阵/结算/养成/个人主页 8 场景分区范式 + 横切规则 |
| [design-system-preview.html](docs/design-system-preview.html) | — | 纯 CSS 可浏览预览页：左侧原型样例 / 右侧规则说明 / 资源管理含出图、背景、命名、按钮、多语言与交付六个子标签 |
| [v2.1-production-plan.md](docs/v2.1-production-plan.md) | — | v2.1 内容补完计划：Figma 组件化、页面内容模板、工程交接规范 |
| [variables-and-styles.md](docs/figma/variables-and-styles.md) | — | Figma 变量与样式清单：色彩、字体、间距、栅格、圆角、描边、阴影、动效 |
| [export-and-naming.md](docs/engineering/export-and-naming.md) | — | 工程资源命名与导出规范：图标与全屏背景安全区、`_ignore` 防压缩命名、通用资源/按钮类型字典、多语言后缀、切图尺寸、倍率、状态图和交付清单 |
| [page-content-templates.md](docs/page-content-templates.md) | — | 页面内容字段模板：主界面/列表/网格/详情/筛选/弹窗/状态页，含内容字段、必要状态、长文本规则与交付说明 |
