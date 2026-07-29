---
description: 美术排期表审查：连接飞书美术排期表 → 执行4目标分析（基础状况/风险逾期/信息规范/综合建议）→ 输出结构化审查报告。当用户说"审查美术""美术review""检查排期""art-review"时使用。
---

# /art-review — 美术排期表审查

> 定位：主业主美工作 — 飞书美术排期表标准化审查

## 触发

用户说 `/art-review` 或 "审查美术表" 或 "美术排期审查" 或 "检查美术任务" 或 "出个美术报告"

## 前置确认

开始前向用户确认 2 件事：
1. **审查范围** — 审查哪个项目？（单个项目名 / "全部"）
2. **审查深度** — 快速（目标一+二）/ 标准（全部4目标）/ 深度（+命名合规检查）

## 已知项目配置

| 项目代号 | base_token | 美术排期表 table_id | 备注 |
|---------|------------|-------------------|------|
| 项目A | `AsFHbvuI4aastjsKZ82cwzYrnfg` | `tblBWWt9nGH5MtCJ` | — |
| 项目B | `ANiLbFT3LaTOG4sMpLkclM6GngV` | `tblO31tB98EBhsQa` | 字段最全 |
| 项目C | `CCDnbqmhUayNqtsSNoqc6sNpnQ2` | `tbla5vOHQXQmG5zm` | — |
| 项目D | `Ohn0bqEsdaqG26s6kGMc1qpVnAh` | `tblaoF0N37pKFEcd` | — |
| 项目E | `CIqGbSjbHa3woDsaGJkcPEZ6nPf` | `tblG9BsUII6nIpIE` | 加密 |

## 执行步骤

### 1. 读取数据结构

```bash
lark-cli base +field-list --base-token <token> --table-id <table_id> --as user
```

确认 35 个字段可用，特别关注：
- `flduB6KFwo` — 业务类型
- `fldN84Ywr8` — 执行人
- `fldJ9rdU56` — 计划截止时间
- `fldeHvMTP8` — 进度
- `fldxIcC0o2` — 制作风险（公式）
- `fldYf5WZMo` — 距交付日（公式）
- `fldq8APx1d` — 优先级
- `fldRjv6rwJ` — 子任务
- `fldlaX0hGd` — 主任务
- `fldHLAH4ZK` — 实际截止时间
- `fldFJMg3rH` — 计划开始时间
- `fldZ9aK4Ma` — 实际人日
- `fldsRmWQZw` — 标准人日
- `fldZpstuVH` — 负责人
- `fldJTHQFea` — 对接策划
- `fldhelninQ` — 开发阶段
- `fld4r4eVbt` — 难度
- `fldK1dTzCU` — 版本号
- `fldSxwBukO` — 组别（公式）
- `fldNLzXbDB` — JIRA

### 2. 读取全量数据

```bash
lark-cli base +record-list --base-token <token> --table-id <table_id> --as user --limit 500
```

注意：若 `has_more: true`，需要分批读取直到全部取完。

对风险数据补充筛选查询：
```bash
# 查询逾期项
lark-cli base +record-search --base-token <token> --table-id <table_id> --as user \
  --filter 'CurrentValue.制作风险.contains("🔴逾期")'

# 查询未排期项
lark-cli base +record-search --base-token <token> --table-id <table_id> --as user \
  --filter 'CurrentValue.制作风险.contains("🟡未排期")'
```

### 3. 执行 4 目标分析

#### 目标一：基础状况

对读回的数据进行统计（用 Python 或本地分析）：
- 总任务量 = COUNT(全部记录)
- 按 `业务类型` GROUP BY → 各类数量 + 占比
- DISTINCT `执行人` → 投入人力总数
- 按 `执行人` GROUP BY → 人均任务量，Top 5 排序
- FILTER `计划截止时间` 在 30 天内 → 近期到期清单
- 按 `优先级` GROUP BY → P0-P5 分布
- 按 `进度` GROUP BY → 完成/进行/未开始比例

#### 目标二：风险逾期

读 `制作风险` 字段统计：
- 🔴逾期: COUNT, 占比
- ⚠️即将逾期: COUNT, 占比
- 🟡未排期: COUNT, 占比
- 🟢正常: COUNT, 占比

逾期项清单：提取所有 `制作风险 != 🟢正常` 的记录，列出关键字段。

交叉分析：
- 逾期项按 `业务类型` GROUP BY → 哪些类型逾期最严重
- 逾期项按 `执行人` GROUP BY → 哪些人逾期集中
- 逾期项按 `开发阶段` GROUP BY → 哪个阶段问题多

#### 目标三：信息规范

逐项检查：
- `主任务` IS NULL OR EMPTY → 计数
- `业务类型` IS NULL OR EMPTY → 计数
- `执行人` IS NULL OR EMPTY → 计数
- `计划截止时间` IS NULL → 计数
- `进度` = "已完成" AND `实际截止时间` IS NULL → 逻辑异常
- `实际截止时间` < `计划开始时间` → 日期异常
- `优先级` = P0 AND `计划截止时间` IS NULL → 未排期 P0

#### 目标四：综合分析

聚合以上数据，写 5 段结论：
1. **关键数字**：总任务/完成率/风险率/人力
2. **健康度排行**：各业务类型按完成率排序
3. **人力负载**：负载 Top 5，超标预警
4. **趋势预判**：下月到期量、瓶颈业务类型
5. **行动建议**：最多 5 条，按紧急度排列

### 4. 生成报告

按以下模板写入 `主美工作/审查报告/YYYY-MM-DD-项目名.md`：

```markdown
# 美术审查报告 — [项目名] — YYYY-MM-DD

> 审查人：AI · 数据来源：飞书美术排期表 · 审查类型：[快速/标准/深度]

## 一、基础状况
[目标一全部指标表格]

## 二、风险逾期
[目标二全部指标表格 + 逾期清单 + 原因分析]

## 三、信息规范
[目标三检查结果表格 + 不通过项明细]

## 四、综合建议
[目标四 5 条结论]
```

报告同时以精简摘要形式在对话中呈现关键发现（控制在可一屏读完的长度）。

## 约束

- **只读不写**：飞书数据只读取，绝不修改。`+record-list` / `+record-search` / `+data-query` 均为只读操作。
- **数据完整性**：`has_more: true` 时必须全部读取，不得基于部分数据下结论。
- **空值处理**：字段为空时标注"未填写"，不跳过记录、不猜测填充。
- **风险判定以飞书公式为准**：`制作风险` 是飞书端公式计算的结果，审查时直接引用，不自行重新判定。
- **报告落盘**：每次审查必须生成文件存档，路径 `主美工作/审查报告/YYYY-MM-DD-项目名.md`。
- **多项目分别报告**：如审查"全部"，每个项目一份独立报告。
- **文件路径用相对路径**：lark-cli 的路径参数只接受相对路径。

> 完整流程见 [docs/workflows/美术任务表审查.md](../docs/workflows/美术任务表审查.md)
