# [2026-07-27] 小红书第15期：GitHub — AI能力应用商店

> 标签：小红书/内容创作/GitHub/开源
> 关联：[[2026-07-21-workflow-system]] [[2026-07-24-three-layer-system]]

## 一句话总结

制作第15期小红书帖子，主题「GitHub：从代码档案馆到 AI 能力应用商店」，强调站在巨人肩膀上看世界——用开源社区的能力模块撬动个人生产力。

## 做了什么

### 选题
- 用户指定主题：GitHub + 站在巨人肩膀上看世界
- 素材来源：`docs/tool-guides/game-dev-skills.md`（48个游戏开发AI技能）+ Godot MCP Native 插件（155个工具）
- 两个典型 GitHub 开源仓库：`gamedev-skills/awesome-gamedev-agent-skills` + `yurineko73/godot-mcp-native`

### 文案
- 出两版方案（A 理性拆解 / B 观念刷新），用户选定方案 B
- 用户反馈：去掉"抄不是偷"概念
- 6 张卡片：封面 → 真实经历（Godot版本错乱）→ 两个GitHub工具 → 四步新流程 → GitHub新定义 → CTA

### HTML
- Accent 色：GitHub 绿 `#3fb950`，首次脱离默认珊瑚红
- 产出 `projects/xiaohongshu/2026-07-27-GitHub-AI能力应用商店/index.html`
- 修复：Card 6 关键词与正文重叠 → `.search-hint` 加 `white-space: nowrap` + `.search-line` 分行包裹

### Pixso 导入
- 遇到编码问题：curl 命令行方式传输中文导致乱码（frame 名 `AI����Ӧ���̵�`）
- 根因：Windows Git Bash 中 curl 的 `-d` 参数无法正确传递 UTF-8 中文
- 解决：改用 Python `urllib.request` + JSON 文件方式，确保 UTF-8 编码正确
- 流程：删除旧帧 → 重新导入 → 重命名 → 完成
- HTML 中的 emoji 问题：`⬇️` 在 Pixso 中不支持，不影响布局

## 数据一览

| 指标 | 值 |
|------|-----|
| 本期帖子 | 第15期 |
| 卡片数 | 6 |
| Accent 色 | #3fb950（GitHub绿） |
| HTML 大小 | 12,478 字符 |
| 素材仓库 | 2 个（skills + MCP） |

## 核心认知

**Pixso MCP 中文编码踩坑**：不要用 curl 命令行 `-d` 传中文 JSON，用 Python 文件方式（`json.dumps` + `urllib.request`）可以保证 UTF-8 编码一致性。这可能是 Windows Git Bash 特有的问题。

## 视频草案

### 三幕结构

**第一幕：**
- 做第15期小红书帖子，涉及 GitHub 开源 + AI 能力
- 遇到了 Pixso MCP 导入中文乱码的坑

**第二幕：**
- 排查：终端编码 → Python 文件编码 → MCP 传输编码，逐层定位
- 根因是 curl 命令行传中文 JSON 在 Windows 下不可靠
- 改用 Python 文件方式解决

**第三幕：**
- 帖子完成：6 张卡片，GitHub 绿 accent，暗色系
- 临时脚本已清理，流程干净

### B-roll 素材
- Pixso frame 列表截图（乱码版 vs 修复版对比）
- Card 6 修复前后对比
- 帖子 6 卡全览
