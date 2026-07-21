# Pixso：AI 时代的设计协作平台 —— 人机协作指南

> 本文档介绍 Pixso 产品定位、核心能力，以及人与 AI 如何在 Pixso 上进行高效协作。

---

## 一、Pixso 是什么

**Pixso** 是万兴科技孵化的**新一代一体化产品设计协作平台**，被业界称为「中国版 Figma」。它打通了从**白板创意 → UI/UX 设计 → 高保真原型 → 开发交付**的全流程，为产品经理、设计师、开发者提供统一的一站式协作空间。

**一句话定位**：一站式 UI/UX 设计 + 原型 + 交付平台，内置 AI 能力和 MCP 协议，支持从「一句话描述」到「生产就绪代码」的完整链路。

### 关键数据

| 维度 | 说明 |
|------|------|
| 开发商 | 万兴科技（Wondershare）内部孵化 |
| 收费模式 | 免费增值（个人用户免费） |
| 平台支持 | Web 端 + 桌面客户端（Windows / macOS） |
| 最新版本 | V3.0.1（2026年7月） |
| 文件格式 | `.pixso` |
| 可导入格式 | Figma(.fig)、Sketch、Axure(.zip)、Adobe XD |
| 本地 MCP 端口 | `http://127.0.0.1:3667/mcp` |

---

## 二、核心能力地图

### 2.1 设计能力

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  在线白板    │ →  │  UI/UX 设计   │ →  │  高保真原型  │
│  (创意发散)  │    │  (视觉实现)   │    │  (交互验证)  │
└─────────────┘    └──────────────┘    └─────────────┘
                                                ↓
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  开发交付    │ ←  │  设计系统管理  │ ←  │  团队协作   │
│  (代码/标注) │    │  (Token/组件) │    │  (实时多人)  │
└─────────────┘    └──────────────┘    └─────────────┘
```

### 2.2 AI 能力

| 能力 | 说明 | 触发方式 |
|------|------|----------|
| **AI 文生设计** | 用自然语言描述，自动生成带图层的可编辑 UI 设计稿 | 输入提示词（如「做一个音乐播放器主页」） |
| **AI 以图生图** | 上传参考图，生成类似风格的设计 | 上传截图/参考图 |
| **AI 智能编辑** | 链接抓取元素，提升视觉还原度 | 粘贴外部链接 |
| **AI 自动修复** | 自动检测文字截断等 UI 问题并修复 | 自动触发 |
| **D2C 设计转代码** | 设计稿一键导出为 React/Vue/HTML/Flutter/ArkUI 代码 | 选中节点 → 导出 |
| **C2D 代码转设计** | HTML/CSS 代码转换为 Pixso 设计节点 | MCP `code_to_design` |

### 2.3 协作能力

- **实时多人编辑**：百人同时在线，所见即所得
- **视觉化评论**：支持图片、表情、草图批注
- **组件库共享**：团队发布组件库，跨项目复用
- **Design Tokens**：统一管理颜色、字体、间距变量，一处修改全局生效
- **版本历史**：自动保存，可回溯任意版本
- **私有化部署**：支持本地服务器部署，满足政企合规需求

---

## 三、Pixso MCP 深度解析

### 3.1 什么是 MCP

MCP（Model Context Protocol）是一种开放协议，让 AI 大模型能够**直接读写外部工具的数据和功能**。Pixso 是首批原生实现 MCP 的设计平台之一。

简单理解：**MCP 是 AI 的「手」**——没有 MCP，AI 只能「看」截图猜测设计参数；有了 MCP，AI 能精确读取设计结构、修改节点、导出代码。

### 3.2 Pixso MCP 工具一览

Pixso MCP 提供 **25 个工具**，分为五大类：

#### 🔍 读取类（Read）—— AI 理解设计

| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `fetch_context` | 获取当前画布状态、选中节点、基本信息 | 对话开始时了解「现在 Pixso 里有什么」 |
| `query_nodes` | 按模式/ID 搜索设计节点 | 查找特定组件、页面、元素 |
| `get_screenshot` | 获取单个节点的 PNG 预览图 | 查看设计视觉参考 |
| `take_screenshot` | 批量截图（最多3个节点） | 对比多个设计方案 |
| `get_node_dsl` | 获取节点的结构化 DSL 描述 | 需要精确的结构化设计数据 |
| `get_top_level_frames` | 获取页面/顶层 Frame 列表 | 了解文档结构 |
| `get_variants` | 获取组件的变体列表 | 查看组件的不同状态（hover/active等） |
| `check_layout` | 检查布局结构 | 审查布局问题 |

#### ✍️ 写入/操作类（Write）—— AI 创建设计

| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `apply_design` | 批量执行设计操作（插入/复制/替换/移动/删除） | 创建或修改设计元素 |
| `code_to_design` | 🔥 将 HTML 代码转为 Pixso 设计节点 | 用代码驱动设计生成 |
| `create_instance` | 基于组件创建实例 | 复用组件库中的组件 |

#### 🎨 样式/变量类（Styles & Variables）

| 工具 | 功能 |
|------|------|
| `read_styles` / `write_styles` | 读写共享样式（颜色/文字/效果） |
| `read_variables` / `write_variables` | 读写 Design Tokens 变量 |
| `get_local_styles` / `get_remote_styles` | 获取本地/远程样式列表 |
| `set_fill_style` / `set_stroke_style` / `set_text_style` / `set_grid_style` | 为节点设置样式 |
| `set_bound_variables` | 将变量绑定到节点属性 |

#### 🧩 组件/资源类（Components & Assets）

| 工具 | 功能 |
|------|------|
| `read_components` | 读取所有可复用组件和组件集 |
| `get_all_components` | 获取全部组件列表 |
| `get_export_image` | 导出设计节点为图片（PNG/JPEG/SVG/PDF等） |
| `get_variable_sets` / `get_variables` | 获取变量集和变量详情 |

#### 🔧 辅助/优化类（Utility）

| 工具 | 功能 |
|------|------|
| `design_to_code` | 🔥 将设计节点生成 UI 代码（支持 react/vue/html/flutter/arkui） |
| `refine_generated_code` | 优化生成的代码（响应式/CSS变量/Tailwind/DRY/项目规范） |
| `query_all_unique_props` | 审计设计中的不一致属性 |
| `replace_props` | 批量替换设计属性 |
| `load_guidelines` | 加载设计规范指南 |
| `get_style_guide` / `list_style_tags` | 获取风格指南参考 |
| `read_components` | 读取可用组件库 |

### 3.3 关键数据流

```
                ┌──────────┐
                │  Pixso   │
                │  桌面端  │
                └────┬─────┘
                     │ MCP Server (port 3667)
                     │ SSE 协议
                     ↓
          ┌──────────────────┐
          │   AI (Claude)     │
          │                   │
          │  读取设计结构     │
          │  创建/修改节点    │
          │  导出设计为代码   │
          │  导入代码为设计   │
          └──────────────────┘
