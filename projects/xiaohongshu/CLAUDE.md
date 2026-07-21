# 小红书自媒体内容线 - CLAUDE.md

> 造化坊 · 小红书自媒体内容创作项目
> 将 works/ 工作日志中的实战问题转化为可发布的小红书图文帖子

---

## ⚠️ AI 行为规则

### 内容规范
1. **素材来源**：从 `works/` 工作日志中提炼「遇到什么问题」作为选题，不从宣言直接取材
2. **先文案后 HTML**：不要跳过文案直接写 HTML。确认选题和卡片方向后再生成
3. **CTA 固定口号**：「关注我：每天解决一个问题」（所有帖子尾页，永远不变）
4. **品牌标记**：底部 `.creation-badge`「造化坊」

### HTML 产出规范
5. **单文件产出**：每期只产出一个 `index.html`，6 张卡片合并在一个文件里
   ```
   YYYY-MM-DD-主题/
   └── index.html      ← 6 张卡片，浏览器预览 + Pixso 导入两用
   ```
   示例：`2026-07-20-如何观测AI系统/index.html`
6. **文字对齐显式声明**：所有文字元素必须显式声明 `text-align`（不依赖 CSS 继承），确保 Pixso `code_to_design` 导入后对齐正确
7. **设计继承模板**：所有帖子 HTML 继承 `_template-v2.html` 的暗色系风格

### Pixso 导入规范
8. **导入流程**：`code_to_design` 导入 index.html → 重命名 frame 为 `YYYY-MM-DD-主题`
9. **一个主题一个 frame**：直接导入合并版 index.html，不拆卡、不嵌套
10. **导入前取消选中**：`code_to_design` 前确认 Pixso 中无任何节点被选中

---

## 设计规范

### 卡片结构（6 张）

| 卡片 | 用途 | 内容规范 |
|------|------|---------|
| Card 1 | 封面/提出问题 | 大标题 + 副标题 + 痛点问题 |
| Card 2 | 拆解/痛点 | 把问题拆开，操作层 vs 决策层 |
| Card 3 | 工具/方法 | 用什么工具、什么方法 |
| Card 4 | 流程/行动 | 具体步骤，人做什么 AI 做什么 |
| Card 5 | 结果/洞察 | 产出规格、核心认知 |
| Card 6 | CTA/金句 | 行动号召 + 固定口号 |

### 视觉约束

| 属性 | 值 |
|------|-----|
| 卡片尺寸 | 1080 × 1440px |
| 背景色 | `#141414`（奇数卡）/ `#1a1a1a`（偶数卡）交替 |
| Accent 色 | 按期独立（默认 `#ff6b6b` 珊瑚红） |
| 字体 | Noto Sans SC |
| 最小字号 | 20px |
| 弱信息透明度 | 30% |
| 正文辅助透明度 | 60% |
| 右上角编号 | `.card-num`（rgba(255,255,255,0.30)，20px） |
| 底部品牌 | `.creation-badge`「造化坊」（rgba(255,255,255,0.30)，20px） |

---

## 项目结构

```
xiaohongshu/
├── CLAUDE.md                ← 本文件（AI 行为规范）
├── _template.md             ← 文案模板（markdown）
├── _template-v2.html        ← HTML 卡片模板（设计基准）
├── all-posts.html           ← 全部帖子汇总页
├── YYYY-MM-DD-主题/         ← 每期一个文件夹
│   ├── index.md             ← 文案
│   └── index.html           ← 排版（6 张卡片，浏览器预览 + Pixso 导入两用）
├── _archive/                ← 旧版迭代存档
├── Pixso截图/               ← Pixso 导出截图
└── 造化坊汇报说明书.xlsx    ← 项目汇报文档
```

> 文件夹命名：`日期-主题`（日期 YYYY-MM-DD，主题用中文）。每期只含 `index.md` + `index.html`。
> Pixso frame 命名：`YYYY-MM-DD-主题`。

---

## Pixso 导入流程速查

```
1. Pixso 点击画布空白（取消选中）⚠️ 必须！
2. code_to_design 导入 card-01.html
3. apply_design 重命名 → YYYY-MM-DD-主题-卡1
4. 重复 1-3，导入 card-02 ~ card-06
5. 检查文字对齐，必要时 apply_design 修正 textAlignHorizontal
6. 每张卡独立导出 PNG
```

> 完整流程见 [Pixso 添加帖子操作流程](../../docs/zh-CN/pixso-workflow-add-post.md)

---

## 关联资源

- 素材来源：[works/](../works/) 工作日志
- 协作流程：[小红书人+AI 协作工作流](../../docs/zh-CN/xiaohongshu-workflow.md)
- Pixso 指南：[Pixso 人机协作指南](../../docs/zh-CN/pixso-human-ai-collaboration.md)
- 运转线路图：[日常运转线路图](../../docs/zh-CN/operational-loop.md)
