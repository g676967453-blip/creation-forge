---
description: 批量生成游戏道具图标：4×4 绿底网格 → Lovart 生成 → PS 抠图 → 脚本切 16 张 256×256 透明 PNG。当用户说"生成道具图标""画道具""做一批道具图""出道具"时使用。
---

# /item-icon — 游戏道具图标批量生产

> 三角协作：人类（创意总监）→ Claude（技术美术）→ Lovart（渲染引擎）

## 触发
用户说 `/item-icon` 或 "生成道具图标" 或 "画一批道具" 或 "做道具图"

## 前置确认

开始前向用户确认 3 件事：
1. **风格方向** — 对标哪个游戏？（皇室战争/火影忍者/像素艺术/荒野乱斗）
2. **是否已有验证过的风格关键词** — 有则跳过风格探索
3. **道具清单来源** — 用户提供 16 个道具？还是 AI 根据游戏世界观生成候选再让用户筛选？

## 执行步骤

### 1. 定义道具清单
- 列出 16 个道具，**用英文物质名词描述**（2-4 个词）
- **禁止用中文、禁止加文化标签**（`Chinese` `ancient` `traditional` 会触发国风水墨偏差）
- 示例：
  ```
  ✅ crescent blade guan dao      ❌ 青龙偃月刀
  ✅ jade imperial seal           ❌ 古代传国玉玺
  ✅ bronze ritual cup            ❌ 中国青铜酒器
  ```
- 展示清单，等待用户确认

### 2. 风格探索（仅在无验证关键词时执行）
- **第 1 轮**：用 Nano Banana Pro 快速试 2-3 组风格词，让用户看大方向
- **第 2 轮**：选定方向后用 GPT Image 2 精修，风格命中后**锁死 Prompt**
- 已验证可直接用的风格关键词：

| 游戏对标 | Prompt 关键词（锁死后不再改） |
|---------|---------------------------|
| 皇室战争/荒野乱斗 | `Supercell 3D cel-shaded rendering, bright saturated colors, clean bold outlines, playful cartoon proportions` |
| 火影忍者二次元 | `cel-shading anime art style, clean lineart, flat colors` |
| 像素艺术 | `pixel art, limited color palette, clean pixel edges, no anti-aliasing` |

### 3. 组装 Prompt
从模板 `projects/asset-pipeline/templates/item-grid.md` 组装：
```text
16 game item icons in 4 rows of 4, evenly spaced, no grid lines,
items: {16 个道具英文名，逗号分隔},
{已锁定的风格关键词},
pure green #00FF00 solid background,
game UI asset
```
**关键约束**：`no grid lines` 防 AI 画格子线；`pure green #00FF00` 用于 PS 色彩范围抠图。

### 4. Lovart 生成

模型选择矩阵：

| 场景 | 模型 | 命令参数 |
|------|------|---------|
| 非像素艺术（二次元/3D/Supercell） | GPT Image 2 | `--prefer-models '{"IMAGE":["generate_image_gpt_image_2"]}'` |
| 像素艺术草稿 | Nano Banana Pro | `--include-tools generate_image_nano_banana_pro` |
| 像素艺术成品 | Midjourney | `--prefer-models '{"IMAGE":["generate_image_midjourney"]}'` |

执行命令（以 GPT Image 2 为例）：
```bash
python3 {baseDir}/agent_skill.py chat \
  --prompt "{组装好的 Prompt}" \
  --prefer-models '{"IMAGE":["generate_image_gpt_image_2"]}' \
  --json --download
```

下载到项目目录：
```bash
python3 {baseDir}/agent_skill.py download \
  --urls "{返回的 URL}" \
  --output-dir "j:/ceshi/projects/asset-pipeline/outputs/{项目名}/icons" \
  --prefix "{项目名}_item_grid"
```

**生成完成后**，按标准汇报模板输出：
```
✅ 状态：{final_status}
📁 本地文件：{downloaded[].local_path}
🔗 图片链接：{downloaded[].url}
🧵 对话线程：{thread_id}
🎨 调用的模型：{model_name}
💰 消耗积分：{credits_info}
📋 工作流名称：道具图标 4×4 网格
🖼️ 项目画布：https://www.lovart.ai/canvas?projectId={project_id}
```

### 5. PS 手动抠图（约 30 秒）
> PS 2026 的 Color Range API 在 JSX 中不可用，必须人工操作。

1. PS 打开下载的绿底 1024×1024 图
2. **选择 → 色彩范围** → 取样左上角绿色 → 容差 **200** → 确认
3. **Ctrl+Shift+I** 反选（选中图标区域）
4. **Ctrl+J** 复制到新图层（获得透明底）
5. 点击原图层 → **隐藏**（眼睛图标点掉）

### 6. PS 脚本切图
```
文件 → 脚本 → 浏览 → 选 ps_chroma_slice.jsx
→ 选择输出目录 → 确认
→ 16 张 PNG 自动生成
```
输出文件：`item_r0_c0.png` … `item_r3_c3.png`，每张 256×256，透明底，图标居中。

### 7. 验收
让用户逐张查看：
- 满意的 → 重命名为道具名（如 `crescent_blade.png`）
- 不满意的 → 对该格单独用 1×1 Prompt 重新生成，替换

## 备选：全自动 PIL 管线（像素艺术优先）

适合像素艺术或对边缘精度要求不高的场景（PIL 自动但有绿边风险）：

```bash
# 色键抠图（绿底→透明，含 despill 去绿边）
python3 scripts/postprocess.py \
  --input grid_raw.png \
  --output grid_clean.png \
  --width 1024 --height 1024 \
  --chroma-key green

# 切片
python3 scripts/slice_grid.py \
  --input grid_clean.png \
  --output-dir outputs/{项目名}/icons \
  --prefix {项目名}_item \
  --trim
```

## 关键参数卡

| 参数 | 值 |
|------|-----|
| Lovart 画布 | 1024×1024 |
| 排列 | 4 行 × 4 列，无格子线 |
| 每格输出 | 256×256 |
| 生成背景 | 纯绿 #00FF00 |
| 最终背景 | 透明 RGBA |
| 非像素模型 | GPT Image 2 |
| 像素模型 | Nano Banana Pro（草稿）→ Midjourney（成品） |
| PS 抠图 | 色彩范围 → 容差 200 → 反选 → Ctrl+J |
| PS 切图 | `ps_chroma_slice.jsx`（位于 `projects/asset-pipeline/scripts/`） |

## 约束
- **风格锁定后一个字不改** — 后续只换 `items:` 列表，风格部分永久锁死
- **不要用中文写道具名** — 英文物质名词，禁止 `Chinese` `ancient` `traditional`
- **PS 2026 Color Range 无法脚本化** — 手动抠图是唯一稳定方案（7 版 JSX 验证过的结论）
- **PIL 管线有绿边残留风险** — 像素艺术可接受，3D/二次元建议走 PS 手动
- **生成时必须关闭浏览器 Lovart 页面** — Canvas 多端编辑会冲突
- **下载始终用绝对路径 `j:/ceshi/...`** — 不要用 `/tmp/`（Windows 不可达）
- **目录名用英文** — 中文路径会导致 Python 编码错误

> 完整流程见 [docs/workflows/道具图标-生产.md](../docs/workflows/道具图标-生产.md)
> 协作模型见 [projects/asset-pipeline/docs/01-协作模型.md](../projects/asset-pipeline/docs/01-协作模型.md)
> Prompt 模板见 [projects/asset-pipeline/templates/item-grid.md](../projects/asset-pipeline/templates/item-grid.md)
