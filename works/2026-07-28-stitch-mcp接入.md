# 2026-07-28: Google Stitch MCP 接入 + 器灵选择界面生成 + Godot 落地方案

> 标签: `工具接入` `AI设计` `UI工作流` `Stitch` `Godot`

---

## 做了什么

### 1. Stitch MCP Server 接入

- 在 [stitch.withgoogle.com](https://stitch.withgoogle.com) 获取 API Key
- 安装并配置 `mcp-stitch` (npm 包):
  ```bash
  claude mcp add stitch --env GOOGLE_API_KEY=xxx -- npx -y mcp-stitch
  ```
- 17 个工具可用: `stitch_create_project`, `stitch_generate_screen_from_text`, `stitch_edit_screens` 等

### 2. 网络问题解决

Google API (`stitch.googleapis.com`) 在国内被墙。踩坑过程:

| 尝试 | 结果 |
|------|------|
| HTTP 代理 `127.0.0.1:7897` → Node.js fetch | ❌ 不走代理 |
| SOCKS5 代理 | ❌ Node.js 不支持 |
| `NODE_OPTIONS=--require proxy-setup.cjs` | ❌ spawn EINVAL |
| **Clash Verge TUN 模式** | ✅ 透明劫持，所有程序走代理 |

**结论: 必须开启 Clash TUN 模式才能用 Stitch。**

### 3. 器灵选择界面生成

- 创建 Stitch 项目 `projects/2302999060499189666`
- 两次生成，从通用竖屏优化为匹配游戏实际的横屏设计
- 最终生成: `C:\项目资料\stitch_spirit_selection_interface\` (code.html + DESIGN.md + screen.png)
- 快捷命令: `npm run stitch`

### 4. Stitch → Godot 落地方案设计

三路并行探查:
- GAME-002 Godot UI 架构 (全部代码手写，无共享 Theme)
- Godot MCP 工具 (12+ 场景/节点操作工具)
- Stitch 输出 CSS → Godot 完整映射表 (14 项)

完整计划: `.claude/plans/claude-code-majestic-blossom.md`

---

## 关键决策

| 决策 | 理由 |
|------|------|
| 用 TUN 模式而非代理 | Node.js fetch (undici) 不走系统代理，TUN 是唯一可靠方案 |
| 三层流水线 (Theme→tscn→特效) | 颜色/字体可全自动，结构需 MCP 半自动，特效需手动 |
| 先做 Theme 生成器 | 不依赖 Godot 编辑器，产出立即可验证 |

---

## 下一步

1. 完成 `tools/stitch-to-godot-theme.ts` (DESIGN.md → .tres Theme)
2. 在新对话中测试 Stitch MCP 直接调用 (工具加载后无需终端)
3. 器灵选择界面在 Godot 中落地

---

## 三幕结构 (视频草案)

### 第一幕: 问题
- Google Stitch 是什么？AI 设计 UI 的工具
- 但 Google API 在国内被墙，怎么破？
- Node.js 不走代理的坑

### 第二幕: 解决
- TUN 模式终极方案
- 一条命令生成 UI
- 从竖屏→横屏，从通用→匹配游戏实际设计

### 第三幕: 升华
- Stitch 产出到 Godot 引擎的落地路径
- CSS→Godot 映射思维
- 设计→代码的完整闭环

---

## 素材清单

- [ ] Stitch 生成截图 (screen.png)
- [ ] Clash Verge TUN 模式配置截图
- [ ] 生成命令执行录屏
- [ ] CSS→Godot 映射表 (来自计划文档)
