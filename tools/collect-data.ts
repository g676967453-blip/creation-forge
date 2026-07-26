/**
 * 造化坊数据采集模块
 * 被 generate-dashboard.ts 和 dashboard-server.ts 共用
 */
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");

export function listWorks(): string[] {
  const d = path.join(ROOT, "works");
  try { return fs.readdirSync(d).filter(f => f.endsWith(".md") && f !== "README.md" && f !== "_template.md").sort().reverse(); }
  catch { return []; }
}

export function autoDesc(filename: string): string {
  try {
    const c = fs.readFileSync(path.join(ROOT, "works", filename), "utf-8");
    const m = c.match(/^#\s*(?:\[[\d-]+\]\s*)?(.+)/m);
    if (m) return m[1].trim().replace(/^[\d-]+\s*/, "");
  } catch {}
  return "—";
}

export function countFiles(dir: string): number {
  try { return fs.readdirSync(dir).filter(f => !f.startsWith(".")).length; }
  catch { return 0; }
}

/** 递归统计 SKILL 文件 */
export function countSkills(skillsDir: string): { total: number; standard: number; flat: number } {
  let standard = 0, flat = 0;
  try {
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith(".")) continue;
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          if (fs.existsSync(path.join(full, "SKILL.md"))) { standard++; walk(full); }
          else walk(full);
        } else if (f.endsWith(".md") && !f.startsWith("_") && f !== "README.md") {
          flat++;
        }
      }
    };
    walk(skillsDir);
  } catch {}
  return { total: standard + flat, standard, flat };
}

export function gitLog(count: number): { date: string; msg: string; hash: string }[] {
  try {
    const out = execSync(`git log --oneline -${count} --format="%ad|%s|%h" --date=short`, { cwd: ROOT, timeout: 3000 }).toString().trim();
    return out.split("\n").map(line => { const [date, msg, hash] = line.split("|"); return { date, msg, hash }; });
  } catch { return []; }
}

export function gitCommitCount(): number {
  try { return parseInt(execSync("git rev-list --count HEAD", { cwd: ROOT, timeout: 3000 }).toString().trim(), 10) || 0; }
  catch { return 0; }
}

export function writeLog(date: string, title: string, problem: string, ai: string, output: string, project: string): string {
  const md = `# [${date}] ${title}

---

## 📋 问题解决日志

### 遇到了什么

${problem}

### AI 怎么协作的

${ai}

### 产出结果

${output}

### 关联项目

${project}
`;
  const filename = date + "-" + title.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").substring(0, 40) + ".md";
  const filepath = path.join(ROOT, "works", filename);
  fs.writeFileSync(filepath, md, "utf-8");
  return filename;
}

export interface SkillInfo {
  name: string;
  type: "标准" | "扁平";
  path: string;
  description: string;
  difficulty: string;
  linkedWorkflow?: string;
}

/** 从 SKILL.md 文件中提取 YAML frontmatter 中的 description 和 difficulty */
function parseSkillMetadata(filePath: string): { description: string; difficulty: string } {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // 匹配 --- 之间的 YAML frontmatter（兼容 \r\n 和 \n）
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) return { description: "", difficulty: "" };
    // 提取 description（> 折叠标量的第一行有效文本）
    const descMatch = fm[1].match(/^description:\s*>\s*\r?\n(\s{2,}.+)/m);
    const description = descMatch ? descMatch[1].trim() : "";
    // 提取 difficulty
    const diffMatch = fm[1].match(/^\s+difficulty:\s*(\w+)/m);
    const difficulty = diffMatch ? diffMatch[1] : "";
    return { description, difficulty };
  } catch {
    return { description: "", difficulty: "" };
  }
}

/**
 * 扫描 .claude/skills/ 目录，收集所有 SKILL
 * 标准 SKILL：目录内有 SKILL.md，解析其 frontmatter
 * 扁平 SKILL：独立 .md 文件
 */
