# 🎮 游戏开发 AI 技能包使用说明

> **技能来源：** [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) v1.1.0
> **安装日期：** 2026-07-23
> **许可证：** Apache-2.0
> **安装位置：** `.claude/skills/`

---

## 一、这是什么

**游戏开发 AI 技能包** 是一套预置在项目中的「能力说明书」，共 48 个。当你向 AI 提出游戏开发相关需求时，AI 会自动加载对应的技能，从而：

- **写出符合引擎规范的代码**（比如 Godot 4.x 的 GDScript 2.0 语法，而不是 3.x 的旧写法）
- **遵循行业最佳实践**（比如 Phaser 的场景生命周期、物理引擎的正确用法）
- **理解特定游戏类型的模式**（比如 Roguelike 的程序生成、平台跳跃的移动物理）

> 类比：就像 AI 在帮你写 Godot 代码前，会先"翻一下 Godot 官方文档的速查表"。

---

## 二、怎么用

### 核心原则：你不需要手动选择技能

技能包里有一个**主路由器（Router）**，它会自动做三件事：

1. **检测你的引擎** —— 看到 `project.godot` 就知道是 Godot，看到 `package.json` 里有 `phaser` 就知道是 Phaser
2. **识别你的任务** —— "加个二段跳" → 2D 移动 + 平台跳跃；"做存档系统" → 存档系统
3. **只加载需要的技能** —— 不会把所有 48 个技能都塞进去，只加载相关的 2-3 个

### 使用示例

| 你对 AI 说 | Router 自动加载 |
|---|---|
| "给我的 Godot 玩家加个二段跳" | `godot-2d-movement` + `platformer` |
| "做一套 Godot 的 UI 界面" | `godot-ui-control` + `game-ui-ux` |
| "设计一个程序生成的地牢 Roguelike" | `godot-tilemap` + `procedural-gen` + `roguelike` |
| "帮我在 Phaser 里实现物理碰撞" | `phaser-core` + `phaser-arcade-physics` |
| "怎么做存档系统" | `save-systems` |
| "给游戏加背景音乐和音效" | `audio-design` + `godot-audio`（如果在 Godot 项目中） |
| "实现对话系统" | `dialogue-systems` |
| "优化游戏性能" | `performance-optimization` |
| "导出 Godot 游戏到 Web" | `godot-export` |
| "我想参加 Game Jam，帮我快速搭原型" | `prototype-fast` + `game-jam` |
| "发布到 itch.io" | `itch-publish` |

### 你应该怎样描述需求

**❌ 不好：** "帮我写个技能"（太模糊，Router 无法识别）

**✅ 好的：** "在我的 Godot 项目中加一个会巡逻的敌人 NPC"（引擎 + 任务都明确）

关键是让 Router 能识别出两个信息：**你在哪个引擎里做事 + 你要做什么**。

---

## 三、技能完整目录

### 🔀 主路由器（1 个）

| 技能名 | 说明 |
|---|---|
| `router` | 自动检测引擎和任务类型，按需加载对应技能。一切游戏开发需求的入口 |

### 🎮 Godot 引擎（15 个）

| 技能名 | 说明 | 难度 |
|---|---|---|
| `godot-gdscript` | GDScript 语法规范：静态类型、生命周期、注解、信号、await | 入门 |
| `godot-nodes-scenes` | 节点与场景系统：场景树、实例化、`@onready`、场景切换 | 入门 |
| `godot-signals-groups` | 信号与组：解耦通信、信号连接模式、组管理 | 进阶 |
| `godot-2d-movement` | 2D 移动：CharacterBody2D、速度/加速度、平台跳跃物理 | 入门 |
| `godot-tilemap` | TileMap 瓦片地图：图层、自动瓦片、地形、导航 | 进阶 |
| `godot-physics` | 物理系统：碰撞层/掩码、Area2D/3D、RigidBody、RayCast | 进阶 |
| `godot-ui-control` | UI 控件：Control 节点、容器布局、主题/样式、响应式 | 入门 |
| `godot-animation` | 动画系统：AnimationPlayer、AnimationTree、Tween、混合空间 | 进阶 |
| `godot-shaders` | 着色器：ShaderMaterial、内置变量、片段/顶点着色器 | 高级 |
| `godot-3d-essentials` | 3D 基础：3D 节点、相机、光照、网格、导入模型 | 进阶 |
| `godot-resources` | 资源管理：Resource 类型、自定义资源、预加载 vs 动态加载 | 进阶 |
| `godot-audio` | 音频：AudioStreamPlayer、总线布局、音频导入设置 | 入门 |
| `godot-multiplayer` | 多人游戏：ENet 网络、RPC、权威服务器、同步 | 高级 |
| `godot-export` | 导出打包：平台预设、图标/启动画面、纹理压缩 | 进阶 |
| `godot-csharp` | C# 支持：Godot .NET、C# API、与 GDScript 互调 | 进阶 |

### 🌐 Web 引擎（6 个）

