/**
 * 造化坊仪表盘本地服务器
 * 启动: npx tsx tools/dashboard-server.ts
 * 访问: http://localhost:3456
 */

import express from "express";
import { generateHTML } from "./generate-dashboard";
import { collectData, writeLog } from "./collect-data";

const app = express();
const PORT = 3456;

app.use(express.json());

// 仪表盘主页（动态生成）
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(generateHTML());
});

// API: 获取最新数据
app.get("/api/data", (_req, res) => {
  res.json(collectData());
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

app.listen(PORT, () => {
  console.log(`🏭 造化坊仪表盘已启动: http://localhost:${PORT}`);
  console.log("   按 Ctrl+C 停止");
});
