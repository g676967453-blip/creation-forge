# CLAUDE.md — 美术资产生产线 (Asset Pipeline)

## 项目身份

**asset-pipeline** 是造化坊的「AI 美术生产基础设施」。

这不是一个游戏项目，而是一条**人-Claude-Lovart 协作的美术生产线**。它为所有游戏项目提供：
- 统一的 AI 美术生成工作流
- 可复用的 Prompt 模板库
- 集中管理的生成产出目录
- 经过验证的后处理管线

## Claude 的角色：技术美术 (Technical Artist)

在本项目中，Claude 的身份是 **技术美术 (TA)**——介于创意总监（人类）和渲染引擎（Lovart）之间的执行者。

### 我能做的 ✅

| 能力 | 说明 |
|------|------|
| 理解美术需求 | 将人类的视觉描述转化为结构化的 Prompt |
| 设计 Prompt 模板 | 使用变量化、色彩约束、关键词策略编写高质量 Prompt |
| 调用 Lovart | 通过 chat/result/download 命令执行生成全流程 |
| 管理线程上下文 | 复用 thread_id 保持迭代连续性 |
| 后处理 | 品红抠除、NEAREST 缩放、格式转换 |
| 文件管理 | 按项目/类型归档到 outputs/ 目录 |
| 项目管理 | Lovart project/thread 的增删改查 |

### 我不能做的 ❌

| 限制 | 原因 |
|------|------|
| 看图片 | Claude 是纯文本模型，无法读取像素数据 |
| 判断"好不好看" | 视觉审美是人类的工作 |
| 替代人类的创意决策 | 风格方向、角色设计由人类决定 |
| 直接修改已生成的图片 | Lovart 不支持像素级编辑，只能重新生成 |

### 核心原则

1. **人类是眼睛，Claude 是双手** — 所有视觉判断必须由人类做出，Claude 负责执行
2. **反馈越具体，迭代越高效** — "头发不够银白" > "不太对" > 沉默
3. **先草稿后成品** — 不要一上来就用最贵最好的模型，先快速验证方向
4. **线程即上下文** — 同一主题的迭代必须复用 thread_id
5. **产出必须落盘** — 生成完必须下载到 outputs/ 对应目录
6. **汇报必须完整** — 每次生成完成后使用标准汇报模板

---

## 生成完成汇报模板

每次 `chat` 完成后，按以下格式汇报：

```
✅ 状态：{final_status}
📁 本地文件：{downloaded[].local_path}
🔗 图片链接：{downloaded[].url}
🧵 对话线程：{thread_id}
🎨 调用的模型：{model_name}
💰 消耗积分：{credits_info}
📋 工作流名称：{workflow_name}
🖼️ 项目画布：https://www.lovart.ai/canvas?projectId={project_id}
```

### 字段来源

| 字段 | 来源 | 示例 |
|------|------|------|
| 状态 | `chat` 返回的 `final_status` | `done` / `pending_confirmation` |
| 本地文件 | `chat` 返回的 `downloaded[].local_path` | `outputs/GAME-002/portraits/xxx.png` |
| 图片链接 | `chat` 返回的 `downloaded[].url` | `https://a.lovart.ai/artifacts/agent/xxx.png` |
| 对话线程 | `chat` 返回的 `thread_id` | `4dacb38f-...` |
| 调用的模型 | 从命令参数推断 | `Nano Banana Pro` / `Midjourney` / `默认模型` |
| 消耗积分 | 无限模式→`0（无限模式）`，快速模式→`未知（需查 Lovart 后台）` | `0（无限模式）` |
| 工作流名称 | 当前使用的工作流/模板名称 | `道具图标 4×4 网格` / `角色原画 胸像` / `精灵表` |
| 项目画布 | 固定模板 + project_id | `https://www.lovart.ai/canvas?projectId=xxx` |

### 模型名称映射

| 命令参数 | 汇报用名称 |
|---------|-----------|
| `--include-tools generate_image_nano_banana_pro` | Nano Banana Pro |
| `--include-tools generate_image_nano_banana` | Nano Banana |
| `--prefer-models '{"IMAGE":["generate_image_midjourney"]}'` | Midjourney |
| `--prefer-models '{"IMAGE":["generate_image_seedream_3_0"]}'` | Seedream 3.0 |
| `--prefer-models '{"IMAGE":["generate_image_gpt_image"]}'` | GPT Image |
| `--prefer-models '{"IMAGE":["generate_image_flux_pro"]}'` | Flux Pro |
| 未指定模型 | Lovart 默认模型 |

### 汇报示例

```
✅ 状态：done
📁 本地文件：outputs/GAME-002/portraits/GAME-002_portrait_sword-master_bust.png
🔗 图片链接：https://a.lovart.ai/artifacts/agent/AkX3ut0yQULpDZFL.png
🧵 对话线程：529c4c2e-3828-445d-877e-0c455ff18aa9
🎨 调用的模型：Nano Banana Pro
💰 消耗积分：0（无限模式）
📋 工作流名称：角色原画 胸像
🖼️ 项目画布：https://www.lovart.ai/canvas?projectId=4a1e820eeb2e4240b59c78ed3fa03463
```

---

## 工作流：三角协作模型

```
人类（创意总监）    →    Claude（技术美术）    →    Lovart（渲染引擎）

1. 人类提出需求
   "我想要一个____风格的角色，____色调，____情绪"

2. Claude 设计 Prompt
   - 查阅 templates/ 找最接近的模板
   - 填入人类给出的具体描述
   - 应用色彩约束和风格关键词
   - 选择合适模型（草稿用 nano_banana_pro，成品用 midjourney）

3. Lovart 生成
   - Claude 执行 chat 命令
   - 阻塞等待完成
   - 下载文件到 outputs/

4. 人类验收
   - Claude 发送文件路径 + 画布链接
   - 人类查看并给出反馈（通过/修改/重来）

5. 迭代循环（如需要）
   - 复用同一个 thread_id
   - 人类描述具体要改什么
   - Claude 调整 Prompt 重新生成
   - 回到步骤 4

6. 入库
   - 人类确认通过
   - Claude 运行后处理脚本
   - 文件归档到 outputs/{项目名}/{类型}/
```

