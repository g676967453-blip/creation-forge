# 立项模板目录

> 造化坊独立游戏立项流程配套模板。每个模板对应立项流程的一个阶段产出物。
>
> **v1.1 更新**：基于业界方法论全面增强——补充了 Lean Game Development、Chris Zukowski Steam 营销、微信小游戏 2025 政策、One-Page GDD 最佳实践等外部知识。

## 使用方式

立项 5 个阶段中，按需复制对应模板到 `projects/{项目名}/00-立项/` 下，填写内容。

## 模板清单

| # | 模板 | 对应阶段 | 产出物 | 填写时间 | v1.1 主要增强 |
|---|------|---------|--------|---------|-------------|
| 01 | [创意卡片模板](01-创意卡片模板.md) | 阶段 1：创意验证 | 一页纸创意卡片 | ~30 分钟 | 体验目标/Design Pillars/3选2/Scope Boundary/Lean Canvas |
| 02 | [核心玩法验证报告模板](02-核心玩法验证报告模板.md) | 阶段 2：核心玩法验证 | 验证报告 | ~1 小时 | 封测5问标准/Demo质量自查 |
| 03 | [平台决策矩阵模板](03-平台决策矩阵模板.md) | 阶段 3：平台决策 | 平台评分 + 决策 | ~30 分钟 | Genre Hit Rates/IAA vs IAP双路径对比 |
| 04 | [竞品分析模板](04-竞品分析模板.md) | 阶段 3：市场分析 | 5 竞品 × 5 维度 | ~2-4 小时 | Gamalytic/SteamDB工具推荐 |
| 05 | [技术选型模板](05-技术选型模板.md) | 阶段 4：技术+资源 | 引擎选择 + 模块估算 | ~1 小时 | 小程序限制/风险登记册/美术策略 |
| 06 | [立项GDD模板](06-立项GDD模板.md) | 阶段 5：立项文档 | GDD | ~2-4 小时 | **改为 One-Page GDD 优先**/Design Pillars/Scope Boundary/决策记录 |
| 07 | [发布策略模板](07-发布策略模板.md) | 阶段 5：发布策略 | 发布策略 | ~1-2 小时 | 90天计划/无障碍清单/本地化配置/审核红线/收入分成速查 |

## 业界参考来源

本模板体系综合了以下外部行业知识：

| 来源 | 领域 | 关键贡献 |
|------|------|---------|
| *Lean Game Development* (Julia Naomi Rosenfield Boeira, Apress, 2024) | 立项方法论 | Lean Canvas for Games / MVG / Build-Measure-Learn 循环 |
| 知乎万字长文 *独立游戏该如何立项* (2025) | 立项方法论 | 体验驱动/3选2法则/风险登记册/封测标准/9月路线图 |
| Chris Zukowski (howtomarketagame.com) | Steam 营销 | 愿望单经济学/Genre Hit Rates/商店页时机/Capsule 图片 |
| presskit.gg / StraySpark Studio | Steam 营销 | 90天发布计划/Five Visibility Rounds/预告片公式 |
| 微信开放平台 / 微信小游戏 2025 政策 | 小程序发布 | IAA/IAP双路径/版号流程/收入分成/审核红线/400万激励 |
| StraySpark / Ziva.sh / HuggingFace Course (2025) | GDD 最佳实践 | One-Page GDD/Design Pillars/Living Document/GDD=范围切割工具 |

## 相关文档

- 立项流程主文档：[docs/workflows/06-立项流程.md](../../docs/workflows/06-立项流程.md)
- 创建项目工作流：[docs/workflows/创建项目.md](../../docs/workflows/创建项目.md)
- Steam 发布 SKILL：[.claude/skills/library/workflows/steam-publish/SKILL.md](../../.claude/skills/library/workflows/steam-publish/SKILL.md)
- GDD 参考实例：[GAME-002 GDD v3.0](../../projects/GAME-002/策划文档/01-愿景/开仙门-GDD-v3.0.md)
