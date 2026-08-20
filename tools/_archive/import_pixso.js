#!/usr/bin/env node
/**
 * Pixso MCP 导入脚本
 *
 * 绕过 Claude Code SSE 握手问题，直连 Pixso MCP 导入 HTML 并自动重命名 frame。
 *
 * 用法:
 *   node .claude/import_pixso.js <html路径> [frame名称]
 *   node .claude/import_pixso.js index.html "2026-07-23-主题"
 *
 *   不指定 frame 名称时，从 HTML 路径自动提取（父目录名）。
 *
 * 依赖: Node.js 24+ (内置 fetch)
 */

const PIXSO_MCP = "http://127.0.0.1:3667/mcp";
const fs = await import("fs");

// ── MCP client ───────────────────────────────────────────

async function rpc(method, params, id, sessionId) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(PIXSO_MCP, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

  if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
  const text = await res.text();
  const match = text.match(/^data:\s*(.+)$/m);
  if (!match) return { result: undefined, sessionId: res.headers.get("mcp-session-id") };
  const data = JSON.parse(match[1]);
  if (data.error) throw new Error(`${method}: ${data.error.message}`);
  return { result: data.result, sessionId: res.headers.get("mcp-session-id") || sessionId };
}

async function rpcNotify(method, params, sessionId) {
  await fetch(PIXSO_MCP, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "mcp-session-id": sessionId,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params }),
  });
}

async function initSession() {
  const init = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "import_pixso", version: "1.0.0" },
  }, 1);
  if (!init.sessionId) throw new Error("未获取到 MCP session ID。Pixso 桌面端是否已打开？");
  await rpcNotify("notifications/initialized", {}, init.sessionId);
  return init.sessionId;
}

// ── main ─────────────────────────────────────────────────

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    console.error("用法: node .claude/import_pixso.js <html路径> [frame名称]");
    process.exit(1);
  }

  // 推断 frame 名称
  const pathParts = htmlPath.replace(/\\/g, "/").split("/");
  const dirName = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : null;
  const frameName = process.argv[3] || dirName || "imported";

  // 1. Read HTML
  const html = fs.readFileSync(htmlPath, "utf-8");
  console.log(`📄 ${htmlPath} (${html.length.toLocaleString()} 字符)`);

  // 2. Init session
  const sid = await initSession();
  console.log(`🔗 Session: ${sid.slice(0, 8)}...`);

  // 3. Import
  process.stdout.write("🎨 导入中...");
  const importResult = await rpc("tools/call", {
    name: "code_to_design",
    arguments: { htmlStr: html },
  }, 2, sid);

  const importText = importResult.result.content[0].text;
  const importData = JSON.parse(importText);
  if (!importData.success) throw new Error("导入失败: " + importText);
  console.log(" 完成");

  // 4. Rename — find the frame named "html" (default code_to_design name)
  const frames = await rpc("tools/call", {
    name: "get_top_level_frames",
    arguments: { type: "frame" },
  }, 3, sid);

  const frameList = JSON.parse(frames.result.content[0].text);
  const newFrame = frameList
    .flatMap((p) => p.frames.map((f) => ({ ...f, pageId: p.pageId, pageName: p.pageName })))
    .find((f) => f.frameName === "html");

  if (newFrame) {
    process.stdout.write(`🏷️  重命名 "${newFrame.frameName}" → "${frameName}"...`);
    await rpc("tools/call", {
      name: "apply_design",
      arguments: { operations: `U("${newFrame.frameId}", {name: "${frameName}"})` },
    }, 4, sid);
    console.log(" 完成");
  } else {
    console.log("⚠️  未找到默认名称 'html' 的 frame，跳过重命名（可能已存在同名 frame）");
  }

  console.log(`\n✅ 完成 — Pixso frame: "${frameName}"`);
}

main().catch((err) => {
  console.error("\n❌ 失败:", err.message);
  process.exit(1);
});
