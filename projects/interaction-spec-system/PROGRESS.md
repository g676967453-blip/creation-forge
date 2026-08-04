# 交互规范系统 · 进度表

> 最后更新：2026-08-02 | 关联目标：[docs/目标规划.md](../../docs/目标规划.md)

## 当前状态

- **阶段**：运转中
- **进度**：v1.0 完成（22 组件 + 渲染器 + 调参工具）
- **阻塞**：无

## 版本路线

| 版本 | 目标 | 状态 |
|------|------|------|
| v1.0 | MD→HTML 生成器 + 竖版/横版规范 + 组件库 + 调参工具 | ✅ |
| v1.1 | 调参工具集成到 build 流程 / 更多组件 | 🔲 |

## 下一步

1. 按需新增组件到 [components/](components/)
2. 调参工具（`dist/tuner/`）集成到 build 流程
3. 新游戏项目接入时复制 spec 模板

## 组件清单

共 22 个：button / badge / card / progress-bar / slot / tab / toggle / input / hud / dock / screen-header / sort-bar / hero-card / item-frame / skill-frame / dialog / tooltip / quest-card / event-banner / quick-actions + 2 排版组件
