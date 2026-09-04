# 02 — Prompt 工程方法

> **将人类视觉需求转化为高质量 Lovart Prompt 的系统方法**

---

## 核心原则：人类描述 → 结构化 Prompt

Claude 的核心价值不是"会写英文"，而是**将人类松散的自然语言描述，转化为符合 AI 模型最佳实践的 Prompt**。

```
人类说：                         Claude 转化为：
"一个酷炫的剑客"          →      "a stern male sword cultivator in flowing cyan robes,
                                 silver hair in a Daoist topknot, piercing cyan-glowing eyes,
                                 jade-green flying sword orbiting beside shoulder"
```

---

## Prompt 结构公式

一个高质量的 Lovart Prompt 包含以下层级：

```
[风格声明] [主体描述] [构图] [色彩] [氛围/背景] [技术约束]
```

### 各层级说明

| 层级 | 作用 | 示例 |
|------|------|------|
| **风格声明** | 定义视觉语言和媒介 | `pixel art character portrait for a Chinese xianxia game` |
| **主体描述** | 画面核心内容（人物/物体） | `a stern male sword cultivator, silver hair, flowing cyan robes, glowing flying sword` |
| **构图** | 取景范围、视角、朝向 | `half-body composition, facing slightly right, right hand forming a sword gesture` |
| **色彩** | 色调约束（可精确到 HEX） | `jade green (#4ecca3) sword aura, ink-black (#0a0a14) robe lining` |
| **氛围/背景** | 整体情绪和环境 | `dark night-sky background (#1a1a2e), misty mountain peaks, ink-wash style` |
| **技术约束** | 技术要求（重复以保证一致性） | `16-bit RPG pixel art style, limited color palette, clean pixel edges, no anti-aliasing` |

---

## 变量化模板设计

变量化是让 Prompt 模板可复用的关键。使用 `{VARIABLE_NAME}` 占位符：

```text
pixel art {asset_type} for a Chinese xianxia game,
{subject_description},
{composition},
{color_scheme},
{atmosphere},
16-bit RPG pixel art style, limited color palette, clean pixel edges,
no anti-aliasing, dark mystical atmosphere, game asset
```

### 变量设计原则

1. **粒度适中** — 一个变量表达一个完整概念（如 `{subject_description}` 包含外貌、服装、姿态），不要过度拆分
2. **提供填写指南** — 每个变量配一列"填写什么 + 示例"
3. **强制部分固定** — 技术约束和风格关键词不放入变量，硬编码在模板中

---

## 色彩约束策略

### 策略 1：调色板约束（单资产）

在 Prompt 中直接写 HEX 值：

```text
jade green (#4ecca3) sword aura, ink-black (#0a0a14) shadows
```

效果：AI 会偏向使用指定的颜色。

### 策略 2：色彩互斥矩阵（多角色/多资产）

当生成一系列相关资产时（如 6 个峰主），为每个资产定义：

- **主色**：该资产的专属强调色
- **禁止色**：其他资产的主色，不得出现

```
剑峰主 → 主色 #4ecca3（玉石青），禁止 #9030c0（魂火紫）、#f0c040（佛门金）
佛峰主 → 主色 #f0c040（佛门金），禁止 #4080f0（雷电蓝）、#9030c0（魂火紫）
```

这防止 AI 在生成不同角色时颜色互相渗透。

### 策略 3：功能色固定（游戏 UI 通用）

同一游戏中，功能性颜色始终不变：

```
伤害数字 = #ff4444（红）
治疗数字 = #44ff44（绿）
灵气 = #4ecca3（玉石青）
```

---

## 强制关键词策略

每个模板都有一组**不可修改的强制关键词**，保证同一系列的所有输出属于同一视觉宇宙：

```text
# 像素艺术游戏资产（通用）
pixel art, limited color palette, clean pixel edges, no anti-aliasing

# 中国仙侠（主题）
Chinese xianxia, ink-wash influence, dark mystical atmosphere

# 游戏资产（用途）
game asset / game key visual / character illustration
```

### 关键词选择原则

1. 不要太多（5-8 个核心词足够）
2. 不要互相矛盾（"photo-realistic" + "pixel art" = 冲突）
3. 用 AI 模型熟悉的英文术语（"xianxia" 比 "Chinese cultivation fantasy" 更精准）

