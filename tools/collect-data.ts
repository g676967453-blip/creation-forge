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
    "update-dashboard": "仪表盘更新",
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
  "new-post": "小红书帖子制作：works/ 选材 → 文案撰写 → HTML 排版 → Puppeteer 截图导出（6 PNG）→ Pixso 导入（可选）",
  "update-dashboard": "仪表盘更新：检查数据源 → 更新脚本 → 生成 HTML 仪表盘（7 页签：系统总览/项目状态/工作流/个人待办/目标计划/知识库/资产地址）",
  "item-icon": "游戏道具图标生产：道具清单 → Lovart AI 生成 → Photoshop 抠图 → 切片输出",
  "libtv": "LibTV 媒体生产集成：视频/音频/AI 内容生成，含命令、示例、模型 schema、节点类型",
  "router": "SKILL 路由引擎：根据用户请求匹配并路由到正确的游戏开发 SKILL",
};

function translateDescription(name: string, fallback: string): string {
  if (SKILL_DESC_ZH[name]) return SKILL_DESC_ZH[name];
  return fallback;
}

/** 个人待办任务项 */
export interface PersonalTask {
  id: string;
  task: string;
  status: string;
  statusText: string;
  abc: string;          // A/B/C 分类（高能要事）
  energy: string;       // 高能/中能/低能
  priority: string;
  deadline: string;
  note: string;
}

/** 归档条目 */
export interface ArchivedEntry {
  source: string;
  id: string;
  task: string;
  completedDate: string;
  hours: string;
}

/** 周度归档块 */
export interface WeeklyArchive {
  week: string;
  entries: ArchivedEntry[];
}

/** 个人待办完整数据 */
export interface PersonalTasksData {
  categories: { key: string; label: string; emoji: string; color: string; tasks: PersonalTask[] }[];
  archives: WeeklyArchive[];
  stats: { total: number; pending: number; active: number; done: number; cancelled: number; byCategory: Record<string, { pending: number; active: number; done: number }> };
}

