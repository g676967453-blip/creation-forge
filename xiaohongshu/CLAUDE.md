# 小红书自媒体内容线 - CLAUDE.md

> 造化坊 · 小红书自媒体内容创作项目
> 将造化仪表盘工作日志（`../造化仪表盘/works/`）中的实战问题转化为可发布的小红书图文帖子

---

## ⚠️ AI 行为规则

### 内容规范
1. **素材来源**：从 `造化仪表盘/works/` 工作日志中提炼「遇到什么问题」作为选题，不从宣言直接取材
2. **先文案后 HTML**：不要跳过文案直接写 HTML。确认选题和卡片方向后再生成
3. **CTA 固定口号**：「关注我：每天解决一个问题」（所有帖子尾页，永远不变）
4. **品牌标记**：底部 `.creation-badge`「造化坊」

### HTML 产出规范
5. **单文件产出 + 自动截图**：每期只产出一个 `index.html`，6 张卡片合并在一个文件里。产出后用 Puppeteer 脚本逐卡截图，输出 6 张独立 PNG
   ```
   YYYY-MM-DD-主题/
   ├── index.md              ← 文案
   ├── index.html            ← 6 张卡片，1080×1440px
   ├── 卡片1-封面.png         ← Card 1
   ├── 卡片2-根因.png         ← Card 2
   ├── 卡片3-解法.png         ← Card 3
   ├── 卡片4-流程.png         ← Card 4
   ├── 卡片5-洞察.png         ← Card 5
   └── 卡片6-CTA.png          ← Card 6
   ```
   示例：`2026-07-30-如何检查AI写的策划案/`
6. **文字对齐显式声明**：所有文字元素必须显式声明 `text-align`（不依赖 CSS 继承）
7. **设计继承**：从最新帖子拷贝样式，保持暗色系风格一致

### 截图导出规范
8. **截图工具**：使用 `puppeteer-core` + 系统 Chrome 浏览器，脚本模板见 `_screenshot.mjs`
9. **执行方式**：`node _screenshot.mjs`（在帖子目录下），修改脚本中的 `CARD_NAMES` 数组适配当期卡片命名
10. **依赖**：项目根目录已安装 `puppeteer-core`，无需重复安装

### Pixso 导入（可选）
11. **导入流程**：如需在 Pixso 编辑排版，`code_to_design` 导入 index.html → 重命名 frame 为 `YYYY-MM-DD-主题`
12. **一个主题一个 frame**：直接导入合并版 index.html，不拆卡、不嵌套
13. **导入前取消选中**：`code_to_design` 前确认 Pixso 中无任何节点被选中

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
├── _template.md             ← 选题草稿模板
├── _screenshot.mjs          ← 截图脚本模板（Puppeteer 逐卡截图）
├── YYYY-MM-DD-主题/         ← 每期一个文件夹
│   ├── index.md             ← 文案
│   ├── index.html           ← 排版（6 张卡片，1080×1440px）
│   └── 卡片N-描述.png       ← 逐卡截图（6 张，Puppeteer 自动生成）
└── 造化坊汇报说明书.xlsx    ← 项目汇报文档
```

> 文件夹命名：`日期-主题`（日期 YYYY-MM-DD，主题用中文）。

---

## 截图导出流程速查

```
1. node _screenshot.mjs（在帖子目录下执行）
2. 检查 6 张 PNG 是否正常（文字清晰、无裁切）
3. 如需调整，改 index.html 后重新执行步骤 1
```

## Pixso 导入流程速查（可选）

```
1. Pixso 点击画布空白（取消选中）⚠️ 必须！
2. code_to_design 导入 index.html
3. apply_design 重命名 → YYYY-MM-DD-主题
4. 检查文字对齐，必要时修正
5. 导出 PNG
```

> 详细流程见 [Pixso-导入操作](../docs/workflows/Pixso-导入操作.md)

---

## 关联资源

- 素材来源：[工作日志](../造化仪表盘/works/) 工作日志
- 工作流文档：[docs/workflows/小红书-制作帖子.md](../docs/workflows/小红书-制作帖子.md) · SKILL：`/new-post`
- 截图模板：[`_screenshot.mjs`](_screenshot.mjs)（Puppeteer 逐卡截图）
- Pixso 导入：[docs/workflows/Pixso-导入操作.md](../docs/workflows/Pixso-导入操作.md)（可选）
- Pixso 指南：[Pixso 人机协作指南](../docs/tool-guides/pixso-human-ai-collaboration.md)
- 运转线路图：[日常运转线路图](../docs/zh-CN/operational-loop.md)
