# AI 游戏建筑出图心得：如何快速出「精致又梦幻」的建筑

> 📅 2026-08-11 | 🧪 来源：SLG 玩家城池皮肤 4 轮迭代 + 螃蟹汉堡店 1 轮测试
> 🎯 问题：用 AI 快速出"又精致又梦幻"的等距建筑，反复测试后发现规律

---

## 1. 目标画风拆解

| 维度 | 描述 |
|------|------|
| 渲染风格 | 3D 卡通渲染 (cel-shaded / stylized 3D) |
| 世界观 | 欧式幻想 / 梦幻童话 |
| 渲染质感 | Octane 干净通透感 |
| 造型特征 | 盲盒玩具感、大块面、表面平滑精致 |
| 反例 | 不要太写实、不要太碎、不要太脏 |

---

## 2. Prompt 推荐结构

```
画风词 + 建筑类型 + 主题元素 + 构图方式 + 材质色彩
```

**示例拆解**：

| 部分 | 内容 | 示例 |
|------|------|------|
| 画风词 | 3D 渲染风格定位 | `3D cartoon rendered, stylized 3D, clean polished rendering, toy-like proportions` |
| 建筑类型 | 是什么建筑 | `a medieval castle fortress`, `a crab-themed burger restaurant` |
| 主题元素 | 具体视觉特征 | `red banner flag, stone keep, iron gate` / `giant red crab with burger shell` |
| 构图方式 | 怎么摆放 | `45-degree isometric top-down view, standalone iconic structure, centered filling the frame` |
| 材质色彩 | 表面质感 + 配色 | `smooth refined surface, bright saturated colors, clean bold outlines` |

---

## 3. 避坑清单

### 3.1 常见翻车

| 翻车类型 | 表现 | 本轮实测案例 |
|---------|------|-------------|
| 主题太多 | 一个建筑想塞 5 个设计点 | Round 1 主城皮肤：城堡 + 护城河 + 兵营 + 马厩 + 吊桥 → 杂乱 |
| 细节碎 | 小窗户/花纹/瓦片密密麻麻 | Round 2 单体建筑仍显琐碎 |
| 材质太写实 | PBR 金属反光、粗糙石纹 | CG 手绘风格部分跑偏 |
| 背景太乱 | 周围环境过多 | Round 3 compact city with surrounding → 喧宾夺主 |
| 构图散 | 建筑不居中、留白太多 | 需要强调 `centered filling the frame` |

### 3.2 修复关键词

| 问题 | Prompt 修复词 |
|------|-------------|
| 轮廓弱 | `bold readable silhouette, graphically simplified shapes` |
| 主题杂 | `single standalone iconic structure, a single clear focal theme` |
| 结构乱 | `clear architectural hierarchy, dominant central form` |
| 材质土 | `smooth refined surface like collectible figure quality, clean polished rendering` |
| 配色花 | `restrained color palette with one dominant color and accents` |
| 背景脏 | `pure green #00FF00 solid background, no environment, no landscape` |
| 小物件多 | `minimal small clutter, focus on the main architectural form` |

---

## 4. 核心公式

> **大形体先稳住 → 主题趣味明确 → 有一定特征识别度 → 最后强调精致感**

```
1. Big Form   — 第一眼看轮廓，剪影要一眼辨识
2. Fun Theme  — 一个明确有趣的 idea（螃蟹汉堡、冰晶要塞）
3. Recognition — 特征够强，缩小到地图图标大小也能认出来
4. Polish     — 最后才是材质光滑、渲染通透的精致感
```

四步有先后，不能倒过来。如果先从细节入手（复杂纹理、花哨装饰），轮廓和主题没稳住，整张图就没灵魂。

---

## 5. 本轮验证结论

通过 4 轮迭代找到的关键模式：

| 轮次 | 尝试 | 结果 |
|------|------|------|
| R1 | 复杂的城市集群主城皮肤 | ❌ 太多元素，没有主体 |
| R2 | 单体图标建筑 | ⚠️ 单体对了，但设计感不够 |
| R3 | 紧凑城市集群 + 主堡突出 | ❌ 围合感太强，不够简洁 |
| R4 | 单体建筑 + 清晰主题 + 强剪影 | ✅ 方向正确 |
| R5 | 统一 3D 渲染 + 10 个不限题材 | ✅ 验证了公式 |

**最终锁定的单建筑 Prompt 框架**：

```
a single 3D isometric building, 45-degree top-down view,
a [theme] [building type], [key visual features],
standalone iconic structure with bold readable silhouette,
3D rendered game asset style, clean polished rendering,
[specific color notes],
centered filling the frame,
pure green #00FF00 solid background,
game asset for 2D isometric mobile SLG world map city skin
```

---

## 相关文档

- [asset-pipeline/docs/02-Prompt工程.md](../projects/asset-pipeline/docs/02-Prompt工程.md)
- [asset-pipeline/templates/building-grid.md](../projects/asset-pipeline/templates/building-grid.md)
- [asset-pipeline/docs/07-建筑工作流.md](../projects/asset-pipeline/docs/07-建筑工作流.md)
