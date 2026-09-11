# -*- coding: utf-8 -*-
import json
import random
import sys
import urllib.request

URI = "http://127.0.0.1:9080/mcp"


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


def post(payload: dict, timeout=30):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(URI, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        sid = resp.headers.get("mcp-session-id")
        if sid:
            headers["mcp-session-id"] = sid
        raw = resp.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    if parts:
        return "\n".join(parts)
    return raw


init = post(
    {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "probe", "version": "1"},
        },
    }
)
log("INIT " + init[:500])
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
    log("NOTIFY ok")
except Exception as e:
    log(f"NOTIFY {e}")

tools_raw = post({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
obj = json.loads(tools_raw)
tools = obj.get("result", {}).get("tools") or []
log(f"tools={len(tools)}")
names = [t.get("name") for t in tools]
# print all names in chunks
for i in range(0, len(names), 20):
    log("NAMES " + ", ".join(names[i : i + 20]))

# try promising tools
candidates = [
    n
    for n in names
    if any(
        k in n.lower()
        for k in [
            "scene",
            "project",
            "editor",
            "runtime",
            "screenshot",
            "node",
            "tree",
            "open",
            "info",
            "state",
        ]
    )
]
log("CANDIDATES " + ", ".join(candidates[:40]))


def call(name, arguments=None):
    raw = post(
        {
            "jsonrpc": "2.0",
            "id": random.randint(1, 999999),
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments or {}},
        },
        timeout=60,
    )
    return raw


# Prefer a few known Godot MCP native tool names from earlier codebase scan
prefer = [
    "get_project_info",
    "get_editor_screenshot",
    "take_editor_screenshot",
    "get_scene_tree",
    "get_open_scripts",
    "list_nodes",
    "get_runtime_info",
]
for n in prefer:
    if n in names:
        try:
            r = call(n, {})
            log(f"CALL {n} => " + r[:400].replace("\n", " "))
        except Exception as e:
            log(f"CALL {n} ERR {e}")

# If schema required, print inputSchema for first 5 candidates
for n in (candidates[:8] if candidates else names[:8]):
    t = next((x for x in tools if x.get("name") == n), None)
    if not t:
        continue
    schema = t.get("inputSchema") or t.get("arguments") or {}
    log(f"SCHEMA {n} => " + json.dumps(schema, ensure_ascii=False)[:300])
    # try empty or minimal
    try:
        r = call(n, {})
        log(f"TRY {n} => " + r[:350].replace("\n", " "))
    except Exception as e:
        log(f"TRY {n} ERR {e}")
