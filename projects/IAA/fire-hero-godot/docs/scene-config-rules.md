# Godot 场景配置规则（救火英雄 IAA）

> 版本 v1.1 ｜ 对齐逻辑画布 **450×800**。  
> 本文件固定「场景如何摆层、资源如何命名、图层裁剪规则」，作为持续开发依据。

---

## 1. 全局坐标与拉伸

| 项 | 值 |
|----|-----|
| 逻辑画布 | **450×800**（`project.godot` 视口） |
| 拉伸模式 | `canvas_items` + `aspect=keep`（不变形） |
| 导出倍率 | 默认 **@2x = 900×1600** |
| 竖屏 | `handheld/orientation=1` |

> `GameConstants` 是唯一坐标/尺寸来源：`VIEW_W/VIEW_H/PADDLE/BRICK/GRID_TOP` 等全部集中于此。

---

## 2. 节点层顺序（自下而上）

```text
Main
└─ GameRoot (Node2D, game_root.gd)
   ├─ Background   (TextureRect)   ← 纯背景，视觉层
   ├─ BrickHost    (Node2D)        ← 可交互/计分窗（逻辑砖），在背景之上
   ├─ Paddle       (CharacterBody2D)
   └─ Ball         (CharacterBody2D)
└─ UI (CanvasLayer, main_ui.gd)
   ├─ HUD
   └─ Overlays (Menu/LevelClear/GameOver/Pause)
```

**职责边界**

| 层 | 职责 | 是否碰撞 | 是否接输入 | 是否计分 |
|----|------|----------|-----------|----------|
| Background | 纯视觉氛围底图 | 否 | 否 | 否 |
| BrickHost | 所有可玩窗（火/救/红） | 是 | 否 | 是（逻辑砖） |
| Paddle | 移动接人平台 | 是 | 是 | 否 |
| Ball | 弹射物 | 是 | 否 | 是 |
| HUD/Overlays | 信息与弹窗 | 否 | 是 | 否 |

---

## 3. 背景图层规则

> 背景源可多图层（如 PSD），但 **进入 Godot 的 `Background` 用一张合成/扁平图**，或按需保留分层。

### 3.1 来源与管线

- 源：`救火英雄背景.psd`（桌面包 450×800，与逻辑画布一致）。
- 导出工具：`tools/export_psd_layers.py`（逐层转透明 PNG + `layers.json`）、`tools/make_bg_composite.py`（纯背景组合成）。
- **背景只应包含「纯氛围」图层**（天空/远景/楼体/地面/前景）。
- **不要**把「可交互窗户」（兔子待救/着火窗等）烘焙进背景 —— 它们由 `BrickHost` 的动态砖绘制，烘焙会造成重影/错位。

### 3.2 资源文件

```text
assets/backgrounds/
├── bg_level_default.png            # 450×800 合成背景（当前使用）
├── bg_level_default_900x1600.png   # @2x（可换用）
├── layers/                          # 逐层透明 PNG（导出件、可重跑）
│   ├── 00_背景.png … 04_前景.png     # 纯背景组
│   ├── 05_… 17_…                    # 可交互窗组（默认不进背景，供砖用）
│   └── composite_reference.png      # 全合成参考
└── layers.json                      # 层元数据（utf-8）
```

### 3.3 命名

- 背景：`bg_level_{编号}_{尺寸}.png`
- 逐层导出（脚本产出）：`{z:02d}_{图层名}.png`
- 元数据键顺序固定，勿手改 `z`。

### 3.4 过滤

- **背景类**（插画/大图）：默认 `linear` 平滑（放大不发渣），`mipmaps` 可选。
- **像素 sprite**（窗/球/板）：`nearest`，像素感清晰。
- 透明 PNG：保持 `premult_alpha` 关闭，避免边缘黑/白边。

---

## 4. 像素/玩法元素安排

| 元素 | 归哪层 | 实现 |
|------|--------|------|
| 火窗 1/2/3 级 | BrickHost（砖） | `brick.gd`：`window_fire.png` 为模板，按 `fire_level` 用 `modulate` 区分 **火1/火2/火3**（亮→暗红） |
| 救援窗 | BrickHost（砖） | `window_rescue.png`（木框+兔子），红色变体 `window_rescue_red.png`（红框，跳楼/加分） |
| 普通未着火窗 | 装饰/背景 | `window_normal.png`（近期未用于可玩砖） |
| 蹦床 | Paddle | 三元素像素图：消防员左 + 蹦床 + 消防员右；`Sprite2D`，宽度随道具拉伸，消防员贴合两端；`play_bounce()` 弹跳 |
| 弹射物 | Ball | `Sprite2D` 消防员角色，随 `GameState.skin_index` 切换纹理；带人时 `modulate` 偏暖黄 |
| HUD 图标 | UI | 用 `assets/pixel/ui/ui_icon_*.png`（64px 像素图标，显示时缩到 18px），TextureRect 展示 |
| HUD 字体 | UI | `assets/fonts/zpix.ttf`（Zpix 中文像素字体），Label 用 `theme_override_fonts` |

### 4.0 蹦床三元素（Paddle）

