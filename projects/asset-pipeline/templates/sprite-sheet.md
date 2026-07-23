# 精灵表 (Sprite Sheet) Prompt 模板

> **适用**：游戏内精灵表 — 敌人、角色、召唤物、NPC 的动画帧
> **特性**：水平 stripe spritesheet、小尺寸、透明背景、多帧动画

---

## 主模板

```text
pixel art {subject} sprite sheet for a {game_style} game,
side view, {frame_count}-frame horizontal strip, each frame exactly {frame_w}x{frame_h} pixels,
{subject_description},
{color_description},
dark transparent background, clean pixel edges, no anti-aliasing,
limited color palette, readable silhouette at tiny size,
game asset
```

---

## 占位符说明

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{subject}` | 资产类型 | `monster` / `character` / `summon creature` / `NPC` |
| `{game_style}` | 游戏风格 | `Chinese xianxia` / `dark fantasy` / `sci-fi` |
| `{frame_count}` | 帧数 | `4` / `6` / `8` |
| `{frame_w}` | 单帧宽度（px） | `25` / `32` / `48` |
| `{frame_h}` | 单帧高度（px） | `25` / `32` / `48` |
| `{subject_description}` | 主体描述（外貌、特征、动作） | `a charging demon with horns, red-skinned, snarling expression` |
| `{color_description}` | 配色描述 | `dark red and orange tones with black shadows` |

---

## 使用示例

### 敌人精灵表

```text
pixel art charging demon monster sprite sheet for a Chinese xianxia game,
side view, 4-frame horizontal strip, each frame exactly 25x25 pixels,
red-skinned fiend with small horns and a snarling expression,
dark red and orange tones with ink-black shadows,
dark transparent background, clean pixel edges, no anti-aliasing,
limited color palette, readable silhouette at tiny size,
game asset
```

### Boss 精灵表

```text
pixel art demon lord boss monster sprite sheet for a Chinese xianxia game,
side view, 6-frame horizontal strip, each frame exactly 70x73 pixels,
massive winged demon lord with crown-like horns, glowing eyes,
purple and black with blood-red accents, dark aura,
dark transparent background, clean pixel edges, no anti-aliasing,
limited color palette, imposing silhouette,
game asset
```

### 召唤物精灵表

```text
pixel art spirit fox summon sprite sheet for a Chinese xianxia game,
side view, 4-frame horizontal strip, each frame exactly 32x24 pixels,
orange-red fur with white tail tip, mystical glowing aura,
running animation loop,
dark transparent background, clean pixel edges, no anti-aliasing,
limited color palette, readable at small size,
game asset
```

---

## 技术约束

- **输出格式**：水平 stripe spritesheet（所有帧等宽等高排列在一行）
- **生成尺寸**：1024×1024（后处理缩放到目标尺寸）
- **背景**：品红底 `#FF00FF` 或透明（品红需后处理抠除）
- **缩放**：NEAREST 算法（保持像素锐利）
- **模型推荐**：`midjourney`（成品）/ `nano_banana_pro`（草稿）

---

## 相关文档

- [美术资产后处理](../scripts/postprocess.py)
- [03-工作流阶段](../docs/03-工作流阶段.md)
