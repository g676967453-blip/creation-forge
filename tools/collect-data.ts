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
    "🏠": { key: "L", label: "日常管理", emoji: "🏠", color: "#78909c" },
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
    // 统一换行符（Windows CRLF → LF），确保跨平台解析一致
    const lines = content.replace(/\r/g, "").split("\n");

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

/** 简单 YAML frontmatter 解析器：提取 --- 之间的 key: value 对 */
function parseYamlFrontmatter(content: string): Record<string, string> {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const result: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)/);
    if (kv) result[kv[1]] = kv[2].trim();
  }
  return result;
}

/** 从 docs/workflows/*.md 的 YAML frontmatter 加载工作流列表 */
export interface WorkflowDef {
  name: string; version: string; skill: string; project: string;
  status: string; category: string; desc: string; steps: string; trigger: string;
}
export function loadWorkflowsFromDocs(): WorkflowDef[] {
  const wfDir = path.join(ROOT, "docs", "workflows");
  // 排除非工作流文件（README、变更日志、改进追踪、模板子目录）
  const exclude = new Set(["README.md", "变更日志.md", "改进追踪.md"]);
  const workflows: WorkflowDef[] = [];
  try {
    for (const f of fs.readdirSync(wfDir)) {
      if (!f.endsWith(".md") || exclude.has(f)) continue;
      const full = path.join(wfDir, f);
      if (fs.statSync(full).isDirectory()) continue;
      const fm = parseYamlFrontmatter(fs.readFileSync(full, "utf-8"));
      if (!fm.name) continue; // 无 frontmatter → 不是工作流定义
      workflows.push({
        name: fm.name, version: fm.version || "—", skill: fm.skill || "—",
        project: fm.project || "全局", status: fm.status || "active",
        category: fm.category || "造化坊", desc: fm.desc || "—",
        steps: fm.steps || "—", trigger: fm.trigger || "—",
      });
    }
  } catch {}
  return workflows;
}

