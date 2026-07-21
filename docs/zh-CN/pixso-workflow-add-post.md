# Pixso 添加一期帖子 — 操作流程

> 适用于：已有 Pixso 文件 + MCP 连接，需新增一期小红书帖子排版。

## 前置条件

- Pixso 桌面端已打开目标 `.pixso` 文件
- MCP 连接正常（`http://127.0.0.1:3667/mcp`，SSE 协议）
- 新帖子的 HTML 卡片已准备好（`projects/xiaohongshu/post-XX/card-01.html` ~ `card-06.html`）

---

## 操作流程

### Step 0：导入前检查 ⚠️ 关键

```
1. 在 Pixso 画布中点击空白区域（取消所有选中节点）
2. 确认左侧图层面板没有任何节点高亮/选中
3. 确认当前在正确的 page 层级（非某个 frame 内部）
```

**为什么这一步重要：** `code_to_design` 会导入到当前活跃/选中的容器内。如果某个旧 frame 被选中，新卡片会嵌套进去。

### Step 1：建立会话 + 确认当前状态

```bash
# 初始化 MCP 会话，获取 session ID
curl -v -X POST http://127.0.0.1:3667/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"claude","version":"1.0"}}}'

# 查看当前画布有几个 top-level frame
# tools/call → get_top_level_frames { type: "frame", pageIds: ["0:1"] }
```

### Step 2：逐张导入卡片（每期 6 次导入）

对 card-01 到 card-06，**每张卡重复以下子步骤**：

```bash
# 2a. 确认无选中（再次点击画布空白处）
# 2b. 导入单张卡片
# tools/call → code_to_design { htmlStr: "<card-NN.html 的完整内容>" }

# 2c. 导入后立即重命名 frame
# tools/call → apply_design {
#   operations: [{
#     mode: "U",
#     id: "<新 frame 的 node ID>",
#     name: "YYYY-MM-DD-主题名称-卡N"
#   }]
# }

# 2d. 回到 2a，导入下一张
```

**导入顺序：** card-01 → card-02 → ... → card-06

### Step 3：导入后对齐修正

`code_to_design` 可能不保留 CSS `text-align`。导入后用 `apply_design` 修正：

```bash
# 先用 query_nodes 找出所有文本节点
# tools/call → query_nodes { mode: "type", type: "TEXT" }

# 对需要居中的文本节点，设置 textAlignHorizontal
# tools/call → apply_design {
#   operations: [{
#     mode: "U",
#     id: "<文本 node ID>",
#     textAlignHorizontal: "CENTER"
#   }]
# }
```

> 💡 已在 HTML 模板中为所有文字元素显式声明 `text-align`，减少需要手动修正的数量。

### Step 4：定位排列（可选）

```bash
# 用 get_top_level_frames 获取所有 frame ID
# 6 个卡片 frame 均为平级 top-level
# 用 apply_design 的 U 操作排列位置

# 排列规则：水平排列，间距 60px
# card-01: left=0, top=0
# card-02: left=1140, top=0
# card-N: left=(N-1)×1140, top=0
```

---

## 关键规则

| 规则 | 说明 |
|------|------|
| ⚠️ 不嵌套 | 每张卡片必须是 top-level frame，不能是其他 frame 的子节点 |
| ⚠️ 取消选中 | 每次 `code_to_design` 前必须点击画布空白处取消选中 |
| 🏷️ 命名规范 | 最外层 frame 命名：`YYYY-MM-DD-主题名称-卡N`（如 `2026-07-17-如何做小红书图文笔记-卡1`） |
| 📐 一卡一帧 | 每期 6 张卡片 = 6 个独立 top-level frame，不是 1 个 tall frame |
| 📏 统一尺寸 | 每个卡片 frame 1080×1440px |
| 🔄 不删旧 | 加新帖子不需要删除已有的，直接在旁边追加 |
| 🖼️ 独立导出 | 每张卡可独立导出为 PNG |

---

## 命名规范

```
YYYY-MM-DD-主题名称-卡N

示例：
  2026-07-17-如何做小红书图文笔记-卡1
  2026-07-17-如何做小红书图文笔记-卡2
  ...
  2026-07-17-如何做小红书图文笔记-卡6
```

---

## 验证方法

```bash
# tools/call → get_top_level_frames { type: "frame", pageIds: ["0:1"] }
# 返回的 frames 数量 = 6 × 已添加的帖子数
# 每个 frame 命名符合 YYYY-MM-DD-主题-卡N 格式
# 每个 frame 尺寸为 1080×1440
```

---

## 已知注意事项

- `code_to_design` 返回 `{"success":true}` 即成功
- 避免在 session 之间反复操作同一文件——session 过期会导致 frame ID 变化
- Pixso 不支持的部分 CSS：复杂的 flex 嵌套、CSS 变量（`var(--accent)` 会被忽略，可用硬编码颜色值替代）
- **CSS `text-align` 可能不被保留**，导入后需用 `apply_design` 修正 `textAlignHorizontal`
- 部分特殊字符（✕、⏱️ 等）可能触发 validation warning，不影响布局