---

## 常见 Prompt 问题的诊断与修复

| 症状 | 可能原因 | 修复方法 |
|------|---------|---------|
| 生成的不是像素艺术 | 缺 `pixel art` + `no anti-aliasing` 关键词 | 在风格声明最前面加 `pixel art` |
| 过于写实/3D 感 | 缺 `no anti-aliasing` + `clean pixel edges` | 加强技术约束关键词 |
| 颜色不对 | 颜色描述不够精确 | 加 HEX 码，或加 `limited color palette with only X, Y, Z tones` |
| 角色服装太西方 | 缺文化关键词 | 加 `Chinese xianxia, Daoist robes, hanfu influence` |
| 背景太亮 | 缺氛围约束 | 加 `dark background (#1a1a2e), night atmosphere` |
| 角色看起来模糊 | 生成分辨率太低 / 后处理用了错误缩放算法 | 确认 1024x1024 输出 + NEAREST 缩放 |
| 多角色风格不统一 | 各 Prompt 缺少共享关键词 | 确保所有 Prompt 包含同一组强制关键词 |

---

## 模型选择对 Prompt 的影响

| 模型 | Prompt 特点 | 建议 |
|------|-----------|------|
| **Midjourney** | 对自然语言理解好，能处理复杂描述 | Prompt 可以更详细，用完整句子 |
| **Nano Banana Pro** | 对简洁指令响应更好 | Prompt 精简，多用逗号分隔的关键词 |
| **DALL-E (GPT Image)** | 对具体物体描述敏感 | 加更多主体细节（材质、纹理、光照） |

实际使用时，先用 Nano Banana Pro 快速验证 Prompt 是否表达正确，再用 Midjourney 出成品。

---

## 相关文档

- [01-协作模型.md](01-协作模型.md) — 三角协作循环
- [03-工作流阶段.md](03-工作流阶段.md) — 草稿→成品→集成
- [07-建筑工作流.md](07-建筑工作流.md) — 建筑生产工作流
- `templates/` — 各资产类型的具体 Prompt 模板
- [../../造化仪表盘/works/2026-08-11-[claude]-ai-building-prompt-insights.md](../../造化仪表盘/works/2026-08-11-[claude]-ai-building-prompt-insights.md) — 建筑出图实战心得

---

## 附：单体建筑 Prompt 实战公式（2026-08-11 更新）

> 来自 SLG 城池皮肤 4 轮迭代 + 10 题材批量验证的实战总结。

### 单体建筑 Prompt 结构

```
画风词 + 建筑类型 + 主题元素 + 构图方式 + 材质色彩
```

### 四步优先级：大形体 → 趣味主题 → 特征识别 → 精致感

```
1. Big Form   — 轮廓强、一眼辨识（bold readable silhouette）
2. Fun Theme  — 一个明确的趣味 idea（螃蟹汉堡、冰晶要塞）
3. Recognition — 缩小到地图图标也能认出来
4. Polish     — 最后才是材质光滑、渲染通透
```

**核心原则**：先从大形体稳住，再加精致感。不能反过来——如果先从细节入手，轮廓和主题没稳住，整张图就没灵魂。

### 常见翻车与修复关键词

| 翻车 | 表现 | Prompt 修复词 |
|------|------|-------------|
| 主题太多 | 一个建筑塞 5 个设计点 | `single standalone iconic structure, a single clear focal theme` |
| 细节碎 | 小窗户/花纹密密麻麻 | `minimal small clutter, focus on the main architectural form` |
| 材质太写实 | PBR 金属反光、粗糙石纹 | `smooth refined surface like collectible figure quality, clean polished rendering` |
| 背景太乱 | 周围环境喧宾夺主 | `pure green #00FF00 solid background, no environment, no landscape` |
| 构图散 | 不居中、留白大 | `centered filling the frame, bold readable silhouette` |
| 配色花 | 颜色无主次 | `restrained color palette with one dominant color and accents` |
| 轮廓弱 | 缩到小尺寸认不出 | `graphically simplified shapes, clear bold outlines, iconic silhouette` |
