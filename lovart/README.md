# Lovart 连接配置（本机）

Lovart（https://www.lovart.ai）AI 设计平台已通过官方 `lovart-skill` 接入本机，
用于生成图片 / 视频 / 音频 / 3D 资产。

## 文件说明

| 文件 | 用途 |
|------|------|
| `.env` | AK/SK 密钥 + 代理配置（**敏感，勿提交版本库**） |
| `lovart.ps1` | 包装脚本：读 `.env` → 设环境变量 → 调官方 `agent_skill.py` |
| `../lovart-skill/` | 官方 skill 仓库（已克隆，含 `skills/lovart-skill/scripts/agent_skill.py`） |

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

## 账户状态（2026-08-26 查询）

- 生成模式：**无限模式**（unlimited，排队、不耗积分）
- 可用图片模型：GPT Image 2 / 1.5、Midjourney、Nano Banana / 2 / Pro、Seedream 4 / 4.5
- 已有项目 2 个，活跃项目：`2e637ab783934655b86e0fe33617fa4f`（16 game item icons）
- 最近会话：`465afa13-068b-4e9d-8a08-9f96781ca310`（游戏物品图标，2026-08-26）

## 凭据

- 已写入用户级环境变量 `LOVART_ACCESS_KEY` / `LOVART_SECRET_KEY`（官方推荐做法，
  新终端 / OpenClaw 可直接使用）
- 本地状态文件：`~/.lovart/state.json`（项目、会话历史）

## 参考

- 官方指南：https://lovart.notion.site/Lovart-OpenClaw-User-Guide-33da46b16a0f80f6a7fff8e4896b9fca
- Skill 仓库：https://github.com/lovartai/lovart-skill
