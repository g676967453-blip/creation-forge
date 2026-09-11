# -*- coding: utf-8 -*-
import json
import sys
import urllib.request

URI = "http://127.0.0.1:9080/mcp"
h = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


def log(s):
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def post(p, timeout=30):
    req = urllib.request.Request(
        URI, data=json.dumps(p, ensure_ascii=False).encode("utf-8"), headers=h
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        sid = r.headers.get("mcp-session-id")
        if sid:
            h["mcp-session-id"] = sid
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    body = "\n".join(parts) if parts else raw
    return json.loads(body) if body.strip() else None


post(
    {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "t", "version": "1"},
        },
    }
)
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass


def run(code: str):
    o = post(
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "execute_editor_script", "arguments": {"code": code}},
        }
    )
    res = o.get("result") or {}
    text = ((res.get("content") or [{}])[0]).get("text")
    sc = res.get("structuredContent")
    return text, sc


tests = []
tests.append('_custom_print("hi")')
tests.append(
    """var r = edited_scene
_custom_print(str(r))
"""
)
tests.append(
    """var r = edited_scene
_custom_print(r.name)
"""
)
tests.append(
    """var r = edited_scene
var n = r.get_node_or_null("UI/Overlays/Menu/VBox/Title")
_custom_print(str(n))
if n != null:
	_custom_print(n.text)
	var rect = n.get_global_rect()
	_custom_print(str(rect.position.x))
	_custom_print(str(rect.position.y))
	_custom_print(str(rect.size.x))
	_custom_print(str(rect.size.y))
"""
)
tests.append(
    """var r = edited_scene
var paths = ["UI/Overlays/Menu/VBox/Title", "UI/Overlays/Menu/VBox/StartButton"]
for i in range(paths.size()):
	var p = paths[i]
	var n = r.get_node_or_null(p)
	if n == null:
		_custom_print(p + "=missing")
		continue
	var rect = n.get_global_rect()
	_custom_print(p)
	_custom_print(str(rect.position.x) + "," + str(rect.position.y) + "," + str(rect.size.x) + "," + str(rect.size.y))
	if n is Label:
		_custom_print("T:" + n.text)
	if n is Button:
		_custom_print("B:" + n.text)
"""
)

for i, code in enumerate(tests):
    text, sc = run(code)
    log(f"TEST{i} text={text}")
    log(f"TEST{i} sc={json.dumps(sc, ensure_ascii=False)[:500]}")
