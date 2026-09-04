/**
 * 造化坊仪表盘本地服务器
 * 启动: npx tsx tools/dashboard-server.ts
 * 访问: http://localhost:3456
 *
 * 本地任务 API（快速完成/取消，不依赖 GitHub Token）：
 *   POST /api/tasks/complete  { id: "F-005" }
 *   POST /api/tasks/cancel    { id: "F-005" }
 */

import express from "express";
import { generateHTML } from "./generate-dashboard";
import { collectData, writeLog } from "./collect-data";
import { updateTaskStatus, archiveCompletedTasks } from "./todo-file";

const app = express();
const PORT = 3456;

app.use(express.json());

// 仪表盘主页（动态生成，默认任务页）
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(generateHTML());
});

// API: 获取最新数据
app.get("/api/data", (_req, res) => {
  res.json(collectData());
});

// API: 完成任务（写本地 docs/个人待办.md）
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

app.listen(PORT, "127.0.0.1", () => {
  console.log(`🏭 造化坊仪表盘已启动: http://127.0.0.1:${PORT}`);
  console.log("   默认页：任务 · 本地完成/取消 API 已启用");
  console.log("   按 Ctrl+C 停止");
});
