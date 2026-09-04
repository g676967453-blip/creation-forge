# 建筑网格 (Building Grid) Prompt 模板

> **适用**：批量生成 3D 等距建筑资产 — 无格子 2×2 排列、45° 等距视角
> **Lovart 画布**：2048×2048 → 绿底抠图 → 切片为 4 个 1024×1024 透明 PNG

---

## 设计四步优先级

> **大形体先稳住 → 主题趣味明确 → 有一定特征识别度 → 最后强调精致感**

```
1. Big Form   — 轮廓强、一眼辨识（bold readable silhouette）
2. Fun Theme  — 一个明确有趣的 idea（螃蟹汉堡、冰晶要塞）
3. Recognition — 缩小到地图图标尺寸也能认出来
4. Polish     — 材质光滑如手办、渲染通透干净
```

四步有先后，不能倒过来。先从细节入手会让轮廓和主题失控。

---

## 三流程总览

```
流程一：Lovart 生成          流程二：PS 手动抠图          流程三：切片
──────────────────          ──────────────────        ──────────────────
2 rows of 2                色彩范围→取绿底→反选        slice_grid_2x2.py
无格子线、绿底 #00FF00      Ctrl+J→隐藏原图层          4 × 1024×1024 透明 PNG
```

---

## 主模板

```text
4 3D isometric game buildings arranged in 2 rows of 2, evenly spaced,
no visible grid lines or borders between buildings,
45-degree isometric top-down camera angle,
buildings: {building_descriptions},
each building standalone with spacing around it,
3D pre-rendered isometric game building,
clean lighting with soft ambient occlusion,
{style_keywords},
pure green #00FF00 solid background,
game building asset for 2D isometric game
```

---

## 占位符说明

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{building_descriptions}` | 4 个建筑的英文描述（逗号分隔） | `medieval blacksmith forge with chimney and anvil, fantasy wizard tower with glowing orb on top, rustic tavern with wooden signboard, stone barracks with watchtower` |
| `{style_keywords}` | 风格关键词（**待风格探索锁定后填入**） | `Clash of Clans style, bright saturated colors, playful cartoon proportions, clean details` |

---

## 使用示例

### 通用奇幻

```text
4 3D isometric game buildings arranged in 2 rows of 2, evenly spaced,
no visible grid lines or borders between buildings,
45-degree isometric top-down camera angle,
buildings: medieval blacksmith forge with brick chimney and anvil outside,
fantasy wizard tower with glowing crystal orb on top and spiral staircase,
rustic tavern with wooden signboard and outdoor seating,
stone barracks with watchtower and training dummies,
each building standalone with spacing around it,
3D pre-rendered isometric game building,
clean lighting with soft ambient occlusion,
Clash of Clans style, bright saturated colors, playful cartoon proportions, clean bold outlines,
pure green #00FF00 solid background,
game building asset for 2D isometric game
```

### 仙侠宗门

```text
4 3D isometric game buildings arranged in 2 rows of 2, evenly spaced,
no visible grid lines or borders between buildings,
45-degree isometric top-down camera angle,
buildings: sword cultivation peak with towering sword-shaped pagoda and floating swords,
alchemy hall with bronze cauldron and smoke rising from roof vents,
scripture pavilion with flying eaves and glowing jade tablets,
spirit vein cave with crystal formations and flowing energy streams,
each building standalone with spacing around it,
3D pre-rendered isometric game building,
clean lighting with soft ambient occlusion,
Chinese xianxia fantasy style, mystical atmosphere, clean details,
pure green #00FF00 solid background,
game building asset for 2D isometric game
```

---

## 技术约束

| 参数 | 值 |
|------|-----|
| 生成画布 | 2048×2048 |
| 排列 | 2 行 × 2 列（无可见格子线） |
| 生成背景 | 纯绿 #00FF00 |
| 抠图 | PS 色彩范围 → 容差200 → 反选 → Ctrl+J |
| 切片 | 4 × 1024×1024 透明 PNG |
| 风格探索模型 | Nano Banana Pro（草稿） |
| 成品模型 | GPT Image 2 |

---

## 后处理命令

```bash
# 流程一：Lovart 生成 2×2 建筑（绿底 #00FF00，无格子线）
python3 agent_skill.py chat \
  --prompt "{组装好的 Prompt}" \
  --prefer-models '{"IMAGE":["generate_image_gpt_image_2"]}' \
  --json --download
# 下载到本地，用 PS 打开

# 流程二：PS 手动抠图（30 秒）
#   选择 → 色彩范围 → 取样左上角绿色 → 容差200 → 确认
#   Ctrl+Shift+I 反选
#   Ctrl+J 复制到新图层
#   隐藏原图层

# 流程三：切片
python3 scripts/slice_grid_2x2.py \
  --input grid_clean.png \
  --output-dir outputs/buildings/ \
  --prefix building
```

### 备选：全自动 PIL 管线

```bash
# 色键抠图（绿底→透明，含 despill 去绿边）
python3 scripts/postprocess.py \
  --input grid_raw.png \
  --output grid_clean.png \
  --width 2048 --height 2048 \
  --chroma-key green

# 切片
python3 scripts/slice_grid_2x2.py \
  --input grid_clean.png \
  --output-dir outputs/buildings/ \
  --prefix building \
  --trim
```

> PIL 管线全自动但有绿边风险。PS 手工抠图边缘更干净。

---

## 常见问题

| 问题 | 可能原因 | 处理 |
|------|---------|------|
| AI 画了格子线 | Prompt 还有 "grid/cell" 残留 | 确保使用上述主模板 |
| 建筑角度不是 45° | isometric 关键词未生效 | 增加 "dimetric projection, 30-degree angle from horizontal" |
| 建筑太小/留白太多 | 2×2 排列未充分利用画布 | Prompt 加 "buildings fill their quadrants completely" |
| 建筑被裁剪 | 建筑超出网格边界 | Prompt 加 "fully visible, not cut off, with padding" |
| 绿边残留 | AI 生成的绿色不是精确 #00FF00 | PS 色彩范围容差调到 200，或用 PIL despill |

---

## 相关文档

- [../docs/07-建筑工作流.md](../docs/07-建筑工作流.md) — 完整工作流
- [../scripts/slice_grid_2x2.py](../scripts/slice_grid_2x2.py) — 2×2 切片脚本
- [../scripts/postprocess.py](../scripts/postprocess.py) — PIL 色键抠图
- [item-grid.md](item-grid.md) — 4×4 道具图标模板（参考）
