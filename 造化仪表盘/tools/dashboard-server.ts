/**
 * 造化坊仪表盘本地服务器
 * 启动: npx tsx 造化仪表盘/tools/dashboard-server.ts
 * 访问: http://localhost:3456
 *
 * 本地任务 API（快速完成/取消，不依赖 GitHub Token）：
 *   POST /api/tasks/complete  { id: "F-005" }
 *   POST /api/tasks/cancel    { id: "F-005" }
 * 板块独立盘：启动时刷新 reports/ 下板块{2,3,4,5}-*.html，经 /board/ 静态服务，
 *   并在 GET / 侧栏注入入口条（本机模式；GH Pages 静态产物不受影响）
 */

import express from "express";
import { generateHTML } from "./generate-dashboard";
import { collectData, writeLog } from "./collect-data";
import { updateTaskStatus, archiveCompletedTasks } from "./todo-file";
import { boardEntryBarHtml, writeAllBoardDashboards } from "./generate-board-dashboards";
import { REPORTS_DIR } from "./board-dashboard-lib";

const app = express();
const PORT = 3456;

app.use(express.json());

// 板块独立盘静态产物（启动时刷新；file:// 打开同一份文件，链接基准一致）
app.use("/board", express.static(REPORTS_DIR));

// 仪表盘主页（动态生成，默认任务页；侧栏注入板块独立盘入口，仅本机模式）
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  let html = generateHTML();
  const anchor = '<div class="sidebar-foot">';
  if (html.includes(anchor)) html = html.replace(anchor, boardEntryBarHtml() + anchor);
  res.send(html);
});

// API: 获取最新数据
app.get("/api/data", (_req, res) => {
  res.json(collectData());
});

// API: 轻量板块变动监控（供外部轮询/通知使用）
app.get("/api/activity", (_req, res) => {
  res.json({ boards: collectData().boards });
});

// API: 完成任务（写本地 造化仪表盘/个人待办.md）
app.post("/api/tasks/complete", (req, res) => {
  try {
    const id = String(req.body?.id || "").trim();
    const result = updateTaskStatus(id, "done");
    if (!result.ok) return res.status(400).json(result);
    res.json({ ...result, personalTasks: collectData().personalTasks });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// API: 取消任务
app.post("/api/tasks/cancel", (req, res) => {
  try {
    const id = String(req.body?.id || "").trim();
    const result = updateTaskStatus(id, "cancelled");
    if (!result.ok) return res.status(400).json(result);
    res.json({ ...result, personalTasks: collectData().personalTasks });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// API: 周度归档（本地写盘）
app.post("/api/tasks/archive", (_req, res) => {
  try {
    const result = archiveCompletedTasks();
    if (!result.ok) return res.status(400).json(result);
    res.json({ ...result, personalTasks: collectData().personalTasks });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// API: 写入日志
app.post("/api/log", (req, res) => {
  try {
    const { date, title, problem, ai, output, project } = req.body;
    if (!date || !title) return res.status(400).json({ error: "date 和 title 为必填项" });
    const filename = writeLog(date, title, problem || "", ai || "", output || "", project || "");
    res.json({ ok: true, filename });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 启动时刷新板块独立盘（/board/ 与 file:// 共用同一份产物）
writeAllBoardDashboards();

app.listen(PORT, "127.0.0.1", () => {
  console.log(`🏭 造化坊仪表盘已启动: http://127.0.0.1:${PORT}`);
  console.log("   默认页：板块总览 · 本地完成/取消 API 已启用 · /api/activity 变动监控");
  console.log("   板块独立盘：侧栏底部入口条 / /board/ 静态目录（本机模式）");
  console.log("   按 Ctrl+C 停止");
});