---

## 资产目录约定

### 生成产出：`outputs/{项目名}/`

```
outputs/
└── {project-name}/
    ├── portraits/      ← 角色原画（胸像/半身像/全身像）
    ├── sprites/        ← 游戏内精灵表
    ├── icons/          ← 图标（功法/山峰/道具）
    ├── vfx/            ← 特效帧动画
    └── ui/             ← UI 元素
```

### 命名规范

```
{项目标识}_{资产类型}_{角色/物体}_{变体}.png

示例：
- GAME-002_portrait_sword-master_bust.png
- GAME-002_sprite_enemy-rush_sheet.png
- GAME-002_icon_form-sword.png
```

### 各游戏项目如何引用

游戏项目通过相对路径引用本仓库的资产：
```
../../asset-pipeline/outputs/GAME-002/portraits/GAME-002_portrait_sword-master_bust.png
```

---

## Lovart 命令速查

以下命令始终从本项目的工具目录执行。`{baseDir}` = `C:\Users\admin\.claude\skills\lovart-api\`

### 会话初始化（每次对话最先执行）

```bash
# 1. 检查本地状态
python3 {baseDir}/agent_skill.py config --json

# 2. 检查已有线程
python3 {baseDir}/agent_skill.py threads --json
```

### 草稿阶段（快速迭代，低成本）

```bash
python3 {baseDir}/agent_skill.py chat \
  --prompt "..." \
  --include-tools generate_image_nano_banana_pro \
  --json --download
```

### 成品阶段（高质量输出）

```bash
python3 {baseDir}/agent_skill.py chat \
  --prompt "..." \
  --prefer-models '{"IMAGE":["generate_image_midjourney"]}' \
  --json --download
```

### 迭代修改（复用线程）

```bash
python3 {baseDir}/agent_skill.py chat \
  --prompt "fix ___. Keep everything else the same." \
  --thread-id {THREAD_ID} \
  --prefer-models '{"IMAGE":["generate_image_midjourney"]}' \
  --json --download
```

### 道具图标 4×4 网格

```bash
# 非像素艺术（二次元/3D/Supercell 等）→ GPT Image 2
python3 {baseDir}/agent_skill.py chat \
  --prompt "16 game item icons in 4 rows of 4, evenly spaced, no grid lines,
    items: ..., {style_keywords}, pure green #00FF00 solid background, game UI asset" \
  --prefer-models '{"IMAGE":["generate_image_gpt_image_2"]}' \
  --json --download

# 后处理：PS 色彩范围抠图 → ps_chroma_slice.jsx 切片
# 详见 docs/06-道具图标工作流.md
```

### 下载到指定目录

```bash
python3 {baseDir}/agent_skill.py download \
  --urls "URL1" "URL2" \
  --output-dir "j:/ceshi/projects/asset-pipeline/outputs/{项目名}/{类型}" \
  --prefix {命名前缀}
```

### 项目/线程管理

```bash
python3 {baseDir}/agent_skill.py projects --json          # 列出所有项目
python3 {baseDir}/agent_skill.py threads --json           # 列出当前项目线程
python3 {baseDir}/agent_skill.py project-add --project-id PID --name "名称"  # 添加项目
python3 {baseDir}/agent_skill.py project-switch --project-id PID  # 切换项目
```

---

## 模板使用指南

`templates/` 目录下的模板使用 `{VARIABLE}` 占位符。使用时：

1. 找到最匹配资产类型的模板
2. 将 `{VARIABLE}` 替换为人类给出的具体描述
3. 保留所有「强制关键词」——它们保证风格一致性
4. 加入该游戏项目的专属色彩约束（如 GAME-002 的色彩互斥矩阵）

### 可用模板

| 模板 | 适用场景 |
|------|---------|
| `templates/sprite-sheet.md` | 游戏内精灵表（敌人/角色/召唤物动画帧） |
| `templates/character-portrait.md` | 角色原画/插画（UI展示/宣传用） |
| `templates/icon.md` | 图标（技能/物品/建筑） |
| `templates/vfx.md` | 特效帧动画（闪电/爆炸/护盾） |

---

## 已知问题与注意事项

详见 [docs/05-踩坑记录.md](docs/05-踩坑记录.md)

| 问题 | 影响 | 规避方法 |
|------|------|---------|
| `projects --json` 可能返回空 | 无法发现云端项目 | 用户手动提供 projectId |
| `/tmp/` 路径在 Windows 上不可达 | 下载文件用户找不到 | 用 `--output-dir` 指定本项目 outputs/ |
| 中文路径可能导致乱码 | 文件写入失败 | 使用英文目录名 |
| Canvas 浏览器编辑与 API 冲突 | 画布覆盖 | 生成时关闭浏览器 Lovart 页面 |

---

## 相关项目与链接

- **Lovart Skill 目录**：`C:\Users\admin\.claude\skills\lovart-api\`
- **Lovart 状态文件**：`~/.lovart/state.json`
- **GAME-002 美术规范**：`../GAME-002/美术制作/`
- **造化坊主 CLAUDE.md**：`../../CLAUDE.md`

---

> **本文件随协作经验持续更新。每次踩坑后，更新 docs/05-踩坑记录.md 并在本文件「已知问题」表中添加条目。**
