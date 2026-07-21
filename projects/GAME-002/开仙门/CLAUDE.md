# 开仙门 - CLAUDE.md

180度扇面防御 × 肉鸽塔防 × 修仙题材的 Godot 4.6 独立游戏。

## ⚠️ AI 行为规则（每会话自动执行）

1. **读文档先看日期**：打开任何策划文档，先检查验证日期。超过 7 天 → 第一句话提醒用户"此文档可能过期，数据以 CSV 为准"
2. **变更后跑传播清单**：任何代码/CSV 变更完成后，查阅 `../总指挥-协作原则/04-质量体系/03-变更传播清单.md` → 逐项检查受影响文件 → 更新文档的验证日期
3. **数量问题答 CSV**：被问"X 有多少个"时，直接读对应 CSV 行数回答，不引用文档中的数字
4. **矛盾时 CSV 为准**：发现文档与 CSV 数据不一致 → 以 CSV 为准 → 告知用户具体差异 → 等待用户决定是否修文档
5. **新功能前先检查完整性**：被要求做新功能时，先检查已有功能的 CSV 数据是否完整（card_config.csv 是否缺行、form_level_config.csv 是否缺功法）。如已有功能数据不完整，提醒用户先补数据

## 项目结构

```
开仙门/
├── autoload/          ← 全局单例（CsvLoader, DataManager）
├── scripts/
│   ├── managers/      ← GameManager, WaveManager, CardManager, MountainManager,
│   │                     EconomyManager, BattleFlowController, UIStateCoordinator
│   ├── ui/            ← UI 面板逻辑 + floating_text
│   ├── data/          ← 数据资源类定义（Resource, 全部有 class_name）
│   ├── effects/       ← 纯视觉效果
│   ├── _unused/       ← 废弃脚本归档
│   └── *.gd           ← 运行时对象（enemy_base, main_peak, projectile,
│                          projectile_visual, summon_fox, summon_artifact_sword）
├── scenes/
│   ├── main.tscn      ← 主入口
│   ├── ui/            ← battle_hud, floating_text, repair_prompt_panel
│   ├── enemies/       ← enemy_base
│   ├── peaks/         ← mountain_click_area
│   ├── projectiles/   ← projectile
│   ├── effects/       ← lightning_bolt
│   └── debug/         ← psd_layers（开发调试用）
├── data/
│   ├── *.csv          ← 运行时配置（唯一数据来源）
│   └── _unused_tres/  ← 废弃的 .tres 文件（不要新增）
├── assets/
│   ├── source/        ← 原始 PSD/AI（待填充）
│   ├── _exported/     ← PSD 导出中间产物
│   ├── runtime/       ← 正式游戏资源（enemies/, projectiles/）
│   ├── fonts/         ← 字体（预留）
│   └── sprites/       ← 通用精灵（预留）
└── addons/            ← auto_reload
```

## 数据流

所有游戏配置从 CSV 加载 → DataManager（Autoload）统一入口：
- `data/main_peak_config.csv` — 器灵
- `data/form_config.csv` — 功法（6 个：御剑诀/金刚咒/炼魂诀/灵狐契/御器诀/雷霆诀）
- `data/form_level_config.csv` — 功法逐级数值（102 行，17 级/功法）
- `data/enemy_config.csv` — 敌人（9 种）
- `data/card_config.csv` — 卡牌（28 张（分布4/5/5/5/5/4））
- `data/peak_config.csv` — 山峰（6 座）
- `data/wave_config.csv` — 波次（15 波）
- `data/spirit_profile_config.csv` — 器灵档案（1 种）
- `data/spirit_growth.csv` — 器灵成长（7 级）
- `data/enemy_sprite_config.csv` — 敌人精灵表
- `data/mountain_sprite_map.csv` — 山峰 PSD 图层映射

## 关键约束

