# 美术资产生产线 (Asset Pipeline)

> **人-Claude-Lovart 三角协作的美术生产基础设施 · 板块4 · 游戏美术生产工作台**

## 这是什么？

造化坊的 AI 美术生产基础设施。不是游戏项目，而是一条**生产线**：定义人类（创意总监）、Claude/DSH（技术美术）、Lovart（渲染引擎）如何协作，把「视觉需求」稳定地产出为「游戏可用的美术资产」。

- **人类负责看**（视觉判断、方向决策、最终验收）
- **AI 负责做**（需求规格化、Prompt 设计、命令执行、后处理、文件归档）
- **Lovart 负责渲染**（图像/视频/音频生成）

## 🚀 标准工作流（先读这个）

**所有生产任务都按标准六段循环执行，详见 [docs/10-美术生产标准工作流.md](docs/10-美术生产标准工作流.md)：**

```
① 需求输入 → ② 规格化(批次规格表) → ③ Prompt 工程(模板+色彩约束)
→ ④ 生成迭代(Lovart) → ⑤ 验收(人类) → ⑥ 归档交付(桌面) 
```

**桌面产出硬规则（意图/约定）：生成媒体一律落盘桌面 `{桌面}/asset-pipeline-outputs/{项目}/{类型}/`，不进仓库；仓库只留工作流文档、过程数据、参考图。**

### 本机运行配方（2026-09-05 实测）

```powershell
$env:PYTHONUTF8=1                          # 否则 agent_skill.py 读 state.json 报 GBK 错
$env:HTTPS_PROXY='http://127.0.0.1:7897'   # 本机外网直连被重置，必须走本地代理
$env:HTTP_PROXY=$env:HTTPS_PROXY
# 从 ~/.lovart/credentials.env 装载 LOVART_ACCESS_KEY / LOVART_SECRET_KEY（未设用户级环境变量）
python "C:\Users\Administrator\.agents\skills\lovart-api\agent_skill.py" <命令>
```

> Lovart 基址与桌面产出根的**用户名以实际机器为准**（本机实测 = `Administrator`）；换机器先 `echo $USERPROFILE` 确认，勿照抄。

## 目录结构

```
asset-pipeline/
├── CLAUDE.md                 ← AI 协作入口（角色定义 + 命令速查 + 汇报模板）
├── README.md                 ← 本文件
├── PROGRESS.md               ← 进度表（版本路线/已验证/本机环境）
├── project.json
├── docs/                     ← 方法论文档（规则权威源，板块内）
│   ├── 10-美术生产标准工作流.md  ← 🚀 标准总纲（先读）
│   ├── 01-协作模型.md          ← 三角协作核心循环
│   ├── 02-Prompt工程.md        ← Prompt 设计方法
│   ├── 03-工作流阶段.md        ← 草稿→成品→集成三阶段
│   ├── 04-质量验收标准.md      ← 通用 PASS/FAIL 清单
│   ├── 05-踩坑记录.md          ← 已知问题（坑#8~#15）与规避
│   ├── 06-道具图标工作流.md     ← 4×4 图标批产
│   ├── 07-建筑工作流.md        ← 2×2 等距建筑批产
│   ├── 08-城堡皮肤需求提炼.md
│   └── 09-角色原画工作流.md     ← 全身像批产（头身比校准）
├── templates/                ← Prompt 模板（6 个）
│   ├── item-grid.md          ← 道具图标 4×4 网格（→16×256px）
│   ├── building-grid.md      ← 3D 等距建筑 2×2 网格（→4×1024px）
│   ├── character-portrait.md ← 角色原画（胸像/半身/全身，头身比锚点）
│   ├── icon.md               ← 单枚图标
│   ├── sprite-sheet.md       ← 精灵表（水平多帧）
│   └── vfx.md                ← 特效帧动画
├── scripts/                  ← 后处理/切片/批次脚本
├── data/                     ← 批次 Prompt 数据（castle_skins / koi-lantern）
├── outputs/                  ← 仅过程数据 + 参考图（媒体产出在桌面）
└── lovart/                   ← 本机 Lovart 连接器（lovart.ps1 + README；.env 不入库）
```

## 可用资产类型 × 模型建议（明细见 docs/10 映射表）

| 类型 | 草稿探索 | 成品输出 | 备注 |
|------|---------|---------|------|
| 道具图标 4×4 | Nano Banana Pro | **GPT Image 2** | 绿底 → PS 抠图 + 256px 切片 |
| 3D 等距建筑 2×2 | Nano Banana Pro | **GPT Image 2** | 2048 → 4×1024 |
| 角色原画 | Nano Banana Pro | **Midjourney / GPT Image 2** | 头身比分节锚点，禁 3 组合 |
| 单枚图标 / 精灵表 / 特效 | Nano Banana Pro | 默认 / Midjourney | 按模板占位符 |

> 账号当前为**无限模式**（09-05 起），批量生成免费排队、不耗积分。

## 相关链接

- 标准工作流：[docs/10-美术生产标准工作流.md](docs/10-美术生产标准工作流.md)
- Lovart 网页画布：https://www.lovart.ai/canvas
- Lovart skill 基址：`C:\Users\Administrator\.agents\skills\lovart-api\`（官方克隆，勿入库）
- 首个接入项目（消费侧）：[GAME-002 美术制作](../projects/GAME-002/美术制作/)
- 产出目录全局规则记忆：[memory/project-asset-pipeline产出目录.md](../memory/project-asset-pipeline产出目录.md)