```

**重要限制**：
- MCP 仅在 **Pixso 桌面客户端** 中可用，Web 端不支持
- 需要保持 Pixso 客户端运行，且目标设计文件处于当前激活标签页
- 只有创作者/开发者权限可调用全部工具；仅查看权限只能使用读取类工具

---

## 四、人与 AI 协作模式

在 Pixso 上，人与 AI 的协作可以分为**六种核心模式**：

### 模式一：AI 辅助设计探索（从模糊到清晰）

```
人：我有一个想法，但不知道怎么画
    ↓
AI：用自然语言生成多个设计方向供选择
    ↓
人：选择一个方向，提出修改意见
    ↓
AI：调整设计，生成变体
    ↓
人：确定方案，进入细化
```

**适用场景**：项目初期，需求不明确，需要快速探索视觉方向。

**使用工具**：`query_nodes`（了解现有设计）→ `apply_design`（创建新方案）→ `get_screenshot`（预览确认）

### 模式二：代码驱动设计（从 HTML 到设计稿）

```
人：用代码写好内容和布局（HTML/CSS）
    ↓
AI：调用 code_to_design 导入 Pixso
    ↓
人：在 Pixso 中查看、微调
    ↓
AI：精调颜色、间距、字体
    ↓
成果：设计稿完成
```

**适用场景**：内容驱动的设计任务（如小红书帖子、营销海报），或文案已经确定的 UI 页面。

**使用工具**：`code_to_design`（导入）→ `set_fill_style` / `set_text_style`（精调）→ `get_export_image`（导出）

### 模式三：设计转代码（从设计稿到生产代码）

```
人：在 Pixso 中完成高保真设计
    ↓
AI：读取设计结构，生成代码
    ↓
人：检查代码质量，提出优化需求
    ↓
AI：调用 refine_generated_code 优化
    ↓
成果：可直接集成的生产代码
```

**适用场景**：UI 开发阶段，需要将设计稿还原为前端代码。

**使用工具**：`design_to_code`（生成）→ `refine_generated_code`（优化）

### 模式四：设计系统管理（从混乱到一致）

```
AI：扫描当前文件 → 发现 5 种不同字号、3 种红色
    ↓
AI：建议统一为 Design Tokens
    ↓
人：确认规则
    ↓
AI：执行批量替换
    ↓
成果：设计系统一致
```

**适用场景**：团队协作中维护设计一致性、设计系统迁移。

**使用工具**：`query_all_unique_props`（审计）→ `write_variables` / `write_styles`（建 Token）→ `replace_props`（批量替换）

### 模式五：组件库智能调用（从零散到复用）

```
AI：了解项目需要的 UI 组件
    ↓
AI：搜索 Pixso 组件库中匹配的组件
    ↓
人：选择确认
    ↓
AI：创建组件实例、调整参数
    ↓
成果：基于设计系统的规范页面
```

**适用场景**：使用已有设计系统快速搭建页面，避免重复设计。

**使用工具**：`read_components`（了解组件库）→ `query_nodes`（搜索匹配）→ `create_instance`（创建实例）

### 模式六：批量操作与审计（从重复劳动到自动化）

```
AI：扫描所有页面 → 列出不一致的地方
    ↓
