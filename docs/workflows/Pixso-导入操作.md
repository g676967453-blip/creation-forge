# Pixso 导入操作

> 版本：v1 | 最后更新：2026-07-21 | 对应 SKILL：无（纯人工操作）

## 触发条件

小红书帖子 HTML 已生成，需要导入 Pixso 进行排版确认和 PNG 导出。

## 前置条件

- Pixso 桌面端已打开目标 `.pixso` 文件
- MCP 连接正常（`http://127.0.0.1:3667/mcp`，Streamable HTTP 协议；请求需带 `Accept: application/json, text/event-stream`）
- HTML 文件已准备好（`projects/xiaohongshu/YYYY-MM-DD-主题/index.html`）

## 人机分工

| 步骤 | 人 | AI |
|------|-----|-----|
| 1. 导入前检查 | 点击画布空白取消选中 | 确认无节点被选中 |
| 2. 导入 | — | 执行 `code_to_design` 导入 HTML |
| 3. 重命名 | — | 执行 `apply_design` 重命名 frame |
| 4. 对齐修正 | 检查视觉效果 | 执行 `apply_design` 修正 textAlignHorizontal |
| 5. 导出 | — | 执行 `get_export_image` 导出 PNG |

## 执行步骤

### Step 1：导入前检查 ⚠️ 关键

1. 在 Pixso 画布中点击空白区域（取消所有选中节点）
2. 确认左侧图层面板没有任何节点高亮/选中
3. 确认当前在正确的 page 层级（非某个 frame 内部）

### Step 2：导入

AI 通过 MCP 调用 `code_to_design`，将 `index.html` 导入 Pixso。

### Step 3：重命名 frame

导入后立即重命名为 `YYYY-MM-DD-主题`。

### Step 4：对齐修正

`code_to_design` 可能不保留 CSS `text-align`。导入后检查文字对齐，必要时用 `apply_design` 修正 `textAlignHorizontal` 为 `CENTER`。

### Step 5：导出 PNG

6 张卡片独立导出 PNG，放入 `Pixso截图/日期-主题/`。

## 产出物

| 产出 | 位置 |
|------|------|
| Pixso frame | 画布上以 `日期-主题` 命名的 frame |
| 导出 PNG | `projects/xiaohongshu/Pixso截图/日期-主题/卡片N-描述.png` |

## 约束与规则

- ⚠️ **不嵌套**：每期帖子必须是 top-level frame，不能是其他 frame 的子节点
- ⚠️ **取消选中**：每次导入前必须点击画布空白处取消选中
- 🏷️ **命名规范**：frame 命名为 `YYYY-MM-DD-主题`
- 🔄 **不删旧**：加新帖子不需要删除已有的，直接在旁边追加
- 📏 **统一尺寸**：每个 frame 1080×1440px

## 已知问题

- `code_to_design` 返回 `{"success":true}` 即成功
- CSS `text-align` 可能不被保留，导入后需修正
- 部分特殊字符可能触发 validation warning，不影响布局
- CSS 变量（`var(--accent)`）会被忽略，HTML 中应用硬编码颜色值替代