```text
assets/props/trampoline/
├── mat.png                 蹦床（74x8，静态）
├── fireman_left.png        左消防员（单帧静图源）
├── fireman_right.png       右消防员（单帧静图源）
└── frames/                 消防员2帧动画（底边对齐）
    ├── fireman_left_00/01.png   左消防员帧
    ├── fireman_right_00/01.png  右消防员帧
    ├── strip_fireman_left.png
    └── strip_fireman_right.png
```

- 源：`C:\Users\admin\Desktop\蹦床.psd`（140×71）。
- 导出：`tools/export_trampoline.py`。
- `paddle.gd`：`Visual` 为 `Node2D`，`Mat` 为 `Sprite2D`（静态踩床），`FiremanLeft/FiremanRight` 为 **`AnimatedSprite2D`**（各 2 帧循环，5 FPS，底边对齐）。
- 宽度拉伸：`_apply_width(w)` 改碰撞盒与 `_relayout()`；消防员跟随两端（`FIREMAN_LEFT/RIGHT_POS`）。
- 弹跳：`play_bounce()` —— 发射/接球时 `Visual.position.y` 下压 6px 再回弹。
- 说明：`main.tscn` 中消防员节点不再设 `texture`，由 `paddle.gd` 装配 `SpriteFrames`。`frames/` 由 `tools/export_tramp_frames.py` 生成（英文名是脚本 sanitize 结果；源 PSD 里是 消防员1/1-2、消防员2/2-2）。

### 4.0.1 弹射物（Ball）

```text
assets/props/ball/
├── char_dog.png       小狗消防员
├── char_panda.png     熊猫消防员
├── char_capybara.png  卡皮巴拉消防员
├── char_naruto.png    鸣人消防员（哪吒暂用兜底）
└── frames/
    ├── cat_00.png            小猫原始帧0
    ├── cat_01.png            小猫原始帧1
    ├── cat_anim_00.png       底边对齐帧0（39×51，脚底对齐）
    ├── cat_anim_01.png       底边对齐帧1
    ├── frames_strip.png
    └── frames_strip_aligned.png
```

- 源：`C:\Users\admin\Desktop\球.psd`（64×64，角色层；猫拆成 `猫-1`/`猫-2` 两帧）
- 导出：`tools/export_ball_chars.py` / `tools/export_cat_frames.py`
- `ball.gd`：`_visual` 为 **`AnimatedSprite2D`**；`SpriteFrames` 按角色装配：**猫=2 帧循环动画**（6 FPS）、其它角色=单帧
- **序列帧底边对齐**：`tools/align_cat_frames.py` 把 `cat_00/01` 合成到最大帧尺寸、从底部放置（`cat_anim_00/01`），动画切换脚底不跳动
- **拖尾粒子**：`Ball/Trail` 为**静态 `CPUParticles2D` 节点**（在 `main.tscn` 里，编辑器可直接调）；`ball.gd` 用 `@onready var _trail_particles = $Trail` 引用；`_update_trail()` 在运动时 `emitting=true`、并按速度反向设置 `direction`/初速；`refresh_visual()` 把当前角色帧设为粒子贴图
- `CHAR_SCALE=1.0`（原始大小）
- 带人（救援）时 `modulate=(1,0.9,0.62)` 提示

### 4.1 砖纹理资源

```text
assets/props/windows/
├── window_fire.png        52→48 着火窗（火砖模板）
├── window_rescue.png      木框 + 兔子（救援窗）
├── window_rescue_red.png  红框 + 兔子（红窗）
└── window_normal.png      蓝玻璃（普通窗/装饰）
```

生成工具：`tools/make_window_textures.py`（读 `assets/backgrounds/layers/` 合成到 48×48）。

### 4.2 砖视觉映射

| 逻辑 | 纹理 | 附加 |
|------|------|------|
| 火 1 级 `F` | `window_fire.png` | `modulate=(1,0.85,0.55)` 亮橙 |
| 火 2 级 `f` | `window_fire.png` | `modulate=(1,0.62,0.45)` |
| 火 3 级 `g` | `window_fire.png` | `modulate=(1,0.42,0.40)` 深红 |
| 救援 `R` | `window_rescue.png` | 白色 |
| 红窗 `r` | `window_rescue_red.png` | 白色 |

---

## 5. 派生与验收

- 改动背景：`make_bg_composite.py` 重跑 → 替换 `bg_level_default.png` → F5 验证。
- 逐层新增窗素材：导出到 `assets/pixel/props/`，接入 `brick.gd` 材质切换。
- **验收基准**：背景不挡输入、不参与物理；窗由代码绘制；HUD 在 CanvasLayer 顶层；450×800 不变形。

---

## 6. 关键脚本

| 脚本 | 作用 |
|------|------|
| `scripts/game/game_root.gd` | 局内状态机；背景兜底设色（仅 ColorRect 时） |
| `scripts/game/brick.gd` | 窗类型/等级/命中 |
| `scripts/game/level_builder.gd` | 从 `LevelDB` 字符布局生成砖 |
| `scripts/autoload/level_db.gd` | 关卡字符库 |
| `scripts/ui/main_ui.gd` | HUD/弹窗 |
| `tools/export_psd_layers.py` | PSD 逐层导出 |
| `tools/make_bg_composite.py` | 纯背景组合成 |
