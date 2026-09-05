# Lovart 连接配置（本机）

Lovart（https://www.lovart.ai）AI 设计平台已通过官方 `lovart-skill` 接入本机，
用于生成图片 / 视频 / 音频 / 3D 资产。

## 文件说明

| 文件 | 用途 |
|------|------|
| `.env` | AK/SK 密钥 + 代理配置（**敏感，勿提交版本库**）。⚠️ 本机（09-05 实测）缺失；AK/SK 实际在 `~/.lovart/credentials.env` |
| `lovart.ps1` | 包装脚本：读 `.env` → 设环境变量 → 调官方 `agent_skill.py` |
| `lovart-skill/`（仓库同级） | 官方 skill 克隆（含 `skills/lovart-skill/scripts/agent_skill.py`）。`lovart.ps1` 依次查找：仓库同级 → 仓库内 → `J:\ceshi\`；缺失会提示 clone（`git clone https://github.com/lovartai/lovart-skill`，本地源勿入库） |
| 本机官方 skill（09-05 实测） | `C:\Users\Administrator\.agents\skills\lovart-api\agent_skill.py` —— DSH/本机实际调用基址。`lovart.ps1` 查找链不含该路径，本机请直接走仓库根 README「本机运行配方」 |

## 关键网络问题（重要）

本机**外网直连会被网络层重置**（WinError 10054，TLS 握手阶段 RST），
必须走本地代理 `http://127.0.0.1:7897`（系统 PAC 指定，Clash 类工具）。
包装脚本已自动处理；若直接调 `agent_skill.py`，需先：

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
```

另外 Python 请求必须带官方 User-Agent（`agent_skill.py` 自带），否则 Cloudflare 返回 403。

## 使用方式

```powershell
# 查询生成模式 / 可用模型（连接验证）
.\lovart.ps1 query-mode

# 生成图片（阻塞等待完成，下载到本地）
.\lovart.ps1 chat --prompt "赛博朋克风格的猫，霓虹城市背景" --json --download

# 查看项目 / 会话
.\lovart.ps1 projects
.\lovart.ps1 threads

# 切换生成模式（无限模式=排队免费 / 快速模式=消耗积分）
.\lovart.ps1 set-mode --unlimited
.\lovart.ps1 set-mode --fast
```

## 账户状态（2026-09-05 实测）

- 生成模式：**无限模式**（unlimited，排队、不耗积分；09-05 从 fast 切回）
- 可用图片模型：GPT Image 2 / 1.5、Midjourney、Nano Banana / 2 / Pro、Seedream 4 / 4.5
- Lovart 项目：本地登记 7 个，云端实测存活 5（`4a1e820e`=开仙门 · `2e637ab7`=asset-pipeline-buildings · `1ea4a5ad`=16 pixel icons · `acf45e04`=角色原画批量 · `d81a62e9`=新画布 · `46f30e5f`=概念设计 等）；幽灵 2 个待清（`8baaacfe…`、`xianxia-icons-2026`）
- 活跃项目（本地 state）：`46f30e5f3ac1488c8176ebd715e8a2d3`（概念设计，最近活动 08-26）

## 凭据

- AK/SK 存放于 `~/.lovart/credentials.env`（UTF-8）。⚠️ 09-05 核查：**未**设用户级环境变量
  `LOVART_ACCESS_KEY` / `LOVART_SECRET_KEY`，每轮执行前需手动装载（见仓库根 README「本机运行配方」）
- 本地状态文件：`~/.lovart/state.json`（项目、会话历史；读取需 `PYTHONUTF8=1`）

## 参考

- 官方指南：https://lovart.notion.site/Lovart-OpenClaw-User-Guide-33da46b16a0f80f6a7fff8e4896b9fca
- Skill 仓库：https://github.com/lovartai/lovart-skill
