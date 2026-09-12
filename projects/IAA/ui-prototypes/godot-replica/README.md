# Godot → Pixso 界面复刻（除特效）· v2

> 日期：2026-09-11（v2 修复：中文 / 坐标 / 资产板）  
> 来源：`fire-hero-godot` 当前 UI + `assets/**/*.png`  
> Pixso 页：**`Godot-UI-Replica`**

## v2 相对 v1 的修复

| 问题 | 处理 |
|------|------|
| 1 字体乱码 | HTML 用 Python **UTF-8** 生成；导入后用 `Microsoft YaHei` 注入 `cjk-*` 文案（`\\u` 转义，避免 PS 编码污染） |
| 2 排版错位 | 界面屏改为 **绝对坐标**，对齐 `GameConstants`（窗 48/gap4/顶80/蹦床 y650/中心225） |
| 3 资产板 450 框 | `G06-AssetBoard` 为 **1400×1267**，按 **场景 / 角色 / 道具** 分区，素材 **原像素尺寸** 摆放 |

## 范围

| 包含 | 不包含 |
|------|--------|
| 主菜单 / 局内 HUD / 通关+补给队 / 失败 / 暂停 | 粒子拖尾、命中闪等 **特效** |
| 背景、窗、蹦床、角色、道具、HUD 图标 PNG | 动画帧时序播放 |
| 界面屏 450×800；资产板按内容自适应 | 与 `FireHero-UI-Prototypes` 概念页混用 |

## Pixso Frame

| Frame | 尺寸 | 说明 |
|-------|------|------|
| `G01-Menu` | 450×800 | 主菜单 |
| `G02-InGame` | 450×800 | 局内 |
| `G03-LevelClear-Shop` | 450×800 | 通关+补给队 |
| `G04-GameOver` | 450×800 | 失败 |
| `G05-Pause` | 450×800 | 暂停 |
| `G06-AssetBoard` | **1400×1267** | 场景/角色/道具原尺寸资产板 |

## 本地文件

```
godot-replica/
  screens-v2/           # v2 HTML（UTF-8 + 绝对布局）
  previews-v2/          # 最新导出
  _build via: ui-prototypes/_build_godot_replica_v2.py
  import:     ui-prototypes/_import_godot_replica_v2.ps1 (+ _rest)
  cjk fix:    ui-prototypes/_fix_replica_cjk.py
  README.md
```

```powershell
python ui-prototypes\_build_godot_replica_v2.py
# 导入（大文件可能超时，用 rest 续）
& ui-prototypes\_import_godot_replica_v2.ps1
& ui-prototypes\_import_godot_replica_v2_rest.ps1
python ui-prototypes\_fix_replica_cjk.py
```

## 说明

- 界面 PNG 图层仍来自 Godot `assets/`。  
- 文案层以 Pixso 内 `cjk-*` 文本节点为准（YaHei），避免 `code_to_design` 吞中文。  
- 资产板背景图为 **450×800 原尺寸** 单列展示，窗/角色/道具为 **1:1** 原尺寸。  