1. **数据不在代码里写死** — 数值/配置走 CSV，DataManager 加载
2. **场景按类型归位** — 新 .tscn 必须放入 scenes/ 对应子目录
3. **节点路径集中管理** — 各文件顶部用 `const` 常量管理路径，不要裸写 `get_node("路径/XXX")`
4. **PSD 导出用 _exported/** — 不是 runtime/，后续应迁移
5. **不要新增 .tres** — 数据来源统一为 CSV
6. **不要引入新 addon** — 除非明确要求
7. **策划文档可信但需验证** — 数值以 `data/*.csv` 为准；文档可能滞后于代码，读策划文档时自动对比 CSV 实际数据

## 策划文档（工程外）

```
../策划文档/
├── 01-愿景/          ← GDD（1 份）
├── 02-系统设计/      ← 战斗体系/数值定位表（2 份）
├── 03-功能规格/      ← 每个功能一份 spec（12 份）
├── 04-数据/          ← 数值总览 + 名词表 + 功法范例（3 份）
├── 05-元文档/        ← 模板/路线图/审计/规范（16 份）
├── 06-归档/          ← 已过时/已合并（30 份）
└── *.xlsx            ← 数值配表 Excel
```

> 2026-07-10 重组：按 5 层金字塔（愿景→系统→规格→数据→元文档）重新组织。

## 文档×数据交叉验证（每次读策划文档时自动执行）

**CSV 是唯一数值真相源。** 数值矛盾时：CSV > 代码 > 设计文档。

读任何策划文档时，如果文档中提到数值（功法伤害、卡牌效果、敌人速度/血量、波次配置等），自动做以下对比：

| 文档中提到的数据 | 核验 CSV | 常见偏差 |
|----------------|---------|---------|
| 功法数量/名称/伤害 | `data/form_config.csv` | 6 个功法 |
| 卡牌 ID/名称/效果 | `data/card_config.csv` | 28 张（分布4/5/5/5/5/4） |
| 敌人速度/血量 | `data/enemy_config.csv` | 9 种敌人 |
| 波次配置 | `data/wave_config.csv` | 15 波，含混合编队 |
| 器灵属性 | `data/main_peak_config.csv` | HP=2000, dmg=18, interval=0.85s |
| 山峰配置 | `data/peak_config.csv` | 6 座山峰 |
| 器灵档案 | `data/spirit_profile_config.csv` | 1 种器灵（百世书） |

发现不一致时：**以 CSV 为准，标记文档待更新**，并告知用户该处数据已过时。

## 人机协作指挥中心

协作方法论与工作流程的最高指挥层，见 `../总指挥-协作原则/`：
- **01-协作宪法.md** — 核心协作原则与决策权限
- **02-角色分工.md** — 人类/AI 能力矩阵与RACI分工
- **03-工作流SOP/** — 全生命周期5阶段标准流程
- **04-质量体系/** — 交付检查清单与评审标准
- **05-知识管理/** — 文档体系地图与决策记录模板
- **06-持续改进/** — 站会模板与里程碑复盘
- **AI记忆/** — 跨会话持久记忆（工作日志 + 行为规则）

## 程序规则（技术规范）

详细规则见 `../程序规则/`（按优先级排列）：
- **Godot架构规范与模块化标准.md** — 核心：三层架构、模块拆分标准、GDScript 编码规范、反模式目录
- **AI功能模块架构设计审查提示词.md** — 新功能架构评审流程与输出格式
- **Claude Code日常协作规则.md** — 日常协作检查清单、文件落位决策树、禁止事项

修改项目前先跑一遍：
- 涉及哪些 .gd / .tscn 文件？
- 有硬编码路径需要同步更新吗？
- 需要更新 CSV 配置吗？
- 新代码属于三层模型（表现层/逻辑层/数据层）的哪一层？

修改项目后必须检查（变更闭环清单）：
- □ CSV 数值改了？→ 检查 `开仙门-数值设计总览-v1.md`、对应功法文档
- □ 功法增删？→ 检查 `开仙门-GDD-v0.1.md`、`需求文档-多功法并行攻击.md`、`CODE_WIKI.md` 功法计数
- □ 卡牌增删？→ 检查 `需求文档-卡牌系统.md` 数量
- □ 器灵/敌人属性改了？→ 检查 `数值设计模板对照-v1.md`
- □ 公式/机制改了？→ 检查 `templates/功法设计模板.md`、`CODE_WIKI.md`
- □ 本文件"数据流"章节的计数是否需要更新？
- □ 本次变更记入 `../开发记录/开发日志.md`

详细变更传播清单见 `../总指挥-协作原则/04-质量体系/03-变更传播清单.md`