| 技能名 | 说明 | 难度 |
|---|---|---|
| `phaser-core` | Phaser 核心：游戏配置、场景生命周期、资源加载、相机 | 入门 |
| `phaser-arcade-physics` | Phaser 街机物理：刚体、速度、碰撞器、组管理、重叠检测 | 入门 |
| `pixijs-rendering` | PixiJS 渲染：应用初始化、显示对象、容器、精灵 | 入门 |
| `threejs-scene-setup` | Three.js 场景搭建：渲染器、场景图、相机、光照基础 | 入门 |
| `threejs-materials-lighting` | Three.js 材质与光照：PBR 材质、阴影、环境贴图 | 进阶 |
| `threejs-gltf-loading` | Three.js GLTF 加载：模型导入、动画、DRACO 压缩 | 进阶 |

### 🧩 通用学科（13 个）—— 跨引擎适用

| 技能名 | 说明 |
|---|---|
| `audio-design` | 音频设计：音效分层、动态音乐、空间音频 |
| `camera-systems` | 相机系统：跟随、平滑、震屏、视角切换 |
| `dialogue-systems` | 对话系统：对话树、分支、本地化、UI 展示 |
| `game-ai` | 游戏 AI：状态机、行为树、寻路、感知系统 |
| `game-feel` | 游戏手感：屏幕震动、Hit Stop、粒子和音效反馈、缓动 |
| `game-ui-ux` | 游戏 UI/UX：HUD 设计、菜单流、手柄适配、辅助功能 |
| `input-systems` | 输入系统：Input Map、缓冲输入、手柄支持、按键重映射 |
| `level-design` | 关卡设计：引导、难度曲线、空间节奏、阻塞点 |
| `performance-optimization` | 性能优化：对象池、LOD、剔除、Draw Call、Profiling |
| `physics-tuning` | 物理调优：重力、摩擦、阻尼、时间步、确定性物理 |
| `procedural-gen` | 程序生成：噪声、波函数坍缩、L-System、地牢生成算法 |
| `save-systems` | 存档系统：序列化、多槽位、云存档、版本迁移 |
| `shader-programming` | 着色器编程：GLSL/ShaderLab 基础、后处理、全屏特效 |

### 🎯 游戏类型（9 个）—— 提供类型专属模式

| 技能名 | 说明 |
|---|---|
| `platformer` | 平台跳跃：重力、跳跃缓冲、Coyote Time、移动平台 |
| `roguelike` | Roguelike：永久死亡、随机生成、meta-progression、回合制/实时 |
| `rpg` | RPG：属性系统、装备、背包、任务、技能树 |
| `fps-shooter` | FPS 射击：第一人称控制、射击、弹道、后坐力 |
| `tower-defense` | 塔防：路径、塔位、敌人波次、升级树 |
| `card-game` | 卡牌游戏：牌组、手牌、抽牌堆、弃牌堆、效果栈 |
| `visual-novel` | 视觉小说：文本推进、分支、立绘、CG 画廊 |
| `survival-crafting` | 生存建造：采集、建造、饥饿/口渴、昼夜循环 |
| `puzzle` | 解谜：状态机、关卡状态、撤销、提示系统 |

### 🚀 工作流（4 个）

| 技能名 | 说明 |
|---|---|
| `prototype-fast` | 快速原型：最小可玩版本、占位美术、核心循环优先 |
| `game-jam` | Game Jam：限时策略、范围控制、快速迭代、48h/72h 节奏 |
| `itch-publish` | itch.io 发布：Butler 上传、页面设置、定价、Devlog |
| `steam-publish` | Steam 发布：Steamworks 配置、成就、云存档、Steam Deck 适配 |

---

## 四、它与你的关系（人机协作）

### AI 负责
- 在写代码前自动加载相关技能
- 确保代码符合引擎规范和最佳实践
- 提醒你可能遗漏的设计考量

### 你负责
- 清楚描述你要做什么（引擎 + 任务）
- 确认 AI 的理解是否正确
- 最终决策权和代码审查

### 什么时候不需要 Router
当你已经在一个明确的技术讨论中（比如已经在写 GDScript 代码），AI 会直接使用当前激活的技能，不会每次都重新路由。只有当任务**转向新领域**时（比如从"做 UI"切换到"做存档"），Router 才会重新匹配。

---

## 五、维护与更新

### 更新技能
```bash
# 当上游仓库有新版本时
npx skills update gamedev-skills/awesome-gamedev-agent-skills
```

### 当前安装信息
- **来源：** `https://github.com/gamedev-skills/awesome-gamedev-agent-skills`
- **版本：** v1.1.0（2026-06）
- **安装方式：** 通过 ghproxy 镜像 Git 克隆，手动复制到 `.claude/skills/`
- **覆盖范围：** Godot 4.3+、Phaser 3.x、Three.js、PixiJS（本项目的 Unity/Unreal 技能未安装）

---

## 六、常见问题

**Q: 为什么我的问题 AI 没有自动加载技能？**
A: 检查你的描述是否包含了引擎信息（Godot/Phaser）和任务类型。只说"帮我改代码"无法触发 Router。

**Q: 可以直接指定用某个技能吗？**
A: 可以，直接说"用 godot-gdscript 技能帮我检查这段代码"。

**Q: 技能文件在哪里？**
A: `.claude/skills/skills/` 目录下，按类别分文件夹。

**Q: 能和项目自带的技能（git-commit、new-post、update-dashboard）一起用吗？**
A: 可以，互不冲突。游戏技能以子目录形式存在，项目技能是单文件 `.md`。
