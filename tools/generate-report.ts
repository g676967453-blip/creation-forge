/**
 * 造化坊汇报说明书生成器
 * 生成一份面向项目负责人的中文 Excel 汇报文档
 *
 * 使用: npx tsx tools/generate-report.ts
 * 输出: reports/造化坊汇报说明书.xlsx
 */

import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "reports");
const OUT_FILE = path.join(OUT_DIR, "造化坊汇报说明书.xlsx");

// ============================================================
// 工具函数
// ============================================================

/** 创建一个带标题的 Sheet */
function addTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle?: string
) {
  // 大标题
  const titleRow = sheet.addRow([title]);
  titleRow.height = 36;
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: "微软雅黑", size: 18, bold: true, color: { argb: "FF1A1A2E" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8F0" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(1, 1, 1, 4);

  if (subtitle) {
    const subRow = sheet.addRow([subtitle]);
    subRow.height = 22;
    const subCell = subRow.getCell(1);
    subCell.font = { name: "微软雅黑", size: 11, italic: true, color: { argb: "FF666688" } };
    sheet.mergeCells(2, 1, 2, 4);
  }

  sheet.addRow([]); // 空行
}

/** 创建一个带样式的表头 */
function addHeader(sheet: ExcelJS.Worksheet, headers: string[], widths?: number[]) {
  const row = sheet.addRow(headers);
  row.height = 28;
  headers.forEach((_, i) => {
    const cell = row.getCell(i + 1);
    cell.font = { name: "微软雅黑", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3D3D5C" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });
  if (widths) {
    widths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });
  }
}

/** 添加普通数据行 */
function addRow(
  sheet: ExcelJS.Worksheet,
  cells: (string | { text: string; bold?: boolean; color?: string })[],
  options?: { height?: number; fillColor?: string }
) {
  const row = sheet.addRow(cells.map((c) => (typeof c === "string" ? c : c.text)));
  row.height = options?.height ?? 24;
  cells.forEach((c, i) => {
    const cell = row.getCell(i + 1);
    cell.font = {
      name: "微软雅黑",
      size: 10,
      bold: typeof c === "object" ? (c.bold ?? false) : false,
      color:
        typeof c === "object" && c.color
          ? { argb: c.color }
          : { argb: "FF2A2A3C" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE0E0E0" } },
      bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
      left: { style: "thin", color: { argb: "FFE0E0E0" } },
      right: { style: "thin", color: { argb: "FFE0E0E0" } },
    };
    if (options?.fillColor) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: options.fillColor },
      };
    }
  });
}

/** 读取文件内容，失败返回空 */
function safeRead(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "(文件不存在)";
  }
}

