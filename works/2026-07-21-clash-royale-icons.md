# [2026-07-21] 皇室战争风格道具图标生成

---

## 📋 问题解决日志

### 遇到了什么

三国题材道具图标，要对标《皇室战争》的 Supercell 3D cel-shaded 风格。需要在不改变风格的前提下，把内容换成三国世界的道具。

### AI 怎么协作的

**风格探索（4 次迭代）**

| # | 描述 | 结果 |
|---|------|------|
| 1 | 皮克斯动画渲染 | ❌ 偏国风手绘 |
| 2 | 对标《王国觉醒》Rise of Kingdoms | ❌ 太写实，材质太真 |
| 3 | 卡通比例 + 风格化纹理 | ⚠️ 方向对了但不够 |
| 4 | 对标《皇室战争》Clash Royale | ✅ 风格命中 |

**关键发现**：

第 4 次成功的 Prompt：
```
Clash Royale game art style, Supercell 3D cel-shaded rendering,
bright saturated colors, clean bold outlines, playful cartoon proportions
```

相比第 1 次的 `Pixar 3D animated movie rendering style, CGI cartoon, subsurface scattering`——Pixar 关键词引导 AI 向"电影级写实渲染"走，Clash Royale 关键词引导 AI 向"游戏图标 cel-shaded"走。**风格关键词的颗粒度决定了输出精度。**

**风格固定 + 内容替换的技巧**：

第五次要换成三国道具时，风格 Prompt 一个字不改，只把道具名从英文通用描述换掉——并且刻意去掉 `Chinese` `ancient` `history` 等文化标签：

```
❌ Three Kingdoms Chinese history theme
❌ ancient jade seal
❌ traditional bronze vessel

✅ crescent blade guan dao
✅ jade imperial seal  
✅ bronze ritual cup
```

原因：`Chinese` `ancient` `traditional` 会触发模型的"国风/水墨"偏向，污染风格。用中性的物质名词描述，模型只改道具内容不改画风。

### 产出结果

| 产出 | 路径 |
|------|------|
| 皇室战争风格 + 三国道具 | `outputs/demo-clash-royale/clash_3kingdoms_01.png` |
| 16 道具：青龙刀、蛇矛、双剑、方天戟、羽扇、玉玺、赤兔印、阵图、青铜爵、虎符、竹简、七星剑、草船、令旗、连弩、木牛 | — |

### 关联项目

造化坊 · 基础设施（asset-pipeline）

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：想让 AI 画特定游戏风格的道具图标（皇室战争风），但内容是中国三国题材
- 为什么这是个问题：一说"三国""中国风"，AI 就往国风水墨走；反过来风格对了，道具又不对
- 如果没有 AI 会怎样：找外包画师，16 个图标报价 2000-5000 元，排期 1-2 周

### 第二幕：AI 怎么协作解决的

- 4 次迭代才找到正确的风格关键词——从 Pixar 到 ROK 到 Clash Royale
- 发现"风格固定、内容替换"的关键技巧：**去掉所有文化标签**
- 不说"三国 Chinese ancient"，只说"crescent blade, feather fan, bronze cup"
- 风格 Prompt 一个字不改，只换道具名

### 第三幕：效果展示

- 最终效果：皇室战争风格的游戏图标，内容是三国道具
- 学到的关键点：
  1. AI 的风格理解 = 关键词的联想网络，不是你脑中的"感觉"
  2. "Chinese/ancient" 触发国风偏差，去掉它反而更精准
  3. 风格 Prompt 模板化：定好风格后锁死，后续只换道具名

### 一句话总结（金句候选）

> 要让 AI 画三国但不画成国风，就别提"中国"两个字。

---

_创建日期：2026-07-21 | 标签：AI生图 / 风格控制 / 皇室战争 / Prompt技巧_
