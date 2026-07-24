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

export function collectData() {
  const today = new Date().toLocaleDateString("zh-CN");
  const worksFiles = listWorks();
  const worksData = worksFiles.map(f => ({ date: f.substring(0, 10), file: f, desc: autoDesc(f) }));
  const gitCommits = gitLog(5);
  const commitCount = gitCommitCount();
  const skills = countSkills(path.join(ROOT, ".claude/skills"));
  const skillCount = skills.total;
  const workflowCount = countFiles(path.join(ROOT, "docs/workflows"));
  const guideCount = countFiles(path.join(ROOT, "docs/tool-guides"));

  const projects = [
    { name: "GAME-002「开仙门」", engine: "Godot 4.7", status: "active", statusText: "活跃", progress: "V0.1 11%", output: "UI 原型 ×4 + 美术需求", blocker: "19 个待定设计决策" },
    { name: "小红书自媒体", engine: "HTML/CSS + Pixso", status: "active", statusText: "活跃", progress: "14 期帖子", output: "post-13/14 + 目录扁平化", blocker: "—" },
    { name: "asset-pipeline", engine: "Lovart + Photoshop", status: "active", statusText: "活跃", progress: "3 风格已验证", output: "道具图标工作流固化", blocker: "—" },
    { name: "tutorial/01-hello-canvas", engine: "Phaser 3.80+", status: "idle", statusText: "待机", progress: "仅骨架", output: "—", blocker: "优先级低" },
    { name: "originals / sandbox", engine: "待定", status: "empty", statusText: "空白", progress: "—", output: "—", blocker: "—" },
  ];

  const workflows = [
    { name: "小红书-制作帖子", version: "v2", skill: "/new-post", project: "小红书", status: "mature" },
    { name: "Pixso-导入操作", version: "v1", skill: "—", project: "小红书", status: "mature" },
    { name: "Git-提交推送", version: "v1", skill: "/git-commit", project: "全局", status: "mature" },
    { name: "汇报说明书同步", version: "v1", skill: "/sync-report", project: "全局", status: "mature" },
    { name: "道具图标-生产", version: "v1", skill: "待建", project: "asset-pipeline", status: "mature" },
    { name: "GAME002-UI制作", version: "v2", skill: "待建", project: "GAME-002", status: "mature" },
    { name: "GAME002-UI层命名规范", version: "v2", skill: "—", project: "GAME-002", status: "mature" },
    { name: "GAME002-功能开发", version: "v1", skill: "待建", project: "GAME-002", status: "testing" },
    { name: "改进追踪", version: "v1", skill: "—", project: "全局", status: "ongoing" },
  ];

  const tasks = [
    { id: "1", status: "done", statusText: "✅ 已完成", cat: "核心理念", task: "创建宣言文档 (manifesto.md)", note: "2026-07-15" },
    { id: "2", status: "done", statusText: "✅ 已完成", cat: "核心理念", task: "重构 README + CLAUDE.md + 三层管理体系", note: "2026-07-23" },
    { id: "3", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "工作流管理体系（双层 10 文档 + 3 SKILL）", note: "docs/workflows/ + .claude/skills/" },
    { id: "4", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "工具知识库（7 文档）", note: "docs/tool-guides/" },
    { id: "5", status: "done", statusText: "✅ 已完成", cat: "基础设施", task: "汇报体系 + HTML 仪表盘上线", note: "仪表盘服务器 + 动态交互" },
    { id: "6", status: "done", statusText: "✅ 已完成", cat: "自媒体", task: "小红书素材库 14 期 + /new-post SKILL", note: "07-15 → 07-23" },
    { id: "7", status: "active", statusText: "🟢 进行中", cat: "项目", task: "GAME-002「开仙门」开发（Godot 4.7）", note: "V0.1 11%，19 待定决策阻塞" },
    { id: "8", status: "active", statusText: "🟢 进行中", cat: "项目", task: "asset-pipeline 资产管线运行", note: "3 风格已验证" },
    { id: "9", status: "planned", statusText: "📋 计划中", cat: "自媒体", task: "持续发布小红书内容", note: "基于 works/ 素材生产" },
    { id: "10", status: "planned", statusText: "📋 计划中", cat: "项目", task: "GAME-002 经营系统决策 (X1~X4)", note: "阻塞 3 周，需用户拍板" },
    { id: "11", status: "planned", statusText: "📋 计划中", cat: "基础设施", task: "SKILL 扩展（/开发功能 /道具图标）", note: "待流程成熟" },
  ];

  const goalsUser = [
    { id: "U1", task: "小红书持续内容产出", detail: "基于 works/ 日志提炼选题，保持每周发布节奏", priority: "🟡 持续" },
    { id: "U2", task: "GAME-002 经营系统决策 (X1~X4)", detail: "招募消耗、升级曲线、修复顺序、修炼速度 —— 阻塞 3 周", priority: "🔴 紧急" },
    { id: "U3", task: "GAME-002 战斗+结算系统决策 (X5~X19)", detail: "祝福池、挂件槽、Boss 阶段、胜利/失败条件等 15 项", priority: "🟡 本周" },
    { id: "U4", task: "asset-pipeline 产出 GAME-002 实际素材", detail: "道具图标管线已验证，需对接到 GAME-002 的具体需求", priority: "🟡 本周" },
  ];

  const goalsIssues = [
    { id: "I1", issue: "GAME-002 V0.1 进度仅 11%，19 项设计决策待定", source: "项目扫描 07-17，至今未推进", severity: "🔴 阻塞" },
    { id: "I2", issue: "GAME-002 技术债堆积：main_peak.gd 963 行 God Class", source: "07-09 全局评估，P1 架构合规仅 50%", severity: "🟡 累积" },
    { id: "I3", issue: "tutorial 教程线 0% —— hello-canvas 仅骨架无代码", source: "项目扫描，5% 完成度", severity: "🟢 远期" },
    { id: "I4", issue: "shared/assets/ 全部空 —— fonts/audio/sprites 仅 .gitkeep", source: "文件扫描 07-23", severity: "🟢 远期" },
    { id: "I5", issue: "docs/en/ 14:1 严重不同步 —— 仅 README 无实际文档", source: "文档审计 07-23", severity: "🟢 远期" },
    { id: "I6", issue: "Git push 不稳定 —— 依赖 HTTPS，偶发 timeout/reset", source: "07-23 复盘，#5 SSH 未配置", severity: "🟡 便利性" },
  ];

  const goalsAI = [
    { id: "A1", suggestion: "本周焦点：解锁 GAME-002", detail: "经营系统 X1~X4 是最小决策集，拍板后开发可启动。建议一次会话集中拍完 4 项。", priority: "🔴 优先" },
    { id: "A2", suggestion: "小红书保持节奏，不追求完美", detail: "14 期存量足够，按 /new-post 流程持续产出即可。重点从数量转向质量 —— 每期一个真问题。", priority: "🟡 建议" },
    { id: "A3", suggestion: "资产管线对接到实际需求", detail: "asset-pipeline 已验证可行，下一步：确定 GAME-002 需要哪些道具图标，批量产出第一版。", priority: "🟡 建议" },
    { id: "A4", suggestion: "教程线推迟到主线稳定后", detail: "当前重心是 GAME-002 + 小红书 + asset-pipeline 三条线。教程线等至少一条主线进入稳定期再启动。", priority: "🟢 远期" },
  ];

  const toolGuides = [
    { tool: "Git", intro: "01-git-intro.md", ops: "02-git-operations.md", collab: "03-git-human-ai-collab.md", desc: "分布式版本控制系统", docs: 3 },
    { tool: "GitHub", intro: "01-github-intro.md", ops: "02-github-operations.md", collab: "03-github-human-ai-collab.md", desc: "代码托管与协作平台", docs: 3 },
    { tool: "Pixso", intro: "—", ops: "—", collab: "—", desc: "UI 设计工具（待补充）", docs: 0 },
    { tool: "Claude Code Skills", intro: "game-dev-skills.md", ops: "—", collab: "—", desc: `标准 ${skills.standard} + 扁平 ${skills.flat} = ${skills.total} 个技能（Godot/Phaser/Three.js 等）`, docs: skills.total },
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
    skillCount, skillStandard: skills.standard, skillFlat: skills.flat,
    workflowCount, guideCount, worksCount: worksFiles.length,
    projects, workflows, tasks, goalsUser, goalsIssues, goalsAI,
    toolGuides, assets, external,
  };
}