export function listSkills(skillsDir: string): SkillInfo[] {
  const skills: SkillInfo[] = [];
  try {
    const walk = (dir: string, basePath: string) => {
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith(".")) continue;
        const full = path.join(dir, f);
        const rel = path.join(basePath, f).replace(/\\/g, "/");
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            if (fs.existsSync(path.join(full, "SKILL.md"))) {
              const meta = parseSkillMetadata(path.join(full, "SKILL.md"));
              skills.push({ name: f, type: "标准", path: rel + "/", description: translateDescription(f, meta.description), difficulty: meta.difficulty });
            } else {
              walk(full, rel);
            }
          } else if (f.endsWith(".md") && !f.startsWith("_") && f !== "README.md") {
            const name = f.replace(/\.md$/, "");
            const meta = parseSkillMetadata(full);
            skills.push({ name, type: "扁平", path: rel, description: translateDescription(name, meta.description), difficulty: meta.difficulty });
          }
        } catch {}
      }
    };
    walk(skillsDir, ".claude/skills");
  } catch {}
  return skills;
}

/** 检测 SKILL 与工作流的关联 */
export function linkSkillToWorkflow(skillName: string): string | undefined {
  const map: Record<string, string> = {
    "git-commit": "Git-提交推送",
    "new-post": "小红书-制作帖子",
    "sync-report": "汇报说明书同步",
    "item-icon": "道具图标-生产",
  };
  return map[skillName];
}