/** 项目注册表接口 */
export interface ProjectDef {
  name: string; engine: string; status: string; statusText: string;
  progress: string; output: string; blocker: string; sortOrder: number;
}
/** 从 projects 目录下各子项目的 project.json 加载项目列表，结合 PROGRESS.md 读取进度 */
export function loadProjectsFromJson(): ProjectDef[] {
  const projectsDir = path.join(ROOT, "projects");
  const projects: ProjectDef[] = [];
  try {
    for (const dir of fs.readdirSync(projectsDir)) {
      const jsonPath = path.join(projectsDir, dir, "project.json");
      if (!fs.existsSync(jsonPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        const prog = loadProjectProgress(dir);
        const statusText = meta.status === "active" ? "活跃" : meta.status === "planned" ? "已规划" : "已完成";
        projects.push({
          name: meta.name || dir,
          engine: meta.engine || "—",
          status: meta.status || "active",
          statusText: meta.statusText || statusText,
          progress: prog?.progress || meta.progress || "—",
          output: meta.output || "—",
          blocker: prog?.blocker || meta.blocker || "—",
          sortOrder: meta.sortOrder || 99,
        });
      } catch {}
    }
  } catch {}
  return projects.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 解析 docs/目标规划.md 中的季度目标（goalsUser） */
export function loadGoalsFromMarkdown(): {
  goalsUser: any[]; longTermGoals: any; goalsArchived: any[];
} {
  const filePath = path.join(ROOT, "docs", "目标规划.md");
  const defaults = { goalsUser: [] as any[], longTermGoals: null as any, goalsArchived: [] as any[] };
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // --- 解析长期目标（AI原生五维）---
    const ltgSection = content.match(/## 长期目标[\s\S]*?(?=## |$)/);
    const dimensions: any[] = [];
    if (ltgSection) {
      const dimRegex = /### (🎮|📡|💰|⚙️|🤖) (.+?)\n[\s\S]*?(?=### |\n---\n|\n## |$)/g;
      let dm;
      while ((dm = dimRegex.exec(ltgSection[0])) !== null) {
        const block = dm[0];
        // 提取栏目说明
        const vision = (block.match(/> \*\*栏目说明：\*\*\s*(.+)/) || [])[1] || "";
        // 提取状态标签
        const statusLine = block.match(/\n> (.+?)(?:\n|$)/);
        const status = statusLine ? statusLine[1].replace(/^[^：:]+[：:]\s*/, "").trim() : "";
        // 解析表格行
        const items: any[] = [];
        const tableRegex = /\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/g;
        let tr;
        while ((tr = tableRegex.exec(block)) !== null) {
          const name = tr[1].trim();
          if (name === "产品名称" || name === "平台" || name === "收入来源" || name === "系统模块" || name === "能力维度") continue;
          items.push({ name, tag: tr[3].trim(), note: tr[4].trim() });
        }
        dimensions.push({ dim: dm[1] + " " + dm[2], vision: vision || dm[2], status, items });
      }
    }

    // --- 解析战略定位三角 ---
    let strategicTriangle = { valueProposition: "", differentiation: "", growthEngine: "" };
    let formula = "";
    if (ltgSection) {
      const stTable = ltgSection[0].match(/### 战略定位三角[\s\S]*?(?=### |\n---\n|\n## |$)/);
      if (stTable) {
        const rows = stTable[0].match(/\| (🎯|⚡|📈) \| ([^|]+) \| ([^|]+) \|/g);
        if (rows) {
          for (const row of rows) {
            const cells = row.split("|").map(c => c.trim()).filter(Boolean);
            if (cells[0] === "🎯") strategicTriangle.valueProposition = cells[2] || "";
            else if (cells[0] === "⚡") strategicTriangle.differentiation = cells[2] || "";
            else if (cells[0] === "📈") strategicTriangle.growthEngine = cells[2] || "";
          }
        }
      }
      const fmMatch = ltgSection[0].match(/### 成功公式[\s\S]*?\*\*R = E × T\*\*[（(]结果 = 效能 × 时间[)）]\s*>\s*\n>\s*\*\*(.+?)\*\*/);
      if (!fmMatch) {
        const fmMatch2 = ltgSection[0].match(/### 成功公式[\s\S]*?\*\*R = E × T\*\*[（(][^)）]+[)）]\s*>\s*\n>\s*\*\*(.+?)\*\*/);
        formula = fmMatch2 ? fmMatch2[1].trim() : "R = E × T（结果 = 效能 × 时间）—— 不是做更多事，而是在高能时段做要事。";
      } else {
        formula = fmMatch[1].trim();
      }
    }
    const longTermGoals = dimensions.length > 0 ? { dimensions, strategicTriangle, formula } : null;

    // --- 解析季度目标 ---
    const goalsUser: any[] = [];
    const qSection = content.match(/## 季度项目[\s\S]*?(?=## 已完成目标|$)/);
    if (qSection) {
      const goalRegex = /### (\d+)\. (.+?)\n([\s\S]*?)(?=### \d+\. |\n---\n\n## |$)/g;
      let gm;
      while ((gm = goalRegex.exec(qSection[0])) !== null) {
        const gBlock = gm[0];
        const priority = (gBlock.match(/\| 优先级 \| ([^|]+) \|/) || [])[1]?.trim() || "—";
        const progressStr = (gBlock.match(/\| 进度 \| ([^|]+) \|/) || [])[1]?.trim() || "0%";
        const progress = parseInt(progressStr.replace(/[%~\s]/g, ""), 10) || 0;
        const detail = (gBlock.match(/\| 描述 \| ([^|]+) \|/) || [])[1]?.trim() || "";

        // PNAS
        let pnas = null;
        if (gBlock.includes("**🖼️ PNAS")) {
          const picture = (gBlock.match(/\|\s*\*\*P\*\* 画面\s*\| (.+?) \|/) || [])[1]?.trim() || "";
          const noun = (gBlock.match(/\|\s*\*\*N\*\* 要素\s*\| (.+?) \|/) || [])[1]?.trim() || "";
          const activities = (gBlock.match(/\|\s*\*\*A\*\* 行动\s*\| (.+?) \|/) || [])[1]?.trim() || "";
          const sequence = (gBlock.match(/\|\s*\*\*S\*\* 序列\s*\| (.+?) \|/) || [])[1]?.trim() || "";
          if (picture) pnas = { picture, noun, activities, sequence };
        }
        goalsUser.push({
          id: `U${gm[1]}`, task: gm[2].trim(), detail, priority,
          progress: Math.min(100, Math.max(0, progress)), todos: 0, pnas,
        });
      }
    }

    // --- 解析已完成目标 ---
    const goalsArchived: any[] = [];
    const archSection = content.match(/## 已完成目标[\s\S]*?(?=## 复盘记录|$)/);
    if (archSection) {
      const archRegex = /\| ([^|]+) \| ([^|]+) \| ([^|]+) \| (.+?) \|/g;
      let ar;
      while ((ar = archRegex.exec(archSection[0])) !== null) {
        if (ar[1].trim() === "目标") continue;
        goalsArchived.push({ task: ar[1].trim(), detail: ar[4].trim(), completedDate: ar[3].trim() });
      }
    }

    return { goalsUser, longTermGoals, goalsArchived };
  } catch {
    return defaults;
  }
}

/** 当 docs/目标规划.md 不可用时的默认季度目标 */
function defaultGoalsUser(): any[] {
  return [
    { id: "U1", task: "GAME-002 V0.1 核心循环", detail: "见 docs/目标规划.md", priority: "🔴 P0", progress: 80, todos: 0, pnas: null },
    { id: "U2", task: "小红书持续内容产出", detail: "见 docs/目标规划.md", priority: "🟡 持续", progress: 90, todos: 1, pnas: null },
    { id: "U3", task: "asset-pipeline 对接 GAME-002", detail: "见 docs/目标规划.md", priority: "🟢 远期", progress: 20, todos: 1, pnas: null },
  ];
}
/** 当 docs/目标规划.md 不可用时的默认长期目标 */
function defaultLongTermGoals(): any {
  return {
    dimensions: [
      { dim: "🎮 产品", vision: "见 docs/目标规划.md", status: "—", items: [] },
      { dim: "📡 内容与影响力", vision: "见 docs/目标规划.md", status: "—", items: [] },
      { dim: "💰 可持续", vision: "见 docs/目标规划.md", status: "—", items: [] },
      { dim: "⚙️ 系统", vision: "见 docs/目标规划.md", status: "—", items: [] },
      { dim: "🤖 AI进化", vision: "见 docs/目标规划.md", status: "—", items: [] },
    ],
    strategicTriangle: { valueProposition: "见 docs/目标规划.md", differentiation: "见 docs/目标规划.md", growthEngine: "见 docs/目标规划.md" },
    formula: "R = E × T",
  };
}
/** 当 docs/目标规划.md 不可用时的默认已归档目标 */
function defaultGoalsArchived(): any[] {
  return [
    { task: "完善造化坊「目标计划」板块", detail: "见 docs/目标规划.md", completedDate: "2026-07-30" },
  ];
}

// Scan projects/*/PROGRESS.md for progress metadata
export function loadProjectProgress(projectDir: string): { progress: string; blocker: string; phase: string } | null {
  // 轻型 PROGRESS.md
  const progressFile = path.join(ROOT, "projects", projectDir, "PROGRESS.md");
  try {
    const content = fs.readFileSync(progressFile, "utf-8");
    const phase = (content.match(/\*\*阶段\*\*[：:]\s*(.+)/) || [])[1] || "";
    const progress = (content.match(/\*\*进度\*\*[：:]\s*(.+)/) || [])[1] || "";
    const blocker = (content.match(/\*\*阻塞\*\*[：:]\s*(.+)/) || [])[1] || "无";
    return { progress: progress || "—", blocker: blocker === "无" ? "—" : blocker, phase };
  } catch { return null; }
}

export function collectData() {
  // 仪表盘是视图。Markdown 文件是权威数据源。
  const today = new Date().toLocaleDateString("zh-CN");
  const worksFiles = listWorks();
  const worksData = worksFiles.map(f => ({ date: f.substring(0, 10), file: f, desc: autoDesc(f) }));
  const gitCommits = gitLog(5);
  const commitCount = gitCommitCount();
  const skillsCount = countSkills(path.join(ROOT, ".claude/skills"));
  const skillCount = skillsCount.total;

  // 项目：从 projects/*/project.json + PROGRESS.md 动态加载
  const projects = loadProjectsFromJson();

  // 工作流：从 docs/workflows/*.md 的 YAML frontmatter 动态加载
  const workflows = loadWorkflowsFromDocs();
  const workflowCount = workflows.length; // 修复 I9：只计数有效工作流

  const guideCount = countFiles(path.join(ROOT, "docs/tool-guides"));

  // 技能：从 .claude/skills/ 目录扫描
  const skillsDir = path.join(ROOT, ".claude/skills");
  const skillsRaw = listSkills(skillsDir);
  const skills = skillsRaw.map(s => ({ ...s, linkedWorkflow: linkSkillToWorkflow(s.name) }));

  // 目标：从 docs/目标规划.md 动态解析
  const goalsData = loadGoalsFromMarkdown();
  const goalsUser = goalsData.goalsUser.length > 0 ? goalsData.goalsUser : defaultGoalsUser();
  const longTermGoals = goalsData.longTermGoals || defaultLongTermGoals();
  const goalsArchived = goalsData.goalsArchived.length > 0 ? goalsData.goalsArchived : defaultGoalsArchived();

  const goalsIssues = [
    { id: "I2", issue: "GAME-002 祝福选择 UI 仍复用旧卡牌面板（需独立面板）", source: "Phase 2 用卡牌面板桥接显示祝福，UI 体验待优化", severity: "🟡 累积" },
    { id: "I4", issue: "shared/assets/ 全部空 —— fonts/audio/sprites 仅 .gitkeep", source: "文件扫描 07-23", severity: "🟢 远期" },
    { id: "I5", issue: "docs/en/ 14:1 严重不同步 —— 仅 README 无实际文档", source: "文档审计 07-23", severity: "🟢 远期" },
    { id: "I8", issue: "仪表盘部分数据硬编码，未与实际文件系统同步", source: "仪表盘全局审查 07-31", severity: "🔴 本周" },
    { id: "I9", issue: "工作流计数不一致 —— 宣称 16 个，实际定义 20 个，仪表盘 countFiles() 把 README/变更日志/改进追踪也计入", source: "全盘检查 08-02", severity: "🟡 累积" },
    { id: "I10", issue: "仪表盘注释/标题过时 —— 注释写「8 Tab」实为 7，页签标题「5 分类」已扩至 6", source: "全盘检查 08-02", severity: "🟡 累积" },
    { id: "I11", issue: "SKILL 数量声明偏差 —— CLAUDE.md 称「11 SKILL + library」，实际含 library 共 ~50 个", source: "全盘检查 08-02", severity: "🟢 远期" },
    { id: "I12", issue: ".ai-locks/ .lobster/ .trea/ 未加入 .gitignore，出现在 untracked files 中", source: "全盘检查 08-02", severity: "🟢 远期" },
  ];

  const goalsAI = [
    { id: "A1", suggestion: "【P0 本周】推 GAME-002 M1 祝福3选1面板", detail: "P0 卡在 ~80% 已有一段时间。这是最小交付单元：创建 .tscn 场景 → 三选一交互 → 连接 BlessingManager。每天推 1 个待办，不要等大块时间。", priority: "🔴 优先" },
    { id: "A2", suggestion: "【P0 本周】暂停新增工作流/SKILL，专注执行", detail: "16 workflows + 205 skills 已足够支撑全部产出。继续基建是「为系统建系统」。把精力转向用现有系统推 GAME-002 V0.1 完成。", priority: "🔴 优先" },
    { id: "A3", suggestion: "【内容】调参工具 → 小红书新帖", detail: "今天（8/2）完工的调参工具就是最佳素材：一个滑块写实切Q版。三幕结构已写好，/new-post 生成，明天发。8 月不能断档。", priority: "🟡 建议" },
    { id: "A4", suggestion: "【内容】选题从「做了什么」→「学到了什么」", detail: "当前 16 粉丝不急着追量。每期提炼一个金句（来自宣言或工作日志），侧重「解决问题的过程」而非「交付了什么」。这才是造化坊的差异化内容。", priority: "🟡 建议" },
    { id: "A5", suggestion: "【系统】暂搁 .lobster / .trea 多 AI 编排", detail: "框架已搭好但实际利用率存疑。维护多 AI 协作协议会吃掉执行时间。当前单 Claude + 16 workflows 已很强。等 GAME-002 V0.1 交付后再启动多 AI。", priority: "🟢 长期" },
    { id: "A6", suggestion: "【系统】设定 asset-pipeline 明确解锁条件", detail: "当前解锁条件模糊（「等 V0.1 稳定」）。建议改为：主战斗场景可运行即可解锁 asset-pipeline M1（提取道具清单+风格参考），不必等到全部 bug 修完。", priority: "🟢 长期" },
    { id: "A7", suggestion: "【复盘】8月首周执行首次月度复盘", detail: "7 月是造化坊基建月（16 workflows + 仪表盘 + 多 AI 协议）。用 /goals 做首次正式月度复盘：检查 7 月成果、Q3 目标进度偏差、8 月重点（从基建转向产品交付）。", priority: "🔴 优先" },
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
    { layer: "项目层", name: "美术AI协作中台", path: "projects/游戏美术部门AI协作中台/", desc: "美术部门 AI 协作平台 — 资产管理+AI生成+管线集成（已规划）" },
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