/** 解析 docs/个人待办.md，返回结构化任务数据 */
export function loadPersonalTasks(): PersonalTasksData {
  const filePath = path.join(ROOT, "docs", "个人待办.md");
  const CATEGORY_MAP: Record<string, { key: string; label: string; emoji: string; color: string }> = {
    "🔄": { key: "R", label: "循环任务", emoji: "🔄", color: "#ff6b6b" },
    "🏢": { key: "D", label: "主美工作", emoji: "🏢", color: "#4caf50" },
    "📱": { key: "X", label: "小红书", emoji: "📱", color: "#ff9800" },
    "🎮": { key: "G", label: "游戏开发", emoji: "🎮", color: "#42a5f5" },
    "🔧": { key: "F", label: "造化坊", emoji: "🔧", color: "#ce93d8" },
  };

  const categories: PersonalTasksData["categories"] = [];
  const archives: WeeklyArchive[] = [];
  let currentCategory: PersonalTasksData["categories"][0] | null = null;
  let currentArchive: WeeklyArchive | null = null;
  let inArchive = false;
  let inTable = false;
  let tableColumns: string[] = [];
  let lineCount = 0;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      lineCount++;

      // 检测 ## 分类标题（emoji 可能是多字节字符，用 (.+?) 捕获）
      const h2Match = trimmed.match(/^## (.+?) (.+)/);
      if (h2Match) {
        inArchive = false;
        inTable = false;
        currentCategory = null;
        currentArchive = null;

        const emoji = h2Match[1];
        const catDef = CATEGORY_MAP[emoji];
        if (catDef) {
          currentCategory = { ...catDef, tasks: [] };
          categories.push(currentCategory);
        } else if (emoji === "📦") {
          inArchive = true;
        }
        continue;
      }

      // 检测 ### 周度子标题
      if (inArchive && trimmed.startsWith("### ")) {
        inTable = false;
        currentArchive = { week: trimmed.replace(/^### /, "").trim(), entries: [] };
        archives.push(currentArchive);
        continue;
      }

      // 检测表格分隔行（|---|---|）
      if (trimmed.match(/^\|[-|\s]+\|$/)) {
        inTable = true;
        continue;
      }

      // 跳过非表格行
      if (!trimmed.startsWith("|")) {
        inTable = false;
        continue;
      }

      // 解析表格行
      if (inTable) {
        const cells = trimmed
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());

        if (inArchive && currentArchive) {
          // 归档表头或数据行（来源 | ID | 任务 | 完成日 | 耗时评估）
          if (cells.length >= 3 && cells[1] && cells[1] !== "ID") {
            currentArchive.entries.push({
              source: cells[0] || "",
              id: cells[1] || "",
              task: cells[2] || "",
              completedDate: cells[3] || "",
              hours: cells[4] || "",
            });
          }
        } else if (currentCategory) {
          // 分类表头：ID | 任务 | 状态 | 优先级 | 截止日 | 备注
          if (cells[0] === "ID") {
            tableColumns = cells;
            continue;
          }
          // 数据行
          if (cells.length >= 3 && cells[0] && cells[0] !== "ID") {
            const statusRaw = cells[2] || "";
            const statusText = statusRaw;
            let status: string;
            if (statusRaw.includes("待办")) status = "pending";
            else if (statusRaw.includes("进行中")) status = "active";
            else if (statusRaw.includes("完成")) status = "done";
            else if (statusRaw.includes("取消")) status = "cancelled";
            else status = "pending";

            // 检测表格格式：通过数据行列数判断（8 列=新格式含 ABC+能量，6 列=旧格式）
            // 注意：表头在分隔符之前，tableColumns 在旧代码中永远检测不到，改用 cells.length
            const isNewFormat = cells.length >= 8;
            const abc = isNewFormat ? (cells[3] || "—") : "—";
            const energy = isNewFormat ? (cells[4] || "—") : "—";
            const prioIdx = isNewFormat ? 5 : 3;
            const deadlineIdx = isNewFormat ? 6 : 4;
            const noteIdx = isNewFormat ? 7 : 5;

            currentCategory.tasks.push({
              id: cells[0],
              task: cells[1] || "",
              status,
              statusText: statusText || "📋 待办",
              abc,
              energy,
              priority: cells[prioIdx] || "🟡 中",
              deadline: cells[deadlineIdx] || "—",
              note: cells[noteIdx] || "—",
            });
          }
        }
      }
    }
  } catch {
    // 文件不存在时返回空结构
    for (const emoji of ["🔄", "🏢", "📱", "🎮", "🔧"]) {
      const catDef = CATEGORY_MAP[emoji];
      if (catDef) categories.push({ ...catDef, tasks: [] });
    }
  }

  // 统计
  const allTasks = categories.flatMap((c) => c.tasks);
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter((t) => t.status === "pending").length,
    active: allTasks.filter((t) => t.status === "active").length,
    done: allTasks.filter((t) => t.status === "done").length,
    cancelled: allTasks.filter((t) => t.status === "cancelled").length,
    byCategory: {} as Record<string, { pending: number; active: number; done: number }>,
  };
  for (const cat of categories) {
    stats.byCategory[cat.key] = {
      pending: cat.tasks.filter((t) => t.status === "pending").length,
      active: cat.tasks.filter((t) => t.status === "active").length,
      done: cat.tasks.filter((t) => t.status === "done").length,
    };
  }

  return { categories, archives, stats };
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
    { name: "GAME-002「开仙门」", engine: "Godot 4.7", status: "active", statusText: "活跃", progress: "V0.1 ~70%", output: "闭环+MCP+5层防御+15波+6功法+35/93任务✅+文档修复+方向重构完成", blocker: "待祝福3选1UI+弟子接入主循环" },
    { name: "小红书自媒体", engine: "HTML/CSS + Puppeteer", status: "active", statusText: "活跃", progress: "15 期帖子", output: "v3 工作流：Puppeteer 截图导出 6 PNG + Pixso 可选", blocker: "—" },
    { name: "asset-pipeline", engine: "Lovart + Photoshop", status: "active", statusText: "活跃", progress: "3 风格已验证", output: "道具图标工作流固化", blocker: "—" },
    { name: "秦王殿奏对 (qin-court-audience)", engine: "HTML/CSS/JS", status: "active", statusText: "活跃", progress: "v1.0 已完成", output: "300 题库 + 10 分类 + 打字答题", blocker: "—" },
    { name: "交互规范系统 (interaction-spec-system)", engine: "TypeScript + HTML/CSS", status: "active", statusText: "活跃", progress: "v1.0", output: "MD→HTML生成器 + 竖版/横版规范 + 低保真原型技能包 + 7/31 项目化完成", blocker: "—" },
  ];

  const workflows = [
    { name: "Git-提交推送", version: "v1", skill: "/git-commit", project: "全局", status: "mature", category: "造化坊",
      desc: "将本地代码变更提交并推送到 GitHub 远程仓库", steps: "检查变更 → 生成约定式提交 → 用户确认 → commit → push", trigger: "/git-commit 或「提交代码」" },
    { name: "仪表盘更新", version: "v2", skill: "/update-dashboard", project: "全局", status: "mature", category: "造化坊",
      desc: "重新生成造化坊 HTML 仪表盘（7 页签）", steps: "检查 collect-data.ts → 更新过时数据 → 生成 HTML → 用户验证", trigger: "/update-dashboard 或「更新仪表盘」" },
    { name: "个人待办管理", version: "v1", skill: "/todo", project: "全局", status: "mature", category: "造化坊",
      desc: "管理 5 分类个人任务：手动添加 / 扫描提取 / 确认导入 / 周度归档", steps: "添加任务 → 列出待办 → 完成/取消 → 扫描提取(三步确认) → 周度归档", trigger: "/todo 或「添加任务」「我的待办」「扫描待办」「归档」" },
    { name: "功能开发-流水线", version: "v2", skill: "待建", project: "全局", status: "mature", category: "游戏开发",
      desc: "通用 4 阶段 + 数据原则 + 实现后步骤：策划→需求→UI交互→美术资产→(实现：代码+测试+文档同步)", steps: "功能策划(01) → 功能需求(02) → 界面交互UI(03) → 美术资产(04) → 进入实现", trigger: "待建" },
    { name: "小红书-制作帖子", version: "v3", skill: "/new-post", project: "小红书", status: "mature", category: "自媒体",
      desc: "从 works/ 日志选题，制作 6 卡图文帖子：文案→HTML→Puppeteer逐卡截图→6 PNG导出", steps: "works/ 选材 → 文案撰写 → HTML 排版 → Puppeteer 截图导出(6 PNG) → Pixso 导入（可选）", trigger: "/new-post 或「制作帖子」" },
    { name: "Pixso-导入操作", version: "v1", skill: "—", project: "小红书", status: "mature", category: "自媒体",
      desc: "将 HTML 帖子导入 Pixso 进行设计精调（可选步骤，主截图已由 Puppeteer 完成）", steps: "打开 Pixso → 取消画布选中 → code_to_design 导入 HTML → 重命名 frame → 手动调整", trigger: "纯人工操作，无对应 SKILL" },
    { name: "道具图标-生产", version: "v1", skill: "/item-icon", project: "asset-pipeline", status: "mature", category: "游戏开发",
      desc: "游戏道具图标批量生产：Lovart AI 生成 → Photoshop 抠图 → 256px 切片", steps: "道具清单 → Lovart 生成(多模型可选) → PS 抠图 → 切片输出", trigger: "/item-icon 或「生成图标」" },
    { name: "工作日志记录", version: "v1", skill: "/write-log", project: "全局", status: "mature", category: "造化坊",
      desc: "回顾当日工作 → 按 works/_template.md 生成日志 → 写入 works/ 目录", steps: "回顾会话 → 确认标题 → 生成(问题日志+视频草案) → 写入文件", trigger: "/write-log 或「记录日志」「总结今天」" },
    { name: "文件梳理", version: "v1", skill: "/organize-files", project: "全局", status: "mature", category: "造化坊",
      desc: "全项目目录扫描 → 诊断三级问题 → 用户确认 → 执行整理 → 同步仪表盘", steps: "扫描分析 → 诊断报告 → 方案确认 → 执行修改 → 同步仪表盘", trigger: "/organize-files 或「梳理文件」「整理文件夹」" },
    { name: "美术任务表审查", version: "v1", skill: "/art-review", project: "主美工作", status: "active", category: "主美工作",
      desc: "连接飞书美术排期表 → 4目标分析（基础状况/风险逾期/信息规范/综合建议）→ 输出审查报告", steps: "选定审查范围 → 飞书读取数据 → 4目标分析 → 生成报告 → 存档", trigger: "/art-review 或「审查美术」「美术review」" },
    { name: "写策划案-HTML-v0.1", version: "v0.1", skill: "待建", project: "全局", status: "active", category: "游戏开发",
      desc: "🆕 轻量级策划案工作流。一份 HTML = 完整策划案，5 页签（简介/规则/界面说明/动态交互/资产需求），中小功能适用", steps: "复制模板 → AI 读上下文 → 逐 tab 协作填充 → 浏览器验证 → 定稿", trigger: "待建" },
    { name: "创建项目", version: "v1", skill: "/new-project", project: "全局", status: "active", category: "造化坊",
      desc: "标准化项目创建：4 类项目模型（游戏/自媒体/管线/其他），7 步从模糊想法到仪表盘注册", steps: "确定方向 → 确定类型和技术栈 → 项目初始化 → 注册到体系 → 创建CLAUDE.md → 第一份工作记录 → 同步仪表盘", trigger: "/new-project 或「新建项目」「创建项目」" },
    { name: "创建工作流", version: "v1", skill: "/new-workflow", project: "全局", status: "active", category: "造化坊",
      desc: "🏭 元工作流：用工作流定义工作流自身。发现重复模式 → 提炼标准步骤 → 生成文档+SKILL → 注册三大索引", steps: "发现与识别 → 提炼标准步骤 → 编写知识层文档 → 创建SKILL → 注册到体系 → 验证", trigger: "/new-workflow 或「建立新工作流」「标准化流程」" },
    { name: "目标管理", version: "v1", skill: "/goals", project: "全局", status: "active", category: "造化坊",
      desc: "SMART 化目标设定 → 三层拆解（目标→里程碑→行动项）→ 月度复盘。上限 3 个活跃目标", steps: "定义目标 → 拆解为可执行步骤 → 写入体系 → 关联项目和工作流 → 进展追踪 → 复盘", trigger: "/goals 或「定目标」「做规划」「复盘」" },
  ];
  const skillsDir = path.join(ROOT, ".claude/skills");
  const skillsRaw = listSkills(skillsDir);
  const skills = skillsRaw.map(s => ({ ...s, linkedWorkflow: linkSkillToWorkflow(s.name) }));

  // 旧任务看板已合并入个人待办系统（docs/个人待办.md），此处不再维护

  const goalsUser = [
    { id: "U1", task: "小红书持续内容产出", detail: "基于 works/ 日志提炼选题，保持每周发布节奏。7月已15期，8月目标：8期+", priority: "🟡 持续", progress: 90, todos: 1,
      pnas: { picture: "打开小红书创作者后台 → 本周已发布 1-2 篇笔记 → 每篇都是一个「和 AI 协作解决具体问题」的真实故事 → 评论区有人问「怎么用 AI 做到的？」→ 简介里写着造化坊理念。",
              noun: "works/ 工作日志（素材源）、Claude Code（AI 协作伙伴）、/new-post SKILL（生产流程）、Puppeteer（截图导出）、造化坊仪表盘（发布追踪）",
              activities: "我从 works/ 选材（每周至少一次），我提炼三幕故事结构，我用 AI 生成文案和排版 HTML，我用 Puppeteer 导出 6 张卡片截图，我发布到小红书并记录到仪表盘",
              sequence: "① 浏览本周 works/ 日志 → ② 选出最有「问题→AI解决」亮点的素材 → ③ 用 /new-post 生成帖子 → ④ Puppeteer 导出截图 → ⑤ 发布 → ⑥ 更新仪表盘" } },
    { id: "U2", task: "GAME-002 V0.1 核心循环", detail: "M1: 祝福3选1UI → M2: 弟子接入战斗 → M3: 旧模块清理+验证。方向重构（塔防→吸血鬼+放置）已完成", priority: "🔴 P0", progress: 70, todos: 5,
      pnas: { picture: "打开 Godot，点「运行」→ 出现门派经营界面 → 点击「出战」→ 进入战斗场景 → 弟子自动战斗 → 胜利弹窗显示掉落 → 回到经营界面。整个过程无报错，帧率稳定，体验流畅。",
              noun: "Godot 4.7 引擎、祝福 3 选 1 UI 场景（.tscn）、BlessingManager 数据层、DiscipleSquad 模块、战斗结算模块、旧代码残余引用",
              activities: "我创建祝福选择场景（.tscn），我实现三选一点选→确认→应用祝福逻辑，我连接 BlessingManager 数据层，我将 DiscipleSquad 接入主战斗场景，我删除旧 card_manager/summons/upgrades 残余引用，我手动跑通完整一局验证闭环",
              sequence: "① 创建祝福选择场景 → ② 实现三选一交互逻辑 → ③ 连接 BlessingManager 数据层 → ④ DiscipleSquad 接入战斗循环 → ⑤ 删除旧模块残余引用 → ⑥ 手动跑通完整一局（经营→战斗→结算）验证闭环" } },
    { id: "U3", task: "asset-pipeline 对接 GAME-002", detail: "等待 GAME-002 V0.1 稳定后提取道具清单，批量生产第一批图标", priority: "🟢 远期", progress: 20, todos: 1,
      pnas: { picture: "打开 GAME-002 的道具背包界面 → 每件装备旁边显示一枚精致的图标（法器/丹药/秘籍各有独特视觉风格）→ 图标风格统一、尺寸一致、在游戏引擎中显示清晰。",
              noun: "GAME-002 道具清单、Lovart AI（图像生成）、Photoshop（抠图+切片）、道具视觉风格参考（修仙题材）、交付规格标准（256px/格式/命名）",
              activities: "我从 GAME-002 提取道具清单，我定义视觉风格参考（法器/丹药/秘籍三类），我用 Lovart 生成第一批道具图标（5-10 个），我用 PS 抠图 + 256px 切片，我导入 GAME-002 项目验证效果",
              sequence: "① 等待 GAME-002 V0.1 稳定 → ② 提取道具清单（名称/稀有度/尺寸）→ ③ 定义视觉风格参考 → ④ Lovart 批量生成 → ⑤ PS 抠图+切片 → ⑥ 导入 GAME-002 验证" } },
    { id: "U4", task: "造化坊仪表盘持续完善", detail: "8 大问题修复：数据同步、待办归档、页签重构、资产补全。保持仪表盘与项目状态实时一致", priority: "🟡 本周", progress: 0, todos: 0,
      pnas: { picture: "", noun: "", activities: "", sequence: "" } },
  ];

  const longTermGoals = {
    dimensions: [
      { dim: "🎓 学习成长", vision: "通过独立游戏开发掌握 Godot 全栈能力 + AI 协作方法论", status: "GAME-002 推进中" },
      { dim: "💼 事业发展", vision: "主美岗位稳定产出 + AI 工具链赋能团队", status: "美术审查系统运转中" },
      { dim: "💰 财富健康", vision: "—", status: "未设定" },
      { dim: "👨‍👩‍👧 家庭社交", vision: "—", status: "未设定" },
      { dim: "⚙️ 效能系统", vision: "造化坊基础设施自运转（工作流/SKILL/仪表盘闭环）", status: "16 工作流 + 11 SKILL" },
      { dim: "🚀 体验突破", vision: "完成至少 1 个可发布的独立游戏", status: "GAME-002 冲刺 V0.1" },
      { dim: "🎨 休闲娱乐", vision: "—", status: "未设定" },
      { dim: "🤝 人际关系", vision: "—", status: "未设定" },
    ],
    intersection: {
      happy: "做游戏、写代码、看到东西跑起来",
      advantage: "美术审美 + AI 工具驾驭 + 快速原型",
      meaningful: "证明「AI 时代做中学」可行，影响更多人",
      core: "用 AI 协作做独立游戏，并把过程变成内容",
    },
    formula: "R = E × T（结果 = 效能 × 时间）—— 不是做更多事，而是在高能时段做要事。",
  };

  const goalsArchived = [
    { task: "完善造化坊「目标计划」板块", detail: "3 个全局工作流 + 目标规划.md + 仪表盘进度条+待办数。端到端流程跑通", completedDate: "2026-07-30" },
    { task: "GAME-002 全面诊断 + 文档修复", detail: "godot-master框架诊断（3高优修复项）+118份文档审计", completedDate: "2026-07-28" },
    { task: "GAME-002 V0.1 核心架构搭建", detail: "7 新模块（SpiritSeat/Disciple/BlessingManager+3 Data类）+ GameManager 集成", completedDate: "2026-07-27" },
    { task: "GAME-002 设计决策确认（9/19）", detail: "集中确认 Tier 1-2 共 9 项 + Tier 3 默认值", completedDate: "2026-07-26" },
  ];

  const goalsIssues = [
    { id: "I2", issue: "GAME-002 祝福选择 UI 仍复用旧卡牌面板（需独立面板）", source: "Phase 2 用卡牌面板桥接显示祝福，UI 体验待优化", severity: "🟡 累积" },
    { id: "I4", issue: "shared/assets/ 全部空 —— fonts/audio/sprites 仅 .gitkeep", source: "文件扫描 07-23", severity: "🟢 远期" },
    { id: "I5", issue: "docs/en/ 14:1 严重不同步 —— 仅 README 无实际文档", source: "文档审计 07-23", severity: "🟢 远期" },
    { id: "I8", issue: "仪表盘部分数据硬编码，未与实际文件系统同步", source: "仪表盘全局审查 07-31", severity: "🔴 本周" },
  ];

  const goalsAI = [
    { id: "A1", suggestion: "Phase 3：祝福3选1 UI 面板制作 + 接入升级流程", detail: "旧代码已清理。下一步：创建独立祝福选择面板，DiscipleSquad 接入战斗循环。这是 V0.1 核心闭环的最后一块拼图。", priority: "🔴 优先" },
    { id: "A3", suggestion: "小红书保持节奏，不追求完美", detail: "15 期存量足够，按 /new-post 流程持续产出即可。8 月重点从数量转向质量 —— 每期一个真问题。", priority: "🟡 建议" },
    { id: "A4", suggestion: "8月1日执行首次月度复盘 🆕", detail: "三个全局工作流+目标规划.md+仪表盘进度条全部就位。明天（8月1日）可做首次正式月度复盘，回顾 7 月成果并规划 8 月方向。", priority: "🔴 优先" },
  ];

  const toolGuides = [
    { tool: "Git", intro: "01-git-intro.md", ops: "02-git-operations.md", collab: "03-git-human-ai-collab.md", desc: "分布式版本控制系统", docs: 3 },
    { tool: "GitHub", intro: "01-github-intro.md", ops: "02-github-operations.md", collab: "03-github-human-ai-collab.md", desc: "代码托管与协作平台", docs: 3 },
    { tool: "Pixso", intro: "pixso-human-ai-collaboration.md", ops: "pixso-workflow-add-post.md", collab: "—", desc: "UI 设计工具，人机协作 + 导入流程", docs: 2 },
    { tool: "Claude Code Skills", intro: "game-dev-skills.md", ops: "—", collab: "—", desc: `标准 ${skillsCount.standard} + 扁平 ${skillsCount.flat} = ${skillsCount.total} 个技能（Godot/Phaser/Three.js 等）`, docs: skillsCount.total },
    { tool: "Claude Code 配置", intro: "—", ops: ".claude/settings.json", collab: "CLAUDE.md", desc: "权限/hooks/MCP/记忆", docs: 4 },
    { tool: "个人工作记录", intro: "README.md", ops: "docs/personal-work-records/", collab: "—", desc: "7 大类工作文档：美术规范/团队管理/项目成本/任务规划/校企合作/行业认知/AI工具", docs: 31 },
  ];

  const assets = [
    { layer: "系统层", name: "CLAUDE.md", path: "CLAUDE.md", desc: "AI 行为规范（项目入口）" },
    { layer: "系统层", name: "docs/workflows/", path: "docs/workflows/", desc: `标准化工作流（${workflowCount} 文档）` },
    { layer: "系统层", name: "docs/tool-guides/", path: "docs/tool-guides/", desc: `工具知识库（${guideCount} 文档）` },
    { layer: "系统层", name: "docs/personal-work-records/", path: "docs/personal-work-records/", desc: "个人工作记录：美术规范/团队管理/项目成本/任务规划/校企合作/行业认知/AI工具" },
    { layer: "系统层", name: ".claude/skills/", path: ".claude/skills/", desc: "SKILL 定义文件（/xxx CLI 命令的底层实现）" },
    { layer: "系统层", name: "works/", path: "works/", desc: "工作日志（一事一记）" },
    { layer: "系统层", name: "reports/", path: "reports/", desc: "汇报仪表盘" },
    { layer: "项目层", name: "GAME-002「开仙门」", path: "projects/GAME-002/", desc: "Godot 修仙 Roguelike 塔防 → 吸血鬼+放置" },
    { layer: "项目层", name: "小红书自媒体", path: "projects/xiaohongshu/", desc: "AI 协作内容创作 — 15 期帖子" },
    { layer: "项目层", name: "asset-pipeline", path: "projects/asset-pipeline/", desc: "游戏道具图标资产管线" },
    { layer: "项目层", name: "秦王殿奏对", path: "projects/qin-court-audience/", desc: "HTML/CSS/JS 打字答题游戏 — 300 题库 + 10 分类" },
    { layer: "项目层", name: "交互规范系统", path: "projects/interaction-spec-system/", desc: "MD 驱动游戏交互规范生产线 — 模板+生成器+技能包" },
    { layer: "—", name: "GitHub", path: "https://github.com/g676967453-blip/creation-forge", desc: "远程仓库" },
  ];

  const external = [
    { cat: "设计工具", name: "Pixso (MCP)", addr: "http://127.0.0.1:3667/mcp", desc: "UI 设计工具" },
    { cat: "代码仓库", name: "GitHub", addr: "main 分支 / g676967453-blip/creation-forge", desc: "远程仓库" },
    { cat: "自媒体", name: "小红书", addr: "projects/xiaohongshu/", desc: "15 期帖子，/new-post SKILL" },
    { cat: "AI 图像", name: "Lovart", addr: "lovart.ai", desc: "AI 图像/视频/音频生成，道具图标+概念图" },
  ];

  // 个人待办数据
  const personalTasks = loadPersonalTasks();

  return {
    today, worksData, gitCommits, commitCount,
    skillCount, skillStandard: skillsCount.standard, skillFlat: skillsCount.flat,
    workflowCount, guideCount, worksCount: worksFiles.length,
    projects, workflows, skills, goalsUser, longTermGoals, goalsArchived, goalsIssues, goalsAI,
    toolGuides, assets, external,
    personalTasks,
  };
}
