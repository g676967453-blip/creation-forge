# 图标 (Icon) Prompt 模板

> **适用**：游戏内图标 — 技能、物品、建筑、道具
> **特性**：正方形、小尺寸、透明背景、高可读性

---

## 主模板

```text
pixel art icon for a {icon_type} called "{icon_name}",
square icon {size}x{size} pixels,
{icon_description},
{color_scheme},
dark mystical background with subtle glow,
clean pixel edges, no anti-aliasing,
game item icon style, limited palette,
transparent background
```

---

## 占位符说明

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{icon_type}` | 图标类型 | `Chinese xianxia technique` / `skill` / `building` / `artifact` / `potion` |
| `{icon_name}` | 图标名称（英文） | `"Sword Control Art"` / `"Vajra Mantra"` / `"Health Potion"` |
| `{size}` | 目标尺寸（px） | `80` / `128` |
| `{icon_description}` | 图标内容描述 | `a glowing cyan flying sword surrounded by sword energy trails` |
| `{color_scheme}` | 配色方案 | `cyan and jade green color scheme with gold accents` |

---

## 使用示例

### 技能图标

```text
pixel art icon for a Chinese xianxia technique called "Sword Control Art",
square icon 80x80 pixels,
a glowing cyan flying sword surrounded by swirling sword energy trails,
cyan and jade green color scheme with gold accents,
dark mystical background with subtle glow,
clean pixel edges, no anti-aliasing,
game item icon style, limited palette,
transparent background
```

### 建筑图标

```text
pixel art building icon for a Chinese xianxia sect,
sword cultivation peak with a towering sword-shaped pagoda, front view,
128x128 pixels,
jade greens with cyan glow and stone grays,
floating on clouds, mystical atmosphere,
clean pixel edges, limited palette,
game building icon style,
transparent background
```

### 道具图标

```text
pixel art potion icon for a dark fantasy game,
square icon 64x64 pixels,
a glowing purple vial with cork stopper, swirling liquid inside,
deep purple and violet with glass reflection highlights,
dark mystical background with subtle purple glow,
clean pixel edges, no anti-aliasing,
game item icon style, limited palette,
transparent background
```

---

## 技术约束

- **输出格式**：独立 PNG（非 spritesheet）
- **生成尺寸**：在 1024×1024 画布上生成，后处理 NEAREST 缩放至目标（80/128/64 px）
- **背景**：品红底 `#FF00FF` 或透明
- **缩放**：NEAREST 算法
- **模型推荐**：`midjourney` / `nano_banana_pro`

---

## 相关文档

- [sprite-sheet.md](sprite-sheet.md) — 精灵表（动画帧）模板
- [04-质量验收标准](../docs/04-质量验收标准.md)
