#!/usr/bin/env python3
"""Pixso MCP 调用工具 — 会话复用 + JSON 请求封装"""
import json
import urllib.request
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SESSION_ID = 'c4d98c2e-4b28-4fce-8edc-c614fbb03ebc'
COUNTER = [100]

def call_pixso(method, args):
    """调用 Pixso MCP 工具，返回解析后的 result.content 文本"""
    COUNTER[0] += 1
    payload = json.dumps({
        'jsonrpc': '2.0',
        'id': COUNTER[0],
        'method': 'tools/call',
        'params': {'name': method, 'arguments': args}
    }, ensure_ascii=False)

    req = urllib.request.Request(
        'http://127.0.0.1:3667/mcp',
        data=payload.encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'mcp-session-id': SESSION_ID
        }
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        result = resp.read().decode('utf-8')
        for line in result.split('\n'):
            if line.startswith('data: '):
                data = json.loads(line[6:])
                content = data.get('result', {}).get('content', [])
                if content:
                    return content[0].get('text', json.dumps(content, ensure_ascii=False))
                return json.dumps(data.get('result', {}), ensure_ascii=False)
    return None


if __name__ == '__main__':
    # 测试调用
    result = call_pixso('fetch_context', {'include_schema': False, 'include_map': False})
    print(result[:500])