人：确认需要修复的项目
    ↓
AI：一键批量修复
    ↓
成果：设计质量提升，零重复劳动
```

**适用场景**：大型文件的维护、设计规范检查、准备交付前的质量审查。

**使用工具**：`check_layout`（布局检查）→ `query_all_unique_props`（属性审计）→ `replace_props`（批量修复）

---

## 五、造化坊的 Pixso 协作工作流

结合造化坊的实际需求（小红书帖子排版设计），推荐的协作流程：

```
Step 1: 内容准备（人主导 + AI 辅助）
  ├── 确定帖子主题和金句（人）
  ├── AI 生成多版本文案（AI）
  └── 人选择和优化，确定最终文案
             ↓
Step 2: 结构化设计（AI 主导 + 人确认）
  ├── AI 将内容转为 HTML 卡片布局（AI）
  ├── 人确认视觉方向和配色方案
  └── AI 调整 HTML 样式
             ↓
Step 3: 导入 Pixso（AI 执行）
  ├── AI 调用 code_to_design 导入 HTML
  ├── AI 检查布局和渲染效果
  └── 人在 Pixso 中查看确认
             ↓
Step 4: 精调优化（人主导）
  ├── 人在 Pixso 中微调间距/颜色/字体
  ├── AI 辅助批量调整样式
  └── 确认最终效果
             ↓
Step 5: 导出发布（AI 执行）
  ├── AI 调用 get_export_image 导出 PNG
  └── 人发布到小红书平台
             ↓
Step 6: 复盘归档（AI 辅助）
  ├── AI 记录本次设计经验
  └── 样式和组件沉淀为可复用资源
```

### 关键原则

| 原则 | 说明 |
|------|------|
| **人定方向，AI 做执行** | 创意决策、审美判断由人负责；生成、调整、检查由 AI 负责 |
| **代码为桥，设计为果** | 用 HTML/CSS 作为中间语言，既能让 AI 精确控制，又能导入 Pixso 精调 |
| **渐进式完善** | 第一版不求完美，先导入 Pixso 看到效果，再迭代精调 |
| **可复用优先** | 好的配色、字体组合沉淀为 Design Tokens，好的布局存为组件 |

---

## 六、Pixso MCP 配置参考（造化坊）

造化坊项目中的 MCP 配置文件：[`.claude/settings.json`](../../.claude/settings.json)

```json
{
  "mcpServers": {
    "pixso": {
      "type": "sse",
      "url": "http://127.0.0.1:3667/mcp"
    }
  }
}
```

### 环境要求

- [x] Pixso 桌面客户端已安装
- [x] Pixso 中已创建/打开设计文件
- [x] Pixso MCP 插件已启用（文件菜单 → 启用 Pixso MCP）
- [x] 端口 3667 未被占用

### 首次使用检查清单

1. 启动 Pixso 桌面客户端
2. 打开或创建一个 `.pixso` 设计文件
3. 确认右下角或文件菜单中 MCP 状态为「已连接」
4. 在 Claude Code 中检查工具列表是否出现 Pixso 工具
5. 用 `fetch_context` 测试连接

---

## 七、竞品对比速览

| 维度 | Pixso | Figma | 墨刀 (MockingBot) | Sketch |
|------|-------|-------|-------------------|--------|
| 平台 | Web + 桌面 | Web + 桌面 | Web | macOS |
| MCP 协议 | ✅ 原生支持 | ❌ | ❌ | ❌ |
| AI 文生设计 | ✅ | ✅ (Figma AI) | ❌ | ❌ |
| D2C 设计转代码 | ✅ React/Vue/HTML/Flutter/ArkUI | ✅ Dev Mode | 有限 | 插件 |
| C2D 代码转设计 | ✅ MCP | ❌ | ❌ | ❌ |
| 私有化部署 | ✅ | ❌ | ❌ | ❌ |
| 中文支持 | 🟢 原生 | 🟡 可用 | 🟢 原生 | 🟡 可用 |
| 免费模式 | 个人免费 | 有限免费 | 有限免费 | 买断制 |
| 鸿蒙生态 | ✅ 原生支持 | ❌ | ❌ | ❌ |

---

## 八、参考资料

- [Pixso 官网](https://pixso.cn/)
- [Pixso MCP 介绍](https://pixso.cn/mcp/)
- [Pixso MCP 落地指南](https://pixso.cn/designskills/pixso-mcp-guide/)
- [Pixso 2.0 发布介绍](https://pixso.net/articles/pixso-version-2/)
- [Pixso Meets MCP: A New Era for Collaborative Design Workflows](https://pixso.net/articles/pixso-mcp/)
- [造化坊项目理念](../zh-CN/manifesto.md)
- [造化坊 CLAUDE.md](../../CLAUDE.md)

---

_编写日期：2026-07-16 | 作者：造化坊 AI 协作系统_