/** 读取 works 目录文件列表 */
function listWorks(): string[] {
  const worksDir = path.join(ROOT, "works");
  try {
    return fs
      .readdirSync(worksDir)
      .filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "_template.md")
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

// ============================================================
// 主生成逻辑
// ============================================================

async function main() {
  // 确保输出目录存在
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "造化坊 · Claude";
  wb.created = new Date();
  wb.worksheets = [];

  // ---- Sheet 1: 造化坊简介 ----
  {
    const sheet = wb.addWorksheet("造化坊简介", {
      properties: { tabColor: { argb: "FF4A90D9" } },
    });
    sheet.getColumn(1).width = 18;
    sheet.getColumn(2).width = 50;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 50;

    addTitle(sheet, "🏭 造化坊 (Creation Forge)", "汇报说明书 · 生成于 " + new Date().toLocaleDateString("zh-CN"));

    addHeader(sheet, ["板块", "内容", "板块", "内容"]);
    const info = [
      ["项目全称", "造化坊 (Creation Forge)", "版本号", "0.1.0"],
      ["定位", "AI 时代的新学习思想实践场", "载体", "独立游戏开发"],
      ["核心理念", "定一个项目 → 遇到问题 → 学需要的知识 → 解决问题 → 完成", "", ""],
      ["核心信条", "匠心造化，万物可成", "", ""],
      [
        "AI 双重角色",
        "① 即时学习引擎 —— 卡住了就问，学习从「检索」变「对话」\n② 认知模式转换器 —— 「学会」=「知道怎么驾驭 AI 做出来」",
        "",
        "",
      ],
      [
        "学习方式",
        "项目制学习 —— 不由课本决定学什么，由你选的项目决定。\n当前活跃项目：GAME-002 开仙门（Godot 4.7）+ 小红书自媒体内容线",
        "",
        "",
      ],
      [
        "价值观",
        "玩法原型 > 画面精美\n快速迭代 > 一次做对\n完成发布 > 无限打磨",
        "",
        "",
      ],
    ];
    info.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFF8F8FC" : "FFFFFFFF" });
    });
  }

  // ---- Sheet 2: 近期动态 ----
  {
    const sheet = wb.addWorksheet("近期动态", {
      properties: { tabColor: { argb: "FFE85D3A" } },
    });
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 50;
    sheet.getColumn(4).width = 50;

    addTitle(sheet, "📡 近期动态", "最近两周造化工坊发生了什么");

    // 2.1 工作日志
    addHeader(sheet, ["日期", "类型", "标题", "说明"]);
    const works = listWorks();
    const workDescs: Record<string, string> = {
      "2026-07-22-开场黑幕UI制作.md": "游戏界面制作工作流 — 梳理 UI 制作标准化流程，以开场黑幕为实战案例走通全流程",
      "2026-07-21-workflow-solidified.md": "道具图标工作流固化 — 三个风格案例验证后，将流程固化为标准工作流文档",
      "2026-07-21-workflow-system.md": "标准化工作流管理体系 — 双层结构（5 流程文档 + 3 SKILL），统一人机协作流程",
      "2026-07-21-workflow-maintenance.md": "工作流文档维护 — 手动巡检更新多份文档，确认 SKILL 存放位置与共享局限性",
      "2026-07-21-xiaohongshu-post13-14.md": "小红书 2 期新帖 — 工作流管理 + 游戏图标管线转为图文帖子",
      "2026-07-21-clash-royale-icons.md": "皇室战争风格道具图标 — Supercell 3D cel-shaded + 三国题材融合",
      "2026-07-21-asset-pipeline.md": "Lovart + Photoshop 道具图标生产线 — 1024→256 二次元风格批量产出",
      "2026-07-20-xiaohongshu-restructure.md": "小红书项目重构 — 目录扁平化（14 主题统一为日期-主题），Pixso 单文件导入",
      "2026-07-20-remove-preset-learning-path.md": "去除预设三阶段学习路径 — 回归项目制学习本意",
      "2026-07-17-xiaohongshu-restructure.md": "小红书项目 4 库结构重组 — 文案库/HTML库/Pixso截图/ + CLAUDE.md",
      "2026-07-17-xiaohongshu-post11-pixso-fix.md": "post-11 产出 + Pixso 四问题修复 — 嵌套/命名/单图/对齐",
      "2026-07-17-game002-onboarding.md": "GAME-002「开仙门」项目接入 — 35 脚本/4721 行/10 CSV，Godot 4.7",
      "2026-07-16-pixso-layout.md": "Pixso 排版设计 — v2 暗色模板 + MCP 协作指南 + 三轮设计迭代",
      "2026-07-15-first-xiaohongshu-post.md": "第一篇小红书发布记录 — 造化坊理念首次对外传播",
      "2026-07-15-ai-era-action.md": "AI 时代行动方案 — 核心理念体系建设的执行计划",
    };
    works.forEach((w, idx) => {
      const date = w.substring(0, 10);
      addRow(
        sheet,
        [date, "工作日志", w, workDescs[w] ?? "—"],
        { fillColor: idx % 2 === 0 ? "FFFFF8F0" : "FFFFFFFF" }
      );
    });

    sheet.addRow([]);

    // 2.2 Git 提交
    addHeader(sheet, ["日期", "类型", "提交信息", "Hash"]);
    addRow(
      sheet,
      ["2026-07-15", "feat", "init Spark Forge project structure", "d4a599c"],
      { fillColor: "FFFFF8F0" }
    );

    sheet.addRow([]);

    // 2.3 活跃项目
    addHeader(sheet, ["项目", "状态", "引擎", "说明"]);
    addRow(sheet, [
      "GAME-002「开仙门」",
      "🟢 活跃开发中",
      "Godot 4.x",
      "修仙题材策略游戏。已建立完整协作体系（宪法/角色/5 阶段 SOP/质量体系/AI 记忆），游戏数据采用 CSV 驱动（card/enemy/form/peak/spirit/wave 等表）",
    ]);
    addRow(sheet, [
      "tutorial/01-hello-canvas",
      "🟡 教程项目（稳定）",
      "Phaser 3.80+",
      "Phaser 入门教程，了解项目结构和渲染循环",
    ]);
    addRow(sheet, [
      "核心理念体系",
      "🟢 进行中",
      "文档",
      "完善 AI 时代新学习思想文档体系。截至 07-17：删除预设三阶段学习路径，学习内容由实际项目驱动。",
    ]);
  }

  // ---- Sheet 3: 设计 ----
  {
    const sheet = wb.addWorksheet("设计", {
      properties: { tabColor: { argb: "FF7B61FF" } },
    });
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 50;
    sheet.getColumn(4).width = 50;

    addTitle(sheet, "🎨 设计体系", "项目架构设计、协作体系设计、视觉设计");

    // 3.1 项目架构
    addHeader(sheet, ["层级", "组件", "说明", "备注"]);
    const arch = [
      ["顶层配置", "CLAUDE.md / settings.json", "AI 行为规范 & 项目配置", "项目入口，控制 AI 协作行为"],
      ["文档层", "docs/zh-CN/", "中文文档（宣言/技术栈/工作流/结构/规范/术语）", "项目知识库主阵地"],
      ["共享层", "shared/types + shared/utils", "跨项目复用的类型定义和工具函数", "npm workspaces 子包"],
      ["模板层", "templates/game-phaser + game-godot", "新项目快速启动模板", "Vite + Phaser 或 Godot"],
      ["项目层", "projects/GAME-002 + xiaohongshu + tutorial + originals + sandbox", "两个活跃项目 + 教程/原创/实验", "GAME-002(Godot 4.7) + 小红书自媒体"],
      ["工具层", "tools/", "脚手架、日志生成、报告生成等脚本", "开发效率工具"],
      ["工作层", "works/", "一事一记 + 视频草案", "每个问题都是一个交付"],
      ["工作流", "docs/workflows/", "标准化协作流程（双层：知识层+SKILL）", "5 个流程 / 3 个 SKILL"],
      ["知识库", "docs/tool-guides/", "工具软件知识库（Git/GitHub/Pixso）", "介绍+操作+人机协作"],
    ];
    arch.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFF4F0FF" : "FFFFFFFF" });
    });

    sheet.addRow([]);

    // 3.2 设计文档索引
    addHeader(sheet, ["类别", "文档", "路径", "说明"]);
    const designDocs = [
      ["核心理念", "宣言", "docs/zh-CN/manifesto.md", "AI 时代新学习思想宣言"],
      ["核心理念", "运转线路图", "docs/zh-CN/operational-loop.md", "日常循环：问题→解决→产出→记录→视频→发布"],
      ["项目哲学", "01-project-philosophy.md", "docs/zh-CN/", "项目制学习理念与论证"],
      ["技术选型", "02-tech-stack.md", "docs/zh-CN/", "技术栈选型理由与版本"],
      ["工作流", "03-workflow.md", "docs/zh-CN/", "开发工作流定义"],
      ["项目结构", "04-project-structure.md", "docs/zh-CN/", "目录结构与设计意图"],
      ["编码规范", "05-coding-standards.md", "docs/zh-CN/", "TypeScript/Phaser 编码规范"],
      ["Git 规范", "06-git-conventions.md", "docs/zh-CN/", "分支策略与提交规范"],
      ["术语表", "07-glossary.md", "docs/zh-CN/", "项目术语定义"],
      ["用户手册", "user-manual.md", "docs/zh-CN/", "新人上手操作指南"],
      ["小红书", "xiaohongshu-workflow.md", "docs/zh-CN/", "自媒体发布流程"],
      ["视觉设计", "Pixso MCP", "http://127.0.0.1:3667/mcp", "连接 Pixso 设计工具"],
    ];
    designDocs.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFF4F0FF" : "FFFFFFFF" });
    });
  }

  // ---- Sheet 4: 任务 ----
  {
    const sheet = wb.addWorksheet("任务", {
      properties: { tabColor: { argb: "FF4CAF50" } },
    });
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 22;
    sheet.getColumn(4).width = 30;
    sheet.getColumn(5).width = 30;

    addTitle(sheet, "📋 任务看板", "当前进行中和计划中的任务");

    addHeader(sheet, ["#", "状态", "类别", "任务", "备注"]);

    const tasks = [
      ["1", "✅ 已完成", "核心理念", "创建宣言文档 (manifesto.md)", "2026-07-15 完成"],
      ["2", "✅ 已完成", "核心理念", "重构 README 和 CLAUDE.md", "2026-07-15 完成"],
      ["3", "✅ 已完成", "自媒体", "创建小红书素材库 (post-01 ~ post-11)", "2026-07-17 重组为 4 库结构"],
      ["4", "✅ 已完成", "自媒体", "发布第一篇小红书笔记", "2026-07-15 完成"],
      ["5", "✅ 已完成", "项目初始化", "init Spark Forge project structure", "2026-07-15 完成 (d4a599c)"],
      ["6", "✅ 已完成", "核心理念", "去除预设学习路径，文档同步修正", "2026-07-17：删除三阶段Phaser教程规划，学习由实际项目驱动"],
      ["7", "🟢 进行中", "项目", "GAME-002「开仙门」开发（Godot 4.7）", "V0.1 进度 11%"],
      ["8", "✅ 已完成", "项目", "GAME-002 入职引导 & 协作体系磨合", "见 works/2026-07-17-game002-onboarding.md"],
      ["9", "✅ 已完成", "自媒体", "小红书项目 4 库结构重组", "文案库/HTML库/Pixso截图/ + CLAUDE.md"],
      ["10", "🔵 按需", "教程", "教程项目按需创建（不做预设路线）", "模板在 templates/，随时可开工"],
      ["11", "📋 计划中", "自媒体", "持续发布小红书内容", "基于 works/ 视频草案生产 (11 期存量)"],
      ["12", "📋 计划中", "基础设施", "建立汇报体系（本说明书）", "定期更新此 Excel"],
    ];
    tasks.forEach((r, idx) => {
      const status = r[1];
      const fillMap: Record<string, string> = {
        "✅ 已完成": "FFE8F5E9",
        "🟢 进行中": "FFFFF3E0",
        "📋 计划中": "FFF3E5F5",
        "🔵 按需": "FFE3F2FD",
      };
      addRow(sheet, r, {
        fillColor: fillMap[status] ?? (idx % 2 === 0 ? "FFF8F8FC" : "FFFFFFFF"),
      });
    });
  }

  // ---- Sheet 5: 项目与资产地址 ----
  {
    const sheet = wb.addWorksheet("项目与资产地址", {
      properties: { tabColor: { argb: "FFFF9800" } },
    });
    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 55;
    sheet.getColumn(4).width = 40;

    addTitle(sheet, "🔗 项目地址 & 资产地址", "所有项目、资源和平台入口");

    // 5.1 本地项目路径
    addHeader(sheet, ["类别", "名称", "本地路径", "说明"]);
    const paths = [
      ["项目根目录", "造化工坊", "j:\\ceshi\\", "Monorepo 根，npm workspaces"],
      ["活动项目", "GAME-002「开仙门」", "j:\\ceshi\\projects\\GAME-002\\", "Godot 修仙策略游戏"],
      ["教程项目", "01-hello-canvas", "j:\\ceshi\\projects\\tutorial\\01-hello-canvas\\", "Phaser 入门"],
      ["共享类型", "shared/types", "j:\\ceshi\\shared\\types\\", "跨项目 TypeScript 类型定义"],
      ["共享工具", "shared/utils", "j:\\ceshi\\shared\\utils\\", "跨项目工具函数"],
      ["共享资源", "shared/assets", "j:\\ceshi\\shared\\assets\\", "音频 + 字体资源（结构已建）"],
      ["Phaser 模板", "game-phaser", "j:\\ceshi\\templates\\game-phaser\\", "新 Phaser 项目模板"],
      ["Godot 模板", "game-godot", "j:\\ceshi\\templates\\game-godot\\", "新 Godot 项目模板"],
      ["开发工具", "tools/", "j:\\ceshi\\tools\\", "脚手架 + 日志 + 报告生成"],
      ["工作日志", "works/", "j:\\ceshi\\works\\", "一事一记 + 视频草案"],
      ["中文文档", "docs/zh-CN/", "j:\\ceshi\\docs\\zh-CN\\", "项目知识库主阵地"],
      ["小红书素材", "projects/xiaohongshu/", "j:\\ceshi\\projects\\xiaohongshu\\", "自媒体发布素材库"],
      ["工具知识库", "docs/tool-guides/", "j:\\ceshi\\docs\\tool-guides\\", "Git/GitHub/Pixso 操作与人机协作"],
      ["汇报输出", "reports/", "j:\\ceshi\\reports\\", "汇报说明书输出目录"],
    ];
    paths.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFFFF4E0" : "FFFFFFFF" });
    });

    sheet.addRow([]);

    // 5.2 外部平台 & 资产
    addHeader(sheet, ["类别", "名称", "地址/标识", "说明"]);
    const external = [
      ["设计工具", "Pixso（MCP 已连接）", "http://127.0.0.1:3667/mcp", "UI 设计，通过 MCP 协议集成"],
      ["代码仓库", "GitHub", "main 分支", "当前分支: main"],
      ["自媒体", "小红书", "projects/xiaohongshu/", "11 期帖子 + 4 库结构 + CLAUDE.md 规范"],
      ["包管理", "npm (workspaces)", "creation-forge@0.1.0", "shared/* + projects/*/*"],
      ["引擎", "Phaser", "3.80+ (2D)", "教程项目主力引擎"],
      ["引擎", "Godot", "4.x (备选)", "GAME-002 主力引擎"],
      ["3D 渲染", "Three.js", "最新稳定版 (按需)", "备选 3D 方案"],
      ["桌面打包", "Electron", "最新稳定版 (按需)", "备选桌面发布方案"],
    ];
    external.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFFFF4E0" : "FFFFFFFF" });
    });
  }

  // ---- Sheet 6: 项目配置 ----
  {
    const sheet = wb.addWorksheet("项目配置", {
      properties: { tabColor: { argb: "FF607D8B" } },
    });
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 55;
    sheet.getColumn(4).width = 40;

    addTitle(sheet, "⚙️ 项目配置一览", "CLI 指令 · MCP 连接器 · 专家/技能 · 自动化");

    // 6.1 项目指令 (CLI commands & npm scripts)
    addHeader(sheet, ["板块", "项目", "详情", "备注"]);
    addRow(sheet, [
      "📌 项目指令",
      "npm run lint",
      "ESLint 代码检查 (ESLint 9.x flat config)",
      "pre-commit hook 自动运行",
    ]);
    addRow(sheet, [
      "📌 项目指令",
      "npm run format",
      "Prettier 格式化整个项目",
      "",
    ]);
    addRow(sheet, [
      "📌 项目指令",
      "npm run format:check",
      "检查格式但不修改 (CI 用)",
      "",
    ]);
    addRow(sheet, [
      "📌 项目指令",
      "npm run scaffold",
      "运行脚手架创建新游戏项目",
      "npx tsx tools/scaffold-game.ts",
    ]);
    addRow(sheet, [
      "📌 项目指令",
      "npm run journal",
      "创建新的工作日志",
      "npx tsx tools/new-journal.ts",
    ]);
    addRow(sheet, [
      "📌 项目指令",
      "npx tsx tools/generate-report.ts",
      "生成本汇报说明书 Excel",
      "输出到 reports/ 目录",
    ]);

    sheet.addRow([]);

    // 6.2 连接器 (MCP Servers)
    addHeader(sheet, ["板块", "项目", "详情", "备注"]);
    addRow(sheet, [
      "🔌 连接器",
      "Pixso MCP",
      "类型: SSE | URL: http://127.0.0.1:3667/mcp",
      "UI 设计工具集成",
    ]);

    sheet.addRow([]);

    // 6.3 专家 & 技能 (Skills)
    addHeader(sheet, ["板块", "项目", "详情", "备注"]);
    const skills = [
      ["🧠 技能", "code-review", "代码审查 — 检查正确性/复用/简化", "按需触发"],
      ["🧠 技能", "verify", "验证代码修改是否真正生效", "运行应用观察行为"],
      ["🧠 技能", "simplify", "代码简化重构 — 不查 bug，只优化质量", "按需触发"],
      ["🧠 技能", "init", "初始化新项目的 CLAUDE.md", "项目启动时使用"],
      ["🧠 技能", "deep-research", "深度调研 — 多源搜索 + 交叉验证 + 引述报告", "复杂调研场景"],
      ["🧠 技能", "update-config", "更新 Claude Code 配置 (settings.json)", "配置变更时使用"],
      ["🧠 技能", "loop", "定时循环执行命令或提示词", "持续监控/轮询场景"],
      ["🧠 技能", "keybindings-help", "自定义键盘快捷键绑定", "个性化配置"],
      ["🧠 技能", "lark-* 系列", "飞书全家桶：审批/日历/文档/任务/多维表格/IM 等", "按需使用"],
      ["🧠 技能", "lovart-api", "AI 图像生成/视频/音频/音乐", "媒体创作场景"],
      ["🧠 技能", "claude-api", "Claude API / Anthropic SDK 参考", "API 开发场景"],
    ];
    skills.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFF0F4F8" : "FFFFFFFF" });
    });

    sheet.addRow([]);

    // 6.4 自动化 (Hooks)
    addHeader(sheet, ["板块", "项目", "详情", "备注"]);
    addRow(sheet, [
      "🤖 自动化",
      "pre-commit hook",
      "提交前自动运行 npm run lint",
      ".claude/settings.json → hooks.pre-commit",
    ]);
    addRow(sheet, [
      "🤖 自动化",
      "权限白名单",
      "允许: npm install / npm run / npx tsx / git status / git diff / git log / git branch / git add / git commit",
      ".claude/settings.json → permissions.allow",
    ]);

    sheet.addRow([]);

    // 6.5 AI 行为模式
    addHeader(sheet, ["板块", "项目", "触发条件", "行为准则"]);
    addRow(sheet, [
      "🎭 AI 模式",
      "协作者 (Collaborator)",
      "创意工作：设计游戏/构思机制/叙事",
      "平等对话，用「我们」；提出替代方案；尊重用户创意决定",
    ]);
    addRow(sheet, [
      "🎭 AI 模式",
      "导师 (Mentor)",
      "学习场景：遇到困难/提问",
      "先解释「为什么」再「怎么做」；标注难度等级（入门/进阶/高级）",
    ]);
    addRow(sheet, [
      "🎭 AI 模式",
      "加速器 (Accelerator)",
      "重复性工作/明确要求快速实现",
      "快速生成代码，减少解释；直接完整实现；遵循既有模式",
    ]);

    sheet.addRow([]);

    // 6.6 技术栈
    addHeader(sheet, ["板块", "技术", "版本", "用途"]);
    const tech = [
      ["🛠️ 技术栈", "Node.js", "24.x", "运行时"],
      ["🛠️ 技术栈", "TypeScript", "5.x (strict)", "语言"],
      ["🛠️ 技术栈", "Vite", "6.x", "构建工具"],
      ["🛠️ 技术栈", "Phaser", "3.80+", "2D 游戏引擎（主力）"],
      ["🛠️ 技术栈", "Vitest", "最新稳定版", "测试框架"],
      ["🛠️ 技术栈", "ESLint", "9.x (flat config)", "代码检查"],
      ["🛠️ 技术栈", "Prettier", "3.x", "代码格式化"],
      ["🛠️ 技术栈", "npm", "11.x", "包管理"],
      ["🛠️ 技术栈", "Three.js", "最新稳定版（按需）", "3D 渲染"],
      ["🛠️ 技术栈", "Electron", "最新稳定版（按需）", "桌面打包"],
      ["🛠️ 技术栈", "Godot", "4.x（GAME-002 在用）", "备选游戏引擎"],
      ["🛠️ 技术栈", "ExcelJS", "最新版", "Excel 报告生成"],
    ];
    tech.forEach((r, idx) => {
      addRow(sheet, r, { fillColor: idx % 2 === 0 ? "FFF0F4F8" : "FFFFFFFF" });
    });
  }

  // ============================================================
  // 写入文件
  // ============================================================
  await wb.xlsx.writeFile(OUT_FILE);
  console.log(`✅ 汇报说明书已生成: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ 生成失败:", err);
  process.exit(1);
});