/** SKILL 用途中文翻译（仪表盘展示用，不修改原始 SKILL.md） */
const SKILL_DESC_ZH: Record<string, string> = {
  // godot/ — Godot 引擎
  "godot-2d-movement": "2D 角色移动：CharacterBody2D、move_and_slide、平台跳跃、俯视角八向移动、斜坡处理",
  "godot-3d-essentials": "3D 基础入门：场景搭建、摄像机、光照、网格导入、基础 3D 物理",
  "godot-animation": "动画系统：AnimationPlayer、AnimationTree、骨骼动画、混合空间、Tween 补间",
  "godot-audio": "音频系统：AudioStreamPlayer、总线路由、分贝控制、音效变体、节拍同步",
  "godot-csharp": "C# 脚本：.NET 集成、Signal 绑定、GodotObject 派生、与 GDScript 互调",
  "godot-export": "导出发布：Windows/macOS/Linux/Web/Android/iOS 平台打包、图标、签名",
  "godot-gdscript": "GDScript 语言：类型注解、Signal、await 协程、lambda、数组操作、2.0 迁移",
  "godot-multiplayer": "多人联机：RPC、权威服务器、网络同步、ENet/WebSocket、延迟补偿",
  "godot-nodes-scenes": "节点与场景：Node 生命周期、场景树、实例化、PackedScene、owner 关系",
  "godot-physics": "物理系统：RigidBody、CharacterBody、碰撞层/掩码、射线检测、Area 检测",
  "godot-resources": "资源管理：Resource 类型、preload/load、.tres/.res 文件、资源引用、保存加载",
  "godot-shaders": "着色器：ShaderMaterial、canvas_item/spatial/particles 着色器、uniform、顶点/片元",
  "godot-signals-groups": "信号与分组：自定义 Signal、Callable、Group 调用、场景通信模式",
  "godot-tilemap": "瓦片地图：TileMapLayer、TileSet、自动瓦片、图案编辑、层级管理",
  "godot-ui-control": "UI 控件：Control 节点、容器布局、主题/样式、响应式、Control 与 2D 世界混合",
  // web-engines/ — Web 游戏引擎
  "phaser-arcade-physics": "Phaser 街机物理：启用世界、给精灵加物理体、速度/加速度、碰撞回调、Arcade 限制",
  "phaser-core": "Phaser 3 核心：Game 配置、Scene 生命周期、资源加载、跨场景数据传递、摄像机跟随",
  "pixijs-rendering": "PixiJS 渲染：Application 初始化、容器/精灵/图形、DisplayObject 层级、批处理优化",
  "threejs-gltf-loading": "Three.js GLTF 加载：GLTFLoader、模型导入、材质映射、动画剪辑、Draco 压缩",
  "threejs-materials-lighting": "Three.js 材质与光照：PBR 材质、环境光/方向光/点光源、阴影映射、HDR 环境贴图",
  "threejs-scene-setup": "Three.js 场景搭建：importmap 配置、Scene+Camera+Renderer 三板斧、动画循环、响应式、OrbitControls",
  // disciplines/ — 游戏开发学科（引擎无关）
  "audio-design": "游戏音频设计：总线/混音器架构、分贝增益、侧链闪避、音效变体、节拍同步、自适应音乐",
  "camera-systems": "摄像机系统：跟随目标、视差滚动、震屏效果、边界限制、多摄像机切换",
  "dialogue-systems": "对话系统：对话树、分支选项、条件判断、本地化、对话历史、角色头像",
  "game-ai": "游戏 AI：有限状态机(FSM)、行为树(BT)、寻路(A*)、转向行为(seek/arrive/避障)",
  "game-feel": "游戏手感：屏幕震动、暂停/缓冲帧、音效/粒子反馈、变速、缓慢时间、Coyote 时间",
  "game-ui-ux": "游戏 UI/UX：HUD 布局、菜单流程、响应式设计、手柄适配、字体/色彩/缩放",
  "input-systems": "输入系统：键盘/鼠标/手柄映射、Input Map、动作缓冲、输入重映射、死区处理",
  "level-design": "关卡设计：灰盒搭建、引导线、节奏曲线、安全区/挑战区、流程测试、迭代反馈",
  "performance-optimization": "性能优化：Draw Call 合批、LOD、对象池、纹理压缩、Profiler 定位瓶颈、帧预算",
  "physics-tuning": "物理调优：碰撞形状选择、物理层/掩码、刚体插值、Continuous CD、物理步长、接触点读写",
  "procedural-gen": "程序化生成：噪声函数、柏林噪声、分形叠加、Marching Squares、Wave Function Collapse",
  "save-systems": "存档系统：JSON/Resource 序列化、自动存档、多槽位、版本迁移、云存档接口",
  "shader-programming": "着色器编程：顶点/片元着色器、噪声、描边、溶解、全屏后处理、性能预算",
  // genres/ — 游戏类型（引擎无关）
  "card-game": "卡牌游戏：卡牌数据模型、手牌/牌库/弃牌堆区域、抽牌/洗牌、回合结构、效果结算",
  "fps-shooter": "FPS 射击：第一人称控制、射击线检测、弹道散布、后坐力、换弹、伤害计算",
  "platformer": "平台跳跃：跑/跳物理、Coyote 时间/跳跃缓冲、可变跳高、单面平台、墙角修正",
  "puzzle": "解谜游戏：规则定义、线索系统、难度曲线、重置机制、成就判定",
  "roguelike": "Roguelike：程序化地图、永久死亡、回合制/即时行动、道具协同(Build)、meta 升级",
  "rpg": "RPG 角色扮演：属性/等级/装备系统、对话树、任务日志、背包、商店、技能树",
  "survival-crafting": "生存建造：资源收集、合成配方、建筑系统、饥饿/耐久消耗、昼夜循环",
  "tower-defense": "塔防：路径/路线系统、塔位/升级、敌人波次、经济平衡、范围/射速/伤害三要素",
  "visual-novel": "视觉小说：对话脚本、角色立绘、背景切换、分支选择、CG 画廊、存档/读档",
  // workflows/ — 开发流程
  "game-jam": "Game Jam 流程：按倒计时锁范围、48h/72h/1周预算表、特征筛选决策树、提交前检查清单",
  "itch-publish": "itch.io 发布：页面设置、截图/GIF、定价/免费、标签、devlog、更新推送",
  "prototype-fast": "快速原型：原型简报模板、终止判断规则、隔离策略（prototypes/ 目录）、1 小时内验证核心假设",
  "steam-publish": "Steam 发布：Steamworks 配置、商店页面、成就/统计 API、测试分支、Early Access 策略",
  // 项目自定义扁平 SKILL
  "git-commit": "Git 提交推送：检查变更 → 生成约定式提交 → 确认 → commit → push 到远程仓库",
  "new-post": "小红书帖子制作：works/ 选材 → 文案撰写 → HTML 排版 → Pixso 设计 → 发布",
  "sync-report": "汇报说明书同步：检查数据源 → 更新脚本 → 生成 HTML 仪表盘",
  "item-icon": "游戏道具图标生产：道具清单 → Lovart AI 生成 → Photoshop 抠图 → 切片输出",
  "libtv": "LibTV 媒体生产集成：视频/音频/AI 内容生成，含命令、示例、模型 schema、节点类型",
  "router": "SKILL 路由引擎：根据用户请求匹配并路由到正确的游戏开发 SKILL",
};

function translateDescription(name: string, fallback: string): string {
  if (SKILL_DESC_ZH[name]) return SKILL_DESC_ZH[name];
  return fallback;
}

