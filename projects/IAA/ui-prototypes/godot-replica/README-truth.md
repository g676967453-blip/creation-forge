# 以 Godot 为真源的 Pixso 复刻（T01–T05）

> 日期：2026-09-11  
> 策略：**Godot 编辑器场景几何/文案 → 绝对定位 HTML → Pixso `Godot-UI-Replica`**

## Godot 真源采样（MCP `execute_editor_script`）

文件：`godot-ui-truth.json`

主菜单关键矩形（全局坐标，画布 450×800）：

| 节点 | x,y,w,h | 文案 |
|------|---------|------|
| Title | 75, 260, 300, 29 | 救火英雄 |
| StartButton | 75, 378, 300, 36 | 开始游戏 |

布局真源是 Godot 的 **居中 VBox**，不是早期 Pixso 手摆坐标。

## Pixso 帧（已替换旧 G0* 概念/错位稿）

| Frame | 对应 Godot |
|-------|------------|
| `T01-Menu` | Menu 遮罩 + VBox 文案/按钮（含角色切换钮槽位） |
| `T02-InGame` | 背景/窗/蹦床/球 + HUD 四格真源矩形 + 目标/提示 + 虚拟键/技能 |
| `T03-LevelClear` | LevelClear VBox + 双倍/下一关；商店为过关动态面板的近似块（插在 Double 与 Next 之间） |
| `T04-GameOver` | GameOver VBox 全套 |
| `T05-Pause` | Pause VBox 全套 |

预览：`previews-truth/T0*.png`  
重建：`python ui-prototypes/_godot_truth_to_pixso.py`（需 Godot MCP 9080 + Pixso 3667）

## 与「完全一致」的差距（诚实）

| 项 | 状态 |
|----|------|
| 画布 450×800 | 一致 |
| 主菜单标题/按钮矩形来自 Godot | 一致（真源） |
| 无多余五角色卡（旧 G01 多出来的） | 已去掉，贴近 Godot |
| 中文字体 | 导入后统一 Microsoft YaHei |
| `code_to_design` 内部子节点局部坐标 | 可能有轻微嵌套偏移，需目视 |
| 商店/虚拟键/技能 | Godot 多为运行时生成；静帧为代码默认位置近似 |
| 特效 | 仍不复刻 |

## 结论

当前 Pixso **以 Godot 控件矩形为真源重建**，比旧 G0 稿更接近引擎界面；  
若要验收「像素级无差」，还需对 `code_to_design` 嵌套偏移做二次吸附或改用更直接的节点写入。
