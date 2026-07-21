# [2026-07-17] 小红书协作流程搭建 + post-11 产出 + Pixso 导入四问题修复

---

## 📋 问题解决日志

### 遇到了什么

小红书自媒体线需要：
1. 确立人机协作流程——素材从哪来、怎么产出、怎么分工
2. 产出第一期「works/ 实战系列」帖子
3. 修复 Pixso 导入环节的四个问题（嵌套、命名、单图、对齐）

### AI 怎么协作的

**协作流程确立：** 用户提出：素材来源从 works/ 工作日志提炼主要问题 → 人从选题库选 → AI 写文案 + HTML 排版 → 人导入 Pixso 看效果 → 通过后 AI 存 PNG。一起敲定了 6 人/10 机的分工边界。

**post-11 产出：** 用户选题「如何做小红书图文笔记？」（来源 `works/2026-07-15-first-xiaohongshu-post.md`），AI 按 v2 模板（暗黑风、1080×1440、6 张卡片）产出 6+1 个 HTML 文件。accent 色用薰衣草紫 #a78bfa，CTA 固定为「关注我：每天解决一个问题」。

**Pixso 四个问题修复：**
1. 嵌套 → 规范要求每次导入前 Pixso 点击空白取消选中
2. 命名 → 统一为 `YYYY-MM-DD-主题名称-卡N`
3. 单图 → HTML 拆为 6 个独立 card-NN.html，一卡一帧
4. 对齐 → 所有文字元素显式声明 `text-align`，不依赖 CSS 继承

**Pixso MCP 协议踩坑：** 用 Node.js 脚本直连 Pixso MCP，发现只响应 `initialize`。排查后发现 MCP SSE 握手缺少 `notifications/initialized` 通知——服务器要收到这个才注册工具。补发后 `tools/list` 返回 35 个工具，`code_to_design` 全部导入成功。

### 产出结果

- [x] [小红书协作方案 v2](../.claude/plans/dreamy-chasing-clover.md)
- [x] [post-11 HTML](../projects/xiaohongshu/post-11/) — 6 card HTML + 1 预览
- [x] [_template-v2.html 更新](../projects/xiaohongshu/_template-v2.html) — 文字对齐显式声明
- [x] [pixso-workflow-add-post.md 更新](../docs/zh-CN/pixso-workflow-add-post.md) — 新 4 步流程
- [x] [xiaohongshu-workflow.md 更新](../docs/zh-CN/xiaohongshu-workflow.md) — 6+1 产出格式
- [x] [xiaohongshu/CLAUDE.md 更新](../projects/xiaohongshu/CLAUDE.md) — 全部规范汇总
- [x] Pixso 导入脚本 [import_pixso.js](../.claude/import_pixso.js)
- [ ] 6 张卡片已导入 Pixso，待手动解嵌套 + 重命名 + 导出 PNG

### 关联项目

造化坊 · 自媒体内容线

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：小红书内容线的协作流程混乱——素材不知道从哪来、HTML 导入 Pixso 后多层嵌套、6 张卡导出成一张 PNG、文字对齐全部丢失
- 为什么这是个问题：每次导入都在浪费大量时间整理图层、手动调对齐。一条内容从选题到发布链路不顺畅
- 如果没有 AI 会怎样：需要设计师手工排版每张卡，每期 6 张 × N 期 = 大量重复劳动

### 第二幕：AI 怎么协作解决的

- 我是这样问 AI 的：「素材来源从 works/ 提炼主要问题作为选题库。人选主题，确认后你写文案→HTML排版→导入 Pixso」
- AI 给了什么方案：确立了 6 人/10 机的分工边界，产出标准化为 6+1 文件结构，每张卡独立导入、独立命名、独立导出
- 中间有什么调整/追问：Pixso 导入嵌套问题——发现 code_to_design 会导入到当前选中的 frame 内，解决方案是每次导入前取消选中
- 最终方案是什么：四个问题全部写入正式工作流文档和 CLAUDE.md，模板 HTML 逐元素显式声明 text-align
- 额外收获：Pixso MCP 要用 `notifications/initialized` 完成握手，不然工具不注册——踩坑后写成可复用的导入脚本

### 第三幕：效果展示

- 最终效果：一条完整的「选题→文案→HTML→Pixso 导入→出图」协作链路，所有规范文档化
- 演示方式：post-11 的 6 张卡片在浏览器预览
- 学到的关键点：
  1. MCP SSE 协议需要 initialized 通知才能激活工具
  2. code_to_design 会导入到选中节点内部，导入前必须取消选中
  3. 文字对齐不能靠 CSS 继承，必须每个元素显式声明

### 一句话总结（金句候选）

> 把模糊的协作变成精确的流程——选题从日志来、每卡一个文件、命名有规矩、对齐自己声明。

### 配图/视频素材清单

- [ ] Pixso 图层嵌套问题截图（修复前 vs 修复后）
- [ ] 6 张卡片浏览器预览截图
- [ ] MCP 握手调试过程录屏
- [ ] 四份更新的文档对比截图
- [ ] post-11 最终卡片导出 PNG

---

_创建日期：2026-07-17 | 标签：小红书 / Pixso / MCP / 工作流_