export function collectData() {
  const today = new Date().toLocaleDateString("zh-CN");
  const worksFiles = listWorks();
  const worksData = worksFiles.map(f => ({ date: f.substring(0, 10), file: f, desc: autoDesc(f) }));
  const gitCommits = gitLog(5);
  const commitCount = gitCommitCount();
  const skillsCount = countSkills(path.join(ROOT, ".claude/skills"));
  const skillCount = skillsCount.total;
  const workflowCount = countFiles(path.join(ROOT, "docs/workflows"));
  const guideCount = countFiles(path.join(ROOT, "docs/tool-guides"));

  const projects = [
    { name: "GAME-002「开仙门」", engine: "Godot 4.7", status: "active", statusText: "活跃", progress: "V0.1 ~40%", output: "闭环完整+MCP在线+5层防御+15波+6功法+35/93任务✅+文档审计修复", blocker: "待祝福3选1UI+弟子接入主循环+旧模块删除" },
    { name: "小红书自媒体", engine: "HTML/CSS + Pixso", status: "active", statusText: "活跃", progress: "14 期帖子", output: "post-13/14 + 目录扁平化", blocker: "—" },
    { name: "asset-pipeline", engine: "Lovart + Photoshop", status: "active", statusText: "活跃", progress: "3 风格已验证", output: "道具图标工作流固化", blocker: "—" },
    { name: "tutorial/01-hello-canvas", engine: "Phaser 3.80+", status: "idle", statusText: "待机", progress: "仅骨架", output: "—", blocker: "优先级低" },
    { name: "originals / sandbox", engine: "待定", status: "empty", statusText: "空白", progress: "—", output: "—", blocker: "—" },
  ];

  const workflows = [
    { name: "Git-提交推送", version: "v1", skill: "/git-commit", project: "全局", status: "mature", category: "日常" },
    { name: "汇报说明书同步", version: "v1", skill: "/sync-report", project: "全局", status: "mature", category: "日常" },
    { name: "改进追踪", version: "v1", skill: "—", project: "全局", status: "ongoing", category: "日常" },
    { name: "小红书-制作帖子", version: "v2", skill: "/new-post", project: "小红书", status: "mature", category: "业务工作流" },
    { name: "Pixso-导入操作", version: "v1", skill: "—", project: "小红书", status: "mature", category: "业务工作流" },
    { name: "道具图标-生产", version: "v1", skill: "待建", project: "asset-pipeline", status: "mature", category: "业务工作流" },
    { name: "GAME002-UI制作", version: "v2", skill: "待建", project: "GAME-002", status: "mature", category: "业务工作流" },
    { name: "GAME002-UI层命名规范", version: "v2", skill: "—", project: "GAME-002", status: "mature", category: "业务工作流" },
    { name: "GAME002-功能开发", version: "v1", skill: "待建", project: "GAME-002", status: "testing", category: "业务工作流" },
    { name: "游戏制作流水线", version: "v1", skill: "待建", project: "全局", status: "ongoing", category: "业务工作流" },
  ];

  // 采集 SKILL 数据
  const skillsDir = path.join(ROOT, ".claude/skills");
  const skillsRaw = listSkills(skillsDir);
  const skills = skillsRaw.map(s => ({ ...s, linkedWorkflow: linkSkillToWorkflow(s.name) }));

  const tasks = [
    { id: "1", status: "done", statusText: "✅ 已完成", cat: "核心理念", task: "创建宣言文档 (manifesto.md)", note: "2026-07-15" },
    { id: "2", status: "done", statusText: "✅ 已完成", cat: "核心理念", task: "重构 README + CLAUDE.md + 三层管理体系", note: "2026-07-23" },
    { id: "3", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "工作流管理体系（双层 10 文档 + 3 SKILL）", note: "docs/workflows/ + .claude/skills/" },
    { id: "4", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "工具知识库（7 文档）", note: "docs/tool-guides/" },
    { id: "5", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "汇报体系 + HTML 仪表盘上线", note: "仪表盘服务器 + 动态交互" },
    { id: "6", status: "done", statusText: "✅ 已完成", cat: "自媒体", task: "小红书素材库 14 期 + /new-post SKILL", note: "07-15 → 07-23" },
    { id: "12", status: "done", statusText: "✅ 已完成", cat: "项目", task: "GAME-002 V0.1 8项设计决策确认", note: "X19混合策略+X5胜负+X7祝福池+X9挂件+X12精英+X13/X14/X18（07-26）" },
    { id: "13", status: "done", statusText: "✅ 已完成", cat: "项目", task: "GAME-002 Phase 0-3：代码清理+架构+集成+数据", note: "删除22废弃文件+7新模块+6弟子18祝福6法宝+MCP验证通过（07-26）" },
    { id: "14", status: "done", statusText: "✅ 已完成", cat: "项目", task: "GAME-002 全面诊断（架构/代码/性能/MCP）", note: "godot-master框架+源码静态分析+CSV交叉验证（07-26）" },
    { id: "15", status: "done", statusText: "✅ 已完成", cat: "项目", task: "GAME-002 118份文档审计+6矛盾修复", note: "数值总览+CODE_WIKI+GDD+协作规则修复+3新V0.1规格（07-26）" },
    { id: "16", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "仪表盘数据同步+路线图/任务表清理", note: "35/93任务✅+30归档标记+统计刷新+V0.1决策进度标注（07-26）" },
    { id: "7", status: "active", statusText: "🟢 进行中", cat: "项目", task: "GAME-002 Phase 3：旧代码删除+UI适配+完整测试", note: "Phase 0-2 已完成。祝福3选1UI+弟子接入主循环+删除旧card/summons" },
    { id: "8", status: "active", statusText: "🟢 进行中", cat: "项目", task: "asset-pipeline 资产管线运行", note: "3 风格已验证" },
    { id: "9", status: "planned", statusText: "📋 计划中", cat: "自媒体", task: "持续发布小红书内容", note: "基于 works/ 素材生产" },
    { id: "11", status: "planned", statusText: "📋 计划中", cat: "基础设施", task: "SKILL 扩展（/开发功能 /道具图标）", note: "待流程成熟" },
  ];

  const goalsUser = [
    { id: "U1", task: "小红书持续内容产出", detail: "基于 works/ 日志提炼选题，保持每周发布节奏", priority: "🟡 持续" },
    { id: "U5", task: "GAME-002 设计决策确认（9/19）✅", detail: "07-26 集中确认 Tier 1-2 共 9 项（X5/X7/X9/X12/X13/X14/X18/X19）+ Tier 3 默认值", priority: "✅ 已完成" },
    { id: "U6", task: "GAME-002 V0.1 核心架构搭建 ✅", detail: "7 新模块（SpiritSeat/Disciple/BlessingManager+3 Data类）+ GameManager 集成 + MCP 编译验证通过", priority: "✅ 已完成" },
    { id: "U7", task: "GAME-002 全面诊断 + 文档修复 ✅", detail: "godot-master框架诊断（3高优修复项）+118份文档审计（6矛盾修复+30归档标记+3新V0.1规格+验证日期刷新）", priority: "✅ 已完成" },
    { id: "U2", task: "GAME-002 Phase 3：祝福3选1UI + 弟子接入 + 旧代码删除", detail: "创建独立祝福选择面板；DiscipleSquad接入战斗循环；删除card_manager/summons/upgrades旧模块", priority: "🔴 本周" },
    { id: "U4", task: "asset-pipeline 产出 GAME-002 实际素材", detail: "道具图标管线已验证，需对接到 GAME-002 的具体需求", priority: "🟢 远期" },
  ];

  const goalsIssues = [
    { id: "I1", issue: "GAME-002 V0.1 旧代码模块待删除（card_manager/summons/upgrades）", source: "Phase 2 集成完成，旧模块仍并行运行", severity: "🟡 累积" },
    { id: "I2", issue: "GAME-002 祝福选择 UI 仍复用旧卡牌面板（需独立面板）", source: "Phase 2 用卡牌面板桥接显示祝福，UI 体验待优化", severity: "🟡 累积" },
    { id: "I7", issue: "CODE_WIKI.md 已更新 V0.0→V0.1 过渡状态，数值总览已同步 CSV", source: "07-26 文档修复完成（1/3轮），第三轮归档标注待补充", severity: "🟢 跟踪" },
    { id: "I3", issue: "tutorial 教程线 0% —— hello-canvas 仅骨架无代码", source: "项目扫描，5% 完成度", severity: "🟢 远期" },
    { id: "I4", issue: "shared/assets/ 全部空 —— fonts/audio/sprites 仅 .gitkeep", source: "文件扫描 07-23", severity: "🟢 远期" },
    { id: "I5", issue: "docs/en/ 14:1 严重不同步 —— 仅 README 无实际文档", source: "文档审计 07-23", severity: "🟢 远期" },
    { id: "I6", issue: "Git push 不稳定 —— 依赖 HTTPS，偶发 timeout/reset", source: "07-23 复盘，#5 SSH 未配置", severity: "🟡 便利性" },
  ];

  const goalsAI = [
    { id: "A1", suggestion: "Phase 3：清理旧代码 + UI 适配", detail: "删除 card_manager/summons/upgrades 等旧模块；创建独立祝福选择面板。完成后 V0.1 架构干净可测试。", priority: "🔴 优先" },
    { id: "A2", suggestion: "手动跑通完整一局", detail: "在 Godot 编辑器中测试 经营→战斗→结算 闭环。7 个新模块已通过 MCP 编译验证，需 gameplay 级验证。", priority: "🔴 优先" },
    { id: "A3", suggestion: "小红书保持节奏，不追求完美", detail: "14 期存量足够，按 /new-post 流程持续产出即可。重点从数量转向质量 —— 每期一个真问题。", priority: "🟡 建议" },
    { id: "A4", suggestion: "教程线推迟到主线稳定后", detail: "当前重心是 GAME-002 + 小红书 + asset-pipeline 三条线。教程线等至少一条主线进入稳定期再启动。", priority: "🟢 远期" },
  ];

  const toolGuides = [
    { tool: "Git", intro: "01-git-intro.md", ops: "02-git-operations.md", collab: "03-git-human-ai-collab.md", desc: "分布式版本控制系统", docs: 3 },
    { tool: "GitHub", intro: "01-github-intro.md", ops: "02-github-operations.md", collab: "03-github-human-ai-collab.md", desc: "代码托管与协作平台", docs: 3 },
    { tool: "Pixso", intro: "—", ops: "—", collab: "—", desc: "UI 设计工具（待补充）", docs: 0 },
    { tool: "Claude Code Skills", intro: "game-dev-skills.md", ops: "—", collab: "—", desc: `标准 ${skillsCount.standard} + 扁平 ${skillsCount.flat} = ${skillsCount.total} 个技能（Godot/Phaser/Three.js 等）`, docs: skillsCount.total },
    { tool: "Claude Code 配置", intro: "—", ops: ".claude/settings.json", collab: "CLAUDE.md", desc: "权限/hooks/MCP/记忆", docs: 4 },
  ];

  const assets = [
    { layer: "系统层", name: "CLAUDE.md", path: "CLAUDE.md", desc: "AI 行为规范（项目入口）" },
    { layer: "系统层", name: "docs/workflows/", path: "docs/workflows/", desc: "标准化工作流（9 文档）" },
    { layer: "系统层", name: "docs/tool-guides/", path: "docs/tool-guides/", desc: "工具知识库" },
    { layer: "系统层", name: ".claude/skills/", path: ".claude/skills/", desc: "可执行 SKILL 命令" },
    { layer: "系统层", name: "works/", path: "works/", desc: "工作日志（一事一记）" },
    { layer: "系统层", name: "reports/", path: "reports/", desc: "汇报仪表盘" },
    { layer: "项目层", name: "GAME-002「开仙门」", path: "projects/GAME-002/", desc: "Godot 修仙 Roguelike 塔防" },
    { layer: "项目层", name: "小红书自媒体", path: "projects/xiaohongshu/", desc: "AI 协作内容创作" },
    { layer: "项目层", name: "asset-pipeline", path: "projects/asset-pipeline/", desc: "游戏道具图标资产管线" },
    { layer: "项目层", name: "tutorial/", path: "projects/tutorial/", desc: "教程项目" },
    { layer: "—", name: "GitHub", path: "https://github.com/g676967453-blip/creation-forge", desc: "远程仓库" },
  ];

  const external = [
    { cat: "设计工具", name: "Pixso (MCP)", addr: "http://127.0.0.1:3667/mcp", desc: "UI 设计工具" },
    { cat: "代码仓库", name: "GitHub", addr: "main 分支 / g676967453-blip/creation-forge", desc: "远程仓库" },
    { cat: "自媒体", name: "小红书", addr: "projects/xiaohongshu/", desc: "14 期帖子，/new-post SKILL" },
  ];

  return {
    today, worksData, gitCommits, commitCount,
    skillCount, skillStandard: skillsCount.standard, skillFlat: skillsCount.flat,
    workflowCount, guideCount, worksCount: worksFiles.length,
    projects, workflows, skills, tasks, goalsUser, goalsIssues, goalsAI,
    toolGuides, assets, external,
  };
}
