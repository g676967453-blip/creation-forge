/**
 * 个人待办文件读写（docs/个人待办.md）
 * 供 dashboard-server 本地 API 与 CLI 共用
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
export const TODO_FILE = path.join(ROOT, "docs", "个人待办.md");

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

export function getTodoFilePath(): string {
  return TODO_FILE;
}
