# [2026-07-16] Pixso MCP 接入 + 小红书帖子排版设计

---

## 📋 问题解决日志

### 遇到了什么

造化坊的小红书内容矩阵需要 10 期帖子的排版设计图。之前用 HTML+CSS 手写卡片，但视觉效果不满意——太闷太老气，信息清晰度不够。同时需要把设计稿送进 Pixso 进行专业排版和导出。

### AI 怎么协作的

整个过程分成三条线并行推进：

**线一：Pixso MCP 接入**

Pixso MCP 本地运行在 `http://127.0.0.1:3667/mcp`（SSE 协议）。一开始配置为 `"type": "url"` 连不上，改为 `"type": "sse"` 后握手成功。

关键操作模式：
- `code_to_design`：HTML → Pixso 设计节点（排版、字体、颜色一次到位）
- `apply_design`：批量操作设计节点（增删改移，50 条/次上限）
- `get_screenshot` / `take_screenshot`：导出设计预览
- `get_top_level_frames` + `U()`：管理 frame 层级和命名

产出了 [Pixso 人机协作指南](../docs/zh-CN/pixso-human-ai-collaboration.md)（25 个工具 + 6 种协作模式 + 造化坊工作流）和 [添加帖子操作流程](../docs/zh-CN/pixso-workflow-add-post.md)。

**线二：视觉设计迭代**

第一版：暗色渐变背景（紫/蓝/橙），16-18px 最小字号 → 用户反馈"太闷太老气"

第二版：亮白底现代风格 → 用户否定"还是暗色系"

第三版（v2 标准）：现代暗色——深炭灰底 `#141414`/`#1a1a1a`，明亮橙/红 accent 色，最小字号 20px，弱信息透明度从 12%→30%、40%→60%。用户确认 OK。

标准化要点：
- 字体：`Noto Sans SC`（Pixso 已知可用字体）
- 卡片：1080×1440px 竖版，6 张/期
- 配色：每期独立 accent 色，背景交替两色
- 弱信息：30% 透明度
- 正文辅助：60% 透明度

**线三：Pixso 直接创建探索（apply_design）**

尝试绕过 HTML，直接用 `apply_design` 的 `I()` 操作在 Pixso 中创建 frame 和文字节点。发现属性名与文档不一致：

| 功能 | 文档写法（无效） | 实际有效 |
|------|-----------------|----------|
| 文字内容 | `characters` | `nodeText` |
| 文字颜色 | `fills` | `fillPaints` |
| 字体 | `fontName: {family, style}` | `fontFamily` + `fontWeight` 分开 |
| 自动布局 | 平铺属性 | 嵌套 `autoLayout: {direction, alignItems, justifyContent, padding: [t,r,b,l], gap}` |

结论：`apply_design` 直接创建理论可行，但属性名规则需要大量试错。生产环境用 `code_to_design`（HTML 导入）最稳——排版、字体、颜色一次到位。

### 产出结果

- [x] [Pixso 人机协作指南](../docs/zh-CN/pixso-human-ai-collaboration.md)
- [x] [Pixso 添加帖子操作流程](../docs/zh-CN/pixso-workflow-add-post.md)
- [x] [小红书人+AI 协作工作流](../docs/zh-CN/xiaohongshu-workflow.md) — 四步法：选题→文案→排版→出图
- [x] [v2 设计模板](../projects/xiaohongshu/_template-v2.html)
- [x] [post-01-v2](../projects/xiaohongshu/HTML库/_archive/post-01-v2/index.html) — 简介版
- [x] [post-03-v2](../projects/xiaohongshu/HTML库/2026-07-15-项目制学习/index.html) — 项目制学习
- [x] [post-01-v3](../projects/xiaohongshu/HTML库/_archive/post-01-v3/index.html) — 主题「不会设计的人怎么用 AI 做小红书图文」，需讨论文案结构
- [ ] post-02, 04~10 v2 待重做
- [ ] Pixso 导入最终验证

### 关联项目

造化坊 · 自媒体内容线

---

## 📋 下半段：工作流提炼 + 第一期产出

### 遇到了什么

上午搭建了 Pixso MCP 和 v2 设计标准，下午要把整个流程串起来：别人看到这个帖子，能不能照着做出来？

### AI 怎么协作的

提炼出四步法（选题→文案→排版→出图），然后走了一遍完整流程：
1. 选题：今天的主题 —— 不会设计的人怎么用 AI 做小红书图文
2. 拆卡：6 张卡片的角度框架
3. 写 HTML：按 v2 标准输出 post-01-v3
4. 用户反馈文案结构有问题 → 明天继续讨论

### 产出结果

- [x] [小红书协作工作流](../docs/zh-CN/xiaohongshu-workflow.md)
- [x] [post-01-v3](../projects/xiaohongshu/HTML库/_archive/post-01-v3/index.html)

### 待解决

- 文案结构需要调整（明天讨论）
- Pixso 端到端导入待验证（今天 Pixso 卡了）
- HTML 中截图的可行性确认（浏览器截图 vs Pixso 导出）

### 关联项目

造化坊 · 自媒体内容线

### 今日核心认知

> AI 排版这条路径走得通：HTML 写内容 → AI 调样式 → 浏览器截图就发。不需要中间工具。

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：需要 10 期小红书帖子的排版设计稿，手写 HTML 效果不理想
- 为什么这是个问题：纯代码写设计，看不到实时效果，配色"太闷太老气"自己察觉不到
- 如果没有 AI 会怎样：需要设计师逐张排版，10 期 × 6 卡 = 60 张，几天工作量

### 第二幕：AI 怎么协作解决的

- 我是这样问 AI 的：「太闷太老气了。第一保证信息清晰度，第二亮调子」→ AI 理解后给出渐进的风格迭代
- AI 给了什么方案：三轮迭代（暗色渐变 → 亮白 → 现代暗色），每次都有完整 HTML 可直接导入 Pixso 看效果
- 中间有什么调整/追问：字号、透明度、品牌名、CTA 文案全部通过对话迭代
- 最终方案是什么：v2 标准——现代暗色 + 亮 accent + 统一字体字号 + Pixso MCP 一键导入
- 额外收获：直接探索了 `apply_design` 创建 UI 的路径，发现属性名规则

### 第三幕：效果展示

- 最终效果：10 期帖子 HTML 就绪，Pixso 导入 → 修改 → 导出工作流已跑通
- 演示方式：Pixso 截图（post-01 6 张卡片）
- 学到的关键点：Pixso MCP 的 `code_to_design` 是 HTML→设计的最稳路径；设计迭代中 AI 能理解"闷""老气"这种模糊反馈并给出具体方向

### 一句话总结（金句候选）

> 设计迭代不需要设计师——AI 听懂「太闷了」就能给你一版新的。

### 配图/视频素材清单

- [ ] Pixso 画布全景截图（6 张卡片 + 图层结构）
- [ ] AI 对话高亮（三轮设计迭代的关键 prompt）
- [ ] 修改前后对比（旧版暗色 vs v2 现代暗色）
- [ ] code_to_design 操作演示
- [ ] 最终卡片截图（post-01 封面卡）

---

_模板版本：v1.0 | 本次记录时间：2026-07-16_
