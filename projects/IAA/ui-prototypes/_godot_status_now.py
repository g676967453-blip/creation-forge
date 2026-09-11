# -*- coding: utf-8 -*-
import json
import sys
import urllib.request

URI = "http://127.0.0.1:9080/mcp"
h = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def post(payload, timeout=30):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(URI, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        sid = r.headers.get("mcp-session-id")
        if sid:
            h["mcp-session-id"] = sid
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    body = "\n".join(parts) if parts else raw
    if not body.strip():
        return None
    return json.loads(body)


post(
    {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "status", "version": "1"},
        },
    }
)
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass


def call(name, args=None):
    o = post(
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": name, "arguments": args or {}},
        }
    )
    if not o:
        return None
    t = (((o.get("result") or {}).get("content") or [{}])[0]).get("text")
    if t is None:
        return o
    try:
        return json.loads(t)
    except Exception:
        return t


# cleanup accidental NewNode
nodes = call("list_nodes", {}) or {}
for path in nodes.get("nodes") or []:
    if str(path).endswith("/NewNode"):
        log("delete " + str(path) + " => " + str(call("delete_node", {"node_path": path})))

info = call("get_project_info")
scene = call("get_current_scene")
editor = call("get_editor_state")
tree = call("get_scene_tree", {"max_depth": 2})

# UI overlay visibility
paths = [
    "/root/Main/UI",
    "/root/Main/UI/HUD",
    "/root/Main/UI/Overlays/Menu",
    "/root/Main/UI/Overlays/LevelClear",
    "/root/Main/UI/Overlays/GameOver",
    "/root/Main/UI/Overlays/Pause",
    "/root/Main/GameRoot/Background",
    "/root/Main/GameRoot/Paddle",
    "/root/Main/GameRoot/Ball",
]
props = {}
for p in paths:
    props[p] = call("get_node_properties", {"node_path": p})

# simplify visible fields
simp = {}
for p, v in props.items():
    if not isinstance(v, dict):
        simp[p] = v
        continue
    # common shapes vary
    data = v
    if "properties" in v and isinstance(v["properties"], dict):
        data = v["properties"]
    keep = {}
    for k in ("visible", "position", "modulate", "text", "name", "type", "node_type", "class"):
        if k in data:
            keep[k] = data[k]
    # sometimes nested
    for k, val in list(data.items())[:30]:
        if k in ("visible", "position", "global_position", "size", "text"):
            keep[k] = val
    simp[p] = keep or {kk: data[kk] for kk in list(data)[:12]}

out = {
    "project": info,
    "current_scene": scene,
    "editor_state": editor,
    "tree_summary": {
        "scene_name": (tree or {}).get("scene_name") if isinstance(tree, dict) else None,
        "total_nodes": (tree or {}).get("total_nodes") if isinstance(tree, dict) else None,
    },
    "node_props": simp,
}
path = OUT = r"J:\ceshi\projects\IAA\ui-prototypes\godot-mcp-status.json"
open(path, "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=2))
log("wrote " + path)
log(json.dumps(out, ensure_ascii=False, indent=2)[:4000])
