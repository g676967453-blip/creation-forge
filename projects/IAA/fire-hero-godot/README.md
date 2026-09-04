# 救火英雄 IAA · Godot 4.7

竖屏 9:16 休闲 IAA 小游戏。玩法对标 FC《Flying Hero》，由 HTML 原型 `../fire-hero-iaa.html` 迁移的 **Godot 工程骨架 + 可玩核心循环**。

## 环境

| 项 | 值 |
|----|-----|
| 引擎 | **Godot 4.7 stable** |
| 本机路径 | `F:\Godot_v4.7-stable_win64.exe` |
| 主场景 | `res://scenes/main.tscn` |
| 分辨率 | 450×800（canvas_items + keep） |

### 打开工程

```text
F:\Godot_v4.7-stable_win64.exe --path "J:\ceshi\projects\IAA\fire-hero-godot"
```

或在 Godot 项目管理器中 **导入 / 打开** 本目录（含 `project.godot` 的文件夹）。

## 当前已实现（v0.1.3 · 背景分层 + 场景配置规则）

- [x] 竖屏窗口与主场景
- [x] 蹦床移动（A/D、方向键、按住鼠标拖拽）；暂停时锁定
- [x] 弹射球、墙体反弹、掉落扣命（坠落只结算一次）
- [x] 窗户：火 1/2/3 级、救援窗、红窗（红窗不加硬目标）
- [x] **双通道胜利**（灭火完 **或** 救人完）；防连击重复过关
- [x] **抓人救援**：撞救援窗带走 → 碰蹦床弹起获救
- [x] 手配 6 关 + 程序化 + 空关兜底
- [x] HUD / 主菜单 / 过关 / 失败 / 暂停
- [x] 金币·最高分存档（过关/失败/双倍时写入）
- [x] 广告点位 **mock**（双倍防重领、复活每关 1 次）
- [x] **纯背景整合**：从 `救火英雄背景.psd` 导出图层 → 合成森林树景背景 → 接入 `Background`(TextureRect)；移除占位 FacadeHint
- [x] **窗素材接入砖**：`brick.gd` 用 Sprite2D + 像素纹理（火窗/救援窗/红窗）；火 1/2/3 级用 `modulate` 区分
- [x] **蹦床三元素接入**：消防员左 + 蹦床 + 消防员右；左右消防员为 **2 帧序列动画**（`AnimatedSprite2D`，底边对齐），踩床静态；宽度随时间道具拉伸、消防员贴合两端、发射/接球弹跳动画
- [x] **弹射物换图 + 动画**：`ball.gd` 用 `AnimatedSprite2D`，随 `GameState.skin_index` 切换消防员角色；**小猫 2 帧序列动画**（6 FPS，底边对齐），其它角色单帧；带人时暖黄提示
- [x] **拖尾特效（粒子）**：`Ball/Trail` 静态 `CPUParticles2D`（编辑器可调），用角色帧做粒子、暖橙淡出，运动时发射/静止停发
- [x] **局内 HUD 像素化**：Zpix 中文像素字体（`assets/fonts/zpix.ttf`）+ 像素图标（`assets/pixel/ui/ui_icon_*`，关卡/分数/金币/生命）；TopBar 改「图标+数值」子 HBox，Goal 栏去 emoji
- [x] 场景配置规则：`docs/scene-config-rules.md`
- [x] 工具：`tools/export_psd_layers.py` / `tools/make_bg_composite.py` / `tools/make_window_textures.py` / `tools/export_trampoline.py` / `tools/export_ball_chars.py` / `tools/export_cat_frames.py` / `tools/align_cat_frames.py` / `tools/export_tramp_frames.py`

---

## 美术资源（背景）

- 源：`C:\Users\admin\Desktop\救火英雄背景.psd`（450×800）
- 图层导出：`assets/backgrounds/layers/*.png` + `layers.json`
- 已接入背景：`assets/backgrounds/bg_level_default.png`（纯森林树景，不含烘焙窗）
- 可交互窗户（兔子/着火）**不进背景**，由 `BrickHost` 动态砖绘制（纹理见 `assets/props/windows/`）

## 操作

| 操作 | 键鼠 |
|------|------|
| 移动蹦床 | A/D、←/→、按住左键拖拽 |
| 发射 | 空格 / Enter / 点击 |
| 暂停 | Esc |

## 目录

```text
fire-hero-godot/
├── project.godot
├── icon.svg
├── README.md
├── scenes/
│   └── main.tscn          # 主场景
└── scripts/
    ├── autoload/
    │   ├── game_state.gd  # 分数/金币/生命/存档
    │   └── level_db.gd    # 关卡字符布局
    ├── game/
    │   ├── constants.gd
    │   ├── game_root.gd   # 局内循环
    │   ├── paddle.gd
    │   ├── ball.gd
    │   ├── brick.gd
    │   └── level_builder.gd
    └── ui/
        └── main_ui.gd
```

## 关卡字符（与 HTML / level-editor 一致）

| 字符 | 含义 |
|------|------|
| `F` | 火 1 级 |
| `f` | 火 2 级 |
| `g` | 火 3 级 |
| `R` | 救援窗 |
| `r` | 红窗（加分向，非硬目标） |
| `.` / `N` | 空 |

可用上级目录 `level-editor.html` 编辑后，把 `LEVEL_LAYOUTS` 同步进 `scripts/autoload/level_db.gd`。

## 下一步（建议）

1. 道具最小集（钱袋/长条/锤子/灭火器/1UP）
2. 角色系统 + 补给队（见 `../微创新需求规格.md`）
3. 美术替换 ColorRect（`../art`、`../assets`）
4. 导出微信/抖音小游戏或 Web（按发行路径选模板）
5. 正式广告 SDK 替换 mock

## 关联文档

- `../救火英雄IAA游戏企划.md`
- `../fire-hero-game-rules.md`
- `../微创新需求规格.md`
- `../fire-hero-iaa.html`（参考原型）
