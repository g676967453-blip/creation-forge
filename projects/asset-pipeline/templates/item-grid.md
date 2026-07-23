# 道具图标网格 (Item Grid) Prompt 模板

> **适用**：批量生成游戏道具图标 — 无格子 4×4 排列、二次元/动漫风格
> **Lovart 画布**：1024×1024 → 抠图去背 → 切片为 16 个 256×256 透明 PNG

---

## 三流程总览

```
流程一：Lovart 生成          流程二：PS 手动抠图         流程三：PS 脚本切图
──────────────────          ──────────────────        ──────────────────
4 rows of 4                色彩范围→取绿底→反选        ps_chroma_slice.jsx
无格子线、绿底 #00FF00      Ctrl+J→隐藏原图层          16 × 256×256 透明 PNG
```

---

## 主模板

```text
16 anime-style game item icons arranged in 4 rows of 4, evenly spaced,
no visible grid lines or borders between icons,
{theme_description},
items: {item_list},
each icon standalone with spacing around it,
cel-shading anime art style with clean lineart and flat colors,
vibrant saturated colors, dark uniform background,
{style_keywords},
game item UI asset
```

---

## 占位符说明

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{theme_description}` | 世界观/主题 | `Naruto shinobi ninja world theme` / `dark fantasy RPG` / `cyberpunk sci-fi` |
| `{item_list}` | 16 个道具的英文列表（逗号分隔） | `shuriken, kunai, explosive tag, soldier pill, scroll, headband, ...` |
| `{style_keywords}` | 风格关键词 | `Japanese anime RPG` / `Korean manhwa style` / `Western comic style` |

---

## 使用示例

### 火影忍者

```text
16 anime-style game item icons arranged in 4 rows of 4, evenly spaced,
no visible grid lines or borders between icons,
Naruto shinobi ninja world theme,
items: shuriken throwing star, kunai dagger, explosive paper tag,
soldier pill, ancient scroll, Leaf Village forehead protector headband
with leaf symbol, sharingan red eye, senbon metal needles, curse mark
pattern, smoke bomb, sealing paper tag, ninja sword, chakra blade knife,
bell, ramen bowl, toad coin wallet,
each icon standalone with spacing around it,
cel-shading anime art style with clean lineart and flat colors,
vibrant saturated colors, dark uniform background,
Japanese anime RPG game item UI asset
```

### 暗黑奇幻

```text
16 anime-style game item icons arranged in 4 rows of 4, evenly spaced,
no visible grid lines or borders between icons,
dark fantasy RPG world theme,
items: health potion, mana crystal, cursed dagger, enchanted shield,
dragon scale, phoenix feather, dark tome, holy grail, poison vial,
rune stone, skull amulet, iron key, magic ring, leather bag,
golden chalice, demon horn,
each icon standalone with spacing around it,
cel-shading anime art style with clean lineart and flat colors,
vibrant saturated colors, dark uniform background,
dark fantasy anime RPG game item UI asset
```

---

## 技术约束

| 参数 | 值 |
|------|-----|
| 生成画布 | 1024×1024 |
| 排列 | 4 行 × 4 列（无可见格子线） |
| 生成背景 | 任意深色纯色底（#1a1a2e 推荐） |
| 抠图 | Lovart 自带 `edit_media` 工具（19 credits / 需确认） |
| 抠图后分辨率 | 可能变化（1024→2048），需额外 NEAREST 缩回 |
| 切片 + 缩放 | 切片 → NEAREST 缩放到 256×256 透明 PNG |
| 切片 | 16 × 256×256 透明 PNG |
| 模型 | nano_banana_pro（草稿）/ midjourney（成品） |

---

## 后处理命令

```bash
# 流程一：Lovart 生成 4×4 图标（绿底 #00FF00，无格子线）
python3 agent_skill.py chat \
  --prompt "{组装好的 Prompt}" \
  --include-tools generate_image_nano_banana_pro \
  --json --download
# 下载到本地，用 PS 打开

# 流程二：PS 手动抠图（30 秒）
#   选择 → 色彩范围 → 取样左上角绿色 → 容差200 → 确认
#   Ctrl+Shift+I 反选
#   Ctrl+J 复制到新图层
#   隐藏原图层

# 流程三：PS 脚本切图
#   文件 → 脚本 → 浏览 → ps_chroma_slice.jsx
#   → 选输出目录 → 16 张透明 PNG
```

### 备选：全自动 PIL 管线

```bash
# 色键抠图（绿底→透明）
python3 scripts/postprocess.py \
  --input grid_raw.png \
  --output grid_clean.png \
  --width 1024 --height 1024 \
  --chroma-key green

# 切片
python3 scripts/slice_grid.py \
  --input grid_clean.png \
  --output-dir outputs/GAME-XXX/icons \
  --prefix GAME-XXX_item \
  --trim
```

> PIL 管线全自动但有绿边风险。PS 手工抠图边缘更干净。

---

## 常见问题

| 问题 | 可能原因 | 处理 |
|------|---------|------|
| AI 画了格子线 | Prompt 还有 "grid/cell" 残留 | 确保使用上述主模板 |
| 抠图工具名错误 | Lovart 内部名称是 `edit_media` | 使用 `--include-tools edit_media` |
| 抠图需确认 | 高成本操作触发 `pending_confirmation` | 用户确认后执行 `confirm` |
| 抠图后分辨率变了 | edit_media 可能放大画布 | 切片后 NEAREST 缩回 256×256 |
| 个别图标被抠坏 | 图标与背景色接近 | 单独对该图标跑 1×1 + 抠图 |
| 图标未对齐 | AI 未严格遵守行排列 | 开 `--trim` 自动裁边 |

---

## 相关文档

- [../docs/06-道具图标工作流.md](../docs/06-道具图标工作流.md) — 完整工作流
- [../scripts/slice_grid.py](../scripts/slice_grid.py) — 切片脚本
- [icon.md](icon.md) — 像素艺术小尺寸图标模板
