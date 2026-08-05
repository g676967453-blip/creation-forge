# 交互规范系统 · 进度表

> 最后更新：2026-08-05 | 基线版本：v2.0.0（迁入自 idle-rpg-mobile-design-system）

## 当前状态

- **阶段**：运转中
- **进度**：v2.0.0 完成（设计系统总则 + 组件母版库 + 页面模板 + 交互规范 + HTML 预览页）
- **阻塞**：无

## 版本路线

| 版本 | 来源 | 目标 | 状态 |
|------|------|------|------|
| v1.0 | 造化坊自建 | MD→HTML 生成器 + 竖版/横版规范 + 22 组件 + 调参工具 | ✅（已归档） |
| v2.0 | idle-rpg-mobile-design-system | 通用竖版手游 UI 设计系统迁入 | ✅ |
| v2.1 | 后续迭代 | 基于文档在 Figma 中建立变量、样式和组件库 | 🔲 |

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
│   ├── component-spec.md                   # 组件母版库详规
│   ├── screen-patterns.md                  # 游戏界面模板
│   ├── interaction-guidelines.md           # 交互、反馈与恢复规范
│   └── design-system-preview.html          # 可浏览预览页（CSS only）
├── assets/
│   └── README.md                           # 资源目录说明
└── _archive/
    └── v1.0/                               # v1.0 归档（22 组件 + 渲染器 + 调参工具）
```

## 下一步

1. 使用顶部 HUD、列表页与确认弹窗进行视觉压力测试
2. 基于文档在 Figma 中建立变量、样式和组件库
3. 如进入产品化阶段，补充平台导出规范和工程资源命名表

## 核心文件说明

| 文件 | 行数 | 内容 |
|------|------|------|
| [design-system.md](docs/design-system.md) | 456 | 07 章完整设计系统：系统说明、设计指令、组件规范、网格框架、界面模板、资源管理、协作说明 |
| [component-spec.md](docs/component-spec.md) | 117 | 组件母版库：操作/输入/选择/信息/反馈/容器/弹层，含通用状态矩阵与验收清单 |
| [screen-patterns.md](docs/screen-patterns.md) | 81 | 界面模板：主界面/全屏窗口/弹窗/Tips/状态通知，含结构与验收规则 |
| [interaction-guidelines.md](docs/interaction-guidelines.md) | 94 | 交互规范：手势定义/L1-L4反馈/点击提交/导航页面栈/加载弱网恢复/状态切换/动效无障碍 |
| [design-system-preview.html](docs/design-system-preview.html) | 415 | 纯 CSS 可浏览预览页：左侧原型样例 / 右侧规则说明 / 7 大模块 + 23 子标签 |
