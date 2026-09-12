# IAA 救火英雄 · 项目工作流配置

> 本文件只描述 **本项目** 差异。  
> 通用阶段、Gate、工具接法见平台 SOP：  
> [`docs/workflows/游戏开发-Godot-Pixso-Lovart四阶段.md`](../../../docs/workflows/游戏开发-Godot-Pixso-Lovart四阶段.md)  
>  
> **不要**把下列风格内容复制进通用 SOP。像素/Q 版等约定 **仅属于本项目**。

---

## 工程与引擎

| 项 | 值 |
|----|-----|
| 工程路径 | `projects/IAA/fire-hero-godot/`（本机亦可能映射为 `J:\ceshi\projects\IAA\fire-hero-godot`） |
| 引擎 | Godot **4.7.1** stable |
| 可执行文件 | 见 `fire-hero-godot/README.md`（以该文件当前记载为准） |
| 主场景 | `res://scenes/main.tscn` |
| 打开方式 | `fire-hero-godot/open_with_godot.bat` 或 `Godot --path <工程目录>` |

## 画幅与方向

| 项 | 值 |
|----|-----|
| 逻辑画幅 | **450×800** 竖屏 9:16 |
| 拉伸 | `canvas_items` + `aspect=keep` |
| 坐标权威 | `fire-hero-godot` 内 `GameConstants` / [`docs/scene-config-rules.md`](../fire-hero-godot/docs/scene-config-rules.md) |

## 风格锁（仅本项目）

| 文档 | 用途 |
|------|------|
| [`救火英雄美术输出规格与MVP资产清单.md`](../救火英雄美术输出规格与MVP资产清单.md) | 色板、命名、MVP 范围、版权红线 |
| [`fire-hero-godot/docs/pixel-art-spec.md`](../fire-hero-godot/docs/pixel-art-spec.md) | **本项目** 局内像素风位图/动效约定 |
| [`fire-hero-godot/docs/scene-config-rules.md`](../fire-hero-godot/docs/scene-config-rules.md) | 场景分层、背景与 sprite 导入 |
| [`_lovart_prompt.txt`](../_lovart_prompt.txt) | 概念图/氛围母版 prompt 草稿 |

阶段 2 需求表「风格锁引用」示例：

- `projects/IAA/救火英雄美术输出规格与MVP资产清单.md§1.2`
- `projects/IAA/fire-hero-godot/docs/pixel-art-spec.md§1`

## 命名与清单

| 项 | 路径 |
|----|------|
| 资产命名 | 美术规格 §2.3：`{域}_{对象}_{状态}`（`char_` / `win_` / `ui_` 等） |
| 占位资产表 | [`fire-hero-godot/docs/placeholder-asset-map.md`](../fire-hero-godot/docs/placeholder-asset-map.md) |
| P0 回归 | [`fire-hero-godot/docs/P0-regression-checklist.md`](../fire-hero-godot/docs/P0-regression-checklist.md) |
| UI 场景清单 | [`ui-prototypes/UI场景清单.md`](../ui-prototypes/UI场景清单.md) |
| 玩法/微创新 | [`微创新需求规格.md`](../微创新需求规格.md)、[`fire-hero-game-rules.md`](../fire-hero-game-rules.md) |

## Pixso

| 项 | 值 |
|----|-----|
| MCP | `http://127.0.0.1:3667/mcp`（默认，与通用 SOP 相同） |
| 页面约定 | 概念稿：`FireHero-UI-Prototypes`；**引擎复刻**：`Godot-UI-Replica`（G01–G06） |
| 原型与脚本 | [`ui-prototypes/`](../ui-prototypes/) · 说明见 [README](../ui-prototypes/README.md) |
| Godot 复刻 | [`ui-prototypes/godot-replica/`](../ui-prototypes/godot-replica/)（PNG 内嵌 HTML → Pixso） |
| 预览导出 | `ui-prototypes/pixso-previews/` · `ui-prototypes/godot-replica/previews/` |

## 资产目录

| 角色 | 路径 |
|------|------|
| Lovart/草稿 | `projects/IAA/art/wip/` |
| 审核通过候选 | `projects/IAA/art/final/`（可按规格分子目录） |
| 引擎运行时 | `fire-hero-godot/assets/`（`backgrounds` / `props` / `pixel` / …） |
| 阶段 1 SVG 占位（可选） | `fire-hero-godot/assets/ui/svg/` |
| 需求表 / 审核日志 | `projects/IAA/art/asset-request-*.md`、`art/review-log-*.md` |

大体积生成图若不进 Git，可镜像到桌面产出目录，但 **key 与命名仍以本项目美术规格为准**。

## 阶段对照（本项目怎么用通用 SOP）

| 通用阶段 | 本项目落点 |
|----------|------------|
| 1 Godot + 占位 | `fire-hero-godot`；已有可玩循环则补功能时维护占位表 |
| 2 Pixso + 需求 | 扩展 `ui-prototypes` / 现有 Frame；需求表引用上表风格锁 |
| 3 Lovart → Pixso 审 | Prompt 带本项目色板与规格；人在 Pixso 点头 |
| 4 回灌 Godot | 按 `scene-config-rules` 导入；跑 P0 回归 |

## 明确非通用

- **像素风 / 消防 Q 版夜景** = 本项目风格锁，不适用于未声明的其他项目。  
- 其他项目应自建 profile + 自己的 style-lock，仍走同一四阶段 SOP。  
