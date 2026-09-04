# 特效 (VFX) Prompt 模板

> **适用**：游戏内视觉特效 — 闪电、爆炸、护盾、治疗、粒子
> **特性**：帧动画 spritesheet、半透明效果、发光感

---

## 主模板

```text
pixel art {effect_type} effect sprite,
{frame_count}-frame animated spritesheet strip,
each frame {frame_w}x{frame_h} pixels,
{effect_description},
{color_description},
dark transparent background, no anti-aliasing,
game VFX asset
```

---

## 占位符说明

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{effect_type}` | 特效类型 | `lightning bolt` / `explosion impact` / `energy shield` / `healing glow` / `magic sparkle` |
| `{frame_count}` | 动画帧数 | `4` / `6` / `8` |
| `{frame_w}` | 单帧宽度 | `32` / `48` / `64` |
| `{frame_h}` | 单帧高度 | `32` / `48` / `128` |
| `{effect_description}` | 特效视觉描述 | `bright blue-white zigzag electricity with glow, vertical orientation` |
| `{color_description}` | 配色描述 | `bright blue-white core with electric blue glow edges` |

---

## 使用示例

### 闪电链

```text
pixel art lightning bolt effect sprite,
4-frame animated spritesheet strip,
each frame 32x128 pixels,
bright blue-white zigzag electricity with glow, vertical orientation,
bright blue-white core with electric blue (#4080f0) glow edges,
dark transparent background, no anti-aliasing,
game VFX asset
```

### 爆炸

```text
pixel art explosion impact effect sprite,
4-frame animated spritesheet strip,
each frame 32x32 pixels,
bursting orange-yellow fireball with expanding shockwave ring,
orange-yellow burst with vermilion red (#c03030) edges,
dark transparent background, no anti-aliasing,
game VFX asset
```

### 护盾

```text
pixel art energy shield barrier effect sprite,
4-frame animated spritesheet strip,
each frame 48x48 pixels,
translucent blue hexagon dome with pulse glow animation,
translucent blue with bright cyan (#4ecca3) pulse edge,
dark transparent background, no anti-aliasing,
game VFX asset
```

### 治疗

```text
pixel art healing glow effect sprite,
4-frame animated spritesheet strip,
each frame 48x48 pixels,
soft green upward floating particles with twinkling sparkles,
soft green (#44ff44) particles with bright white sparkle centers,
dark transparent background, no anti-aliasing,
game VFX asset
```

### 星光/魔法粒子

```text
pixel art magic star sparkle effect sprite,
4-frame animated spritesheet strip,
each frame 16x16 pixels,
yellow-white twinkling four-pointed star,
yellow-white with soft golden glow,
dark transparent background, no anti-aliasing,
game VFX asset
```

---

## 技术约束

- **输出格式**：水平 stripe spritesheet
- **生成尺寸**：1024×1024（后处理 NEAREST 缩放至目标）
- **背景**：品红底 `#FF00FF` 或透明
- **特效特殊性**：
  - 半透明效果在像素艺术中通过 dithering 实现，非 alpha 渐变
  - 发光效果用对比色 dithering 而非模糊光晕
  - AI 经常在特效上过度使用模糊，需在 Prompt 中强调 `no anti-aliasing, clean pixel edges`

---

## 相关文档

- [sprite-sheet.md](sprite-sheet.md) — 角色/敌人精灵表模板
- [04-质量验收标准](../docs/04-质量验收标准.md)
