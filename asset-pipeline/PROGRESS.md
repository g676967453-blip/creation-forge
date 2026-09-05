# 资产管线 · 进度表

> 最后更新：2026-09-05 | 关联目标：[目标规划](../造化仪表盘/目标规划.md)「asset-pipeline 对接 GAME-002」
> 权威工作流：[docs/10-美术生产标准工作流.md](docs/10-美术生产标准工作流.md)

## 当前状态

- **阶段**：投产中（工具链 09-05 已恢复：网络经代理打通、账号切回无限模式）
- **进度**：40%（图标/建筑/角色原画三管线投产；对接 GAME-002 待其 V0.1 稳定）
- **阻塞**：~~网络不可达~~ → 已恢复（需本地代理 `127.0.0.1:7897`，见 docs/05 坑#8）；剩余依赖 = GAME-002 V0.1 稳定

## 版本路线

| 版本 | 目标 | 状态 |
|------|------|------|
| v1 | 道具图标管线验证（Lovart→PS→256px 切片） | ✅ |
| v3 | 3D 等距建筑管线：2048×2048 2×2 网格 → 4×1024×1024（08-14 鲤鱼花灯批次 5 变体，城堡皮肤系列） | ✅ 已投产 |
| v4 | 角色原画管线：100 角色随机批量 + 三轮头身比校准（08-15~16，适配矩阵已沉淀） | ✅ 探索线跑通 |
| v5 | 美术生产标准工作流成文：`docs/10-美术生产标准工作流.md` + 入口文档同步（09-05） | ✅ |
| v2 | 对接 GAME-002：提取道具清单 → 批量生产第一批图标 | 🔲 等 V0.1 稳定 |

## 下一步

1. **按 docs/10 试点第一单**：器灵「百世书」胸像（方案与 Prompt 已就绪，🟡 自 08-17 搁置）→ 回填第一张「批次规格表」验证标准
2. GAME-002 V0.1 稳定后：M1 提取道具清单 → M2 Lovart 批量图标（5–10 个）→ PS 抠图 + 256px 切片 → 导入验证
3. IAA 救火英雄 G-016 概念图（🔴 待办）
4. （可选，待用户批准）系统层 `docs/workflows/` 指针化到板块标准

## 已验证

| 风格 | 模型 | 状态 |
|------|------|------|
| 扁平图标 | Lovart | ✅ |
| 像素精灵 | Lovart | ✅ |
| 半写实道具 | Lovart | ✅ |
| 3D 等距建筑 | GPT Image 2 | ✅ 已投产（城堡皮肤系列 + 鲤鱼花灯探索） |
| 角色原画（头身比可控） | GPT2/NBP × 韩系/欧美卡通 | ✅ 5 组合稳定达标（100 批验证） |
| 角色原画（比例不可控） | MJ×3D · GPT2×3D · MJ×韩 | ❌ 钟摆/无视，生产禁用 |

## 管线文件

| 资产类型 | Prompt 模板 | 工作流文档 | 切片/后处理脚本 |
|---------|-----------|-----------|---------|
| （总纲）| — | `docs/10-美术生产标准工作流.md` | — |
| 道具图标 (4×4) | `templates/item-grid.md` | `docs/06-道具图标工作流.md` | `slice_grid.py` + `normalize_icons.py` + `ps_chroma_slice.jsx` |
| 建筑 (2×2) | `templates/building-grid.md` | `docs/07-建筑工作流.md` | `slice_grid_2x2.py` |
| 角色原画 (全身像) | `templates/character-portrait.md` | `docs/09-角色原画工作流.md` | `batch100_helper.py` |
| 图标 (单枚) | `templates/icon.md` | — | `postprocess.py` |
| 精灵表 / 特效 | `templates/sprite-sheet.md` / `vfx.md` | — | — |

## 本机环境核查（2026-09-05，实测）

| 项 | 值 |
|----|----|
| 桌面产出根 | `C:\Users\Administrator\Desktop\asset-pipeline-outputs\`（文档不写死用户名，以实际机器为准） |
| Lovart skill 基址 | `C:\Users\Administrator\.agents\skills\lovart-api\agent_skill.py`（需 `PYTHONUTF8=1` + 代理 `127.0.0.1:7897` + `~/.lovart/credentials.env` 装载 AK/SK） |
| 账号生成模式 | **无限模式**（09-05 从 fast 切回） |
| Lovart 项目 | 本地登记 7 个；云端实测存活 5（开仙门 / asset-pipeline-buildings / 像素图标×2 / 概念设计等）；2 个幽灵待清（`8baaacfe…`、`xianxia-icons-2026`） |

## 待清事项

- [ ] 幽灵项目本地登记清理（`project-remove`：`8baaacfe62864acc897539b7bbef1f51`、`xianxia-icons-2026`）
- [ ] `asset-pipeline/outputs/` 内 `demo-character-concept` 批次过程数据（batch-100 state/表）按需归档（08-20 外移规则的存量收尾）
