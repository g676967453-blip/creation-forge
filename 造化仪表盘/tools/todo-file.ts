/**
 * 个人待办文件读写（docs/个人待办.md）
 * 供 dashboard-server 本地 API 与 CLI 共用
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");  // 仓库根（本文件在 造化仪表盘/tools/）
export const TODO_FILE = path.join(ROOT, "造化仪表盘", "个人待办.md");

const STATUS_TEXT: Record<string, string> = {
  pending: "📋 待办",
  active: "🟢 进行中",
  done: "✅ 已完成",
  cancelled: "❌ 已取消",
};

function readTodoRaw(): string {
  return fs.readFileSync(TODO_FILE, "utf-8");
}

function writeTodoRaw(content: string): void {
  // 统一 LF，保证跨平台一致
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  fs.writeFileSync(TODO_FILE, normalized, "utf-8");
}

function touchLastUpdated(content: string): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const stamp = `${y}-${m}-${d}`;
  return content.replace(
    /> 最后更新：\d{4}-\d{2}-\d{2}/,
    `> 最后更新：${stamp}`,
  );
}

/**
 * 更新指定 ID 任务的状态列。
 * newStatus: pending | active | done | cancelled
 */
export function updateTaskStatus(
  taskId: string,
  newStatus: "pending" | "active" | "done" | "cancelled",
): { ok: true; id: string; statusText: string } | { ok: false; error: string } {
  if (!taskId || !/^[A-Z]+-\d+$/.test(taskId)) {
    return { ok: false, error: "无效任务 ID" };
  }
  const statusText = STATUS_TEXT[newStatus];
  if (!statusText) return { ok: false, error: "无效状态" };

  let content = readTodoRaw();
  const nl = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 活跃区表格行：| ID | ...
    if (line.startsWith("| " + taskId + " |") || line.startsWith("|" + taskId + "|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 3 && cells[0] === taskId) {
        const oldStatus = cells[2];
        // 只替换状态列，避免误伤任务名
        const re = new RegExp(
          `(\\|\\s*${escapeReg(taskId)}\\s*\\|[^|]*\\|\\s*)${escapeReg(oldStatus)}(\\s*\\|)`,
        );
        if (re.test(line)) {
          lines[i] = line.replace(re, `$1${statusText}$2`);
        } else {
          // 回退：按 cell 重建
          cells[2] = statusText;
          lines[i] = "| " + cells.join(" | ") + " |";
        }
        found = true;
        break;
      }
    }
  }

  if (!found) return { ok: false, error: `未找到任务 ${taskId}` };

  let out = lines.join(nl);
  out = touchLastUpdated(out);
  writeTodoRaw(out);
  return { ok: true, id: taskId, statusText };
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 将活跃区中 ✅/❌ 任务移入周度归档（本地写盘，不经 GitHub）
 */
export function archiveCompletedTasks():
  | { ok: true; count: number }
  | { ok: false; error: string } {
  let content = readTodoRaw();
  const lines = content.split(/\r?\n/);
  const archived: { source: string; id: string; task: string; result: string }[] = [];
  const newLines: string[] = [];
  let inArchive = false;
  let inTable = false;
  let currentCat = "";

  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateShort = `${mm}-${dd}`;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("## 📦")) {
      inArchive = true;
      inTable = false;
    }
    if (inArchive) {
      newLines.push(line);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      currentCat = trimmed.replace(/^## /, "").trim();
      inTable = false;
      newLines.push(line);
      continue;
    }

    if (/^\|[-|\s]+\|$/.test(trimmed)) {
      inTable = true;
      newLines.push(line);
      continue;
    }

    if (inTable && trimmed.startsWith("|") && !/^\|[-|\s]+\|$/.test(trimmed)) {
      const cells = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
      // 跳过表头
      if (cells[0] === "ID" || cells[0] === "来源") {
        newLines.push(line);
        continue;
      }
      if (cells.length >= 3 && (cells[2].includes("✅") || cells[2].includes("❌"))) {
        const emoji = currentCat.substring(0, 2);
        archived.push({
          source: emoji + " " + currentCat.replace(emoji, "").trim(),
          id: cells[0],
          task: cells[1],
          result: cells[2],
        });
        continue;
      }
    }

    newLines.push(line);
  }

  if (archived.length === 0) {
    return { ok: true, count: 0 };
  }

  // 插入归档块：在 ## 📦 之后
  let archiveIdx = newLines.findIndex((l) => l.trim().startsWith("## 📦"));
  if (archiveIdx === -1) {
    newLines.push("", "## 📦 周度归档", "");
    archiveIdx = newLines.length - 3;
  }

  const stamp = `${today.getFullYear()}-${mm}-${dd}`;
  const block = [
    "",
    `> ${dateShort} 归档：${archived.length} 条，从活跃区移入归档。`,
    "",
    "| 来源 | ID | 任务 | 完成日 | 结果 |",
    "|------|----|------|--------|------|",
    ...archived.map(
      (a) =>
        `| ${a.source} | ${a.id} | ${a.task} | ${dateShort} | ${a.result} |`,
    ),
    "",
  ];

  // 插在归档标题后、第一个已有 ### 或表格前
  let insertAt = archiveIdx + 1;
  while (
    insertAt < newLines.length &&
    (newLines[insertAt].trim() === "" ||
      newLines[insertAt].trim().startsWith(">"))
  ) {
    insertAt++;
  }
  // 若紧跟的是旧说明文字，插在 ## 📦 下一行
  insertAt = archiveIdx + 1;
  newLines.splice(insertAt, 0, ...block);

  let out = newLines.join("\n");
  out = touchLastUpdated(out);
  // 顺带刷新最后更新里的日期格式
  out = out.replace(/> 最后更新：.*/, `> 最后更新：${stamp}`);
  writeTodoRaw(out);
  return { ok: true, count: archived.length };
}

export function getTodoFilePath(): string {
  return TODO_FILE;
}
