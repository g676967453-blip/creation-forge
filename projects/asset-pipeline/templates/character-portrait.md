# 角色原画 (Character Portrait) Prompt 模板

> **适用**：角色展示用插画 — 角色选择卡、图鉴、加载画面、宣传图
> **特性**：较大尺寸、暗色氛围背景、角色为核心、叙事姿态

---

## 主模板 A — 半身像（图鉴/展示用）

```text
pixel art character portrait for a {game_style} game called "{game_title}",
{cultivator_description},
half-body composition, {pose_description},
{color_description},
{background_description},
16-bit RPG pixel art style, limited color palette, clean pixel edges,
no anti-aliasing, dark mystical atmosphere, Chinese ink-wash influence,
readable silhouette, game key visual, character illustration
```

## 主模板 B — 胸像（角色选择卡片用）

```text
pixel art character bust portrait for a {game_style} game,
{cultivator_description},
chest-up composition, facing {direction}, {pose_description},
{color_description},
dark atmospheric background with {aura_description},
pixel art portrait style, clean pixel edges, no anti-aliasing,
limited color palette, game character card, readable at small size
```

---

## 占位符说明

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{game_style}` | 游戏风格 | `Chinese xianxia` / `dark fantasy` / `cyberpunk` |
| `{game_title}` | 游戏名称（英文） | `"Opening the Immortal Gate"` |
| `{cultivator_description}` | 角色完整描述：外貌、年龄、性别、服装、标志性特征 | `a stern male sword cultivator in flowing cyan robes, silver hair in a Daoist topknot, a glowing flying sword hovering beside his shoulder` |
| `{pose_description}` | 身体语言、手势 | `right hand forming a sword-finger gesture, intense focused gaze` |
| `{color_description}` | 主色和辅色（可含 HEX） | `jade green (#4ecca3) sword aura, ink-black (#0a0a14) robe lining, cloud-white highlights` |
| `{background_description}` | 角色身后的场景 | `misty mountain peaks, distant pagoda silhouettes, ink-wash style` |
| `{aura_description}` | 角色周围的能量效果（胸像用） | `subtle jade-green spiritual energy glow, floating light particles` |
| `{direction}` | 朝向 | `slightly right` / `slightly left` / `forward` |

---

## 使用示例

### 半身像

```text
pixel art character portrait for a Chinese xianxia game called "Opening the Immortal Gate",
a stern male sword cultivator in flowing layered cyan and white robes,
silver-grey hair tied in a high Daoist topknot with a jade hairpin,
sharp angular facial features, piercing eyes with a faint cyan glow,
half-body composition, right hand raised in a sword-finger gesture,
a translucent jade-green (#4ecca3) flying sword hovering beside his right shoulder,
jade green (#4ecca3) sword aura with cloud-white (#c8c8d8) highlights,
ink-black (#0a0a14) robe lining, dark night-sky background (#1a1a2e),
misty mountain peak in the distance, ink-wash style,
16-bit RPG pixel art style, limited color palette, clean pixel edges,
no anti-aliasing, dark mystical atmosphere, Chinese ink-wash influence,
readable silhouette, game key visual, character illustration
```

### 胸像

```text
pixel art character bust portrait for a Chinese xianxia game,
a stern male sword cultivator with silver hair and a jade hairpin,
sharp features, intense cyan-glowing eyes,
chest-up composition, facing slightly right,
a glowing cyan flying sword blade visible over the right shoulder,
jade green (#4ecca3) and ink-black (#0a0a14) color scheme,
dark atmospheric background with subtle jade-green sword energy aura and floating light particles,
pixel art portrait style, clean pixel edges, no anti-aliasing,
limited color palette, game character card, readable at small size
```

---

## 强制关键词（不可修改）

每个 Prompt 必须包含：
```
pixel art, limited color palette, clean pixel edges, no anti-aliasing,
dark mystical atmosphere, Chinese ink-wash influence,
game key visual, character illustration
```

> 注意：`Chinese ink-wash influence` 仅适用于中国风游戏。其他题材替换为对应的风格关键词。

---

## 技术约束

- **生成尺寸**：1024×1024
- **后处理尺寸**：胸像 512×720 / 半身像 512×512（NEAREST 缩放）
- **背景**：暗色氛围（#1a1a2e 基准，不出现明亮天空）
- **模型推荐**：`midjourney`（成品）/ `nano_banana_pro`（草稿迭代）

---

## 相关文档

- [02-Prompt工程](../docs/02-Prompt工程.md) — 色彩约束策略、变量化设计
- [04-质量验收标准](../docs/04-质量验收标准.md) — 像素保真、色彩合规、构图检查
