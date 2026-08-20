# tools/_archive — 孤儿脚本归档

本目录存放已过时、无活跃引用、确认不再使用的工具脚本。保留原件备查，不参与任何 npm scripts 或工作流。

归档日期：2026-08-20

| 脚本 | 归档原因 |
|------|----------|
| `generate-report.ts` | 自述已被 HTML 仪表盘替代——现为调用 `generate-dashboard.ts` 的薄封装入口，无独立存在意义 |
| `pixso_mcp.py` | 全仓 0 引用；内嵌硬编码 MCP session ID（`c4d98c2e-…`），会话过期即失效 |
| `stitch-design-tokens.ts` | 头注释声称供 `stitch-to-godot-theme.ts` 和 `stitch-html-to-godot.ts` 共享，两个消费方文件在仓库中均不存在；stitch MCP 集成已整体移除 |
| `proxy-setup.cjs` | 仅为已移除的 mcp-stitch 注入代理；仅历史日志提及，且 `NODE_OPTIONS=--require` 用法曾被标记为不可用（spawn EINVAL） |
| `import_pixso.js` | 仅旧日志引用；头注释用法写 `node .claude/import_pixso.js`，与实际位置不符，且 `.claude/` 下并无此文件 |

> 说明：`tools/batch-removebg.py` 未被归档——该脚本由其他会话近期添加，可能仍在使用中。
