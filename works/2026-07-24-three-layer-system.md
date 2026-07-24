# [2026-07-24] 造化坊三层管理体系重构

---

## 📋 问题解决日志

### 遇到了什么

当前的文档、工作流、项目产出没有清晰的分层。工作流有的放在系统层（`docs/workflows/`），有的放在项目内（`projects/asset-pipeline/docs/`）。汇报 Excel 的 5 个 Sheet 随意生长，不匹配项目的实际管理需求。

### AI 怎么协作的

用户提出三层模型（系统层→项目层→工作流层）→ AI 对齐理解 → 核心决策：工作流统一归属系统层（过程归系统，产出归项目）→ 全盘重构。

### 产出结果

**架构决策**：
- 工作流统一归系统层：`projects/asset-pipeline/docs/06-道具图标工作流.md` → `docs/workflows/道具图标-生产.md`
- 流程定义归系统，流程的产出物归项目

**Excel 仪表盘重构**（5 Sheet → 6 Sheet 三层结构）：

| Sheet | 层 | 内容 |
|-------|-----|------|
| 系统总览 | 系统层 | 基本信息 + 系统健康度指标（SKILL/工作流/日志数） |
| 项目状态 | 项目层 | 5 个项目的引擎/状态/进度/阻塞项 |
| 工作流清单 | 工作流层 | 9 个工作流的版本/SKILL/关联项目/成熟度 |
| 近期动态 | — | works/ 日志 + Git 提交，自动提取 |
| 任务看板 | — | 11 项任务，重新编号 |
| 资产地址 | — | 按三层分组 + 外部平台 |

**关键改进**：
- `generate-report.ts` 从 601 行重构为 ~400 行，去掉了所有冗余硬编码
- 项目状态表和工作流清单表数据集中管理，一目了然
- 系统总览增加自动计算指标（SKILL 数量/工作流数量/日志数/Git 提交数）

### HTML 仪表盘

同日将汇报载体从 Excel 切换为 HTML：
- 新建 `tools/generate-dashboard.ts`：读取数据源 → 内嵌 JSON → 输出 `reports/造化坊仪表盘.html`
- 6 Tab 切页（系统总览/项目状态/工作流清单/近期动态/任务看板/资产地址）
- 暗色系风格（`#141414` 底 + `#ff6b6b` accent），匹配造化坊小红书模板
- 独立 HTML 文件，双击即开，无依赖
- `generate-report.ts` → 改为薄封装入口（调用 generate-dashboard）
- Excel 版已废弃

### 交互按钮 + 本地服务器

同日进一步迭代仪表盘：

- **两个交互按钮**：🔄 更新数据（Toast 提示 `/sync-report`）+ 📝 总结日志（模态框 → 写入 works/ 或下载 .md）
- **本地动态服务器**：`npm run dashboard` → `http://localhost:3456`，按钮调用真实 API
  - `GET /api/data` → 实时采集系统数据
  - `POST /api/log` → 直接写入 works/ 目录
  - 服务器未启动时自动降级为下载 .md 文件
- **架构拆分**：`tools/collect-data.ts`（数据采集公共模块）+ `tools/dashboard-server.ts`（Express 35 行）→ `generate-dashboard.ts` 共用
- **Tab 切页修复**：三次调试——event listener 时机 → onclick 回退 → 发现 JS 语法错误（孤儿 `catch` 块 + 跨行字符串断裂），最终 `node --check` 验证通过

### 关联项目

造化坊 · 基础设施
