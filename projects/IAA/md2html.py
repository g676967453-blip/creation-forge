# -*- coding: utf-8 -*-
"""将 IAA 两份企划 MD 转为带样式的 HTML，输出到 share_html 目录。"""
import pathlib
import markdown

BASE = pathlib.Path(__file__).parent
OUT = BASE / "share_html"
OUT.mkdir(exist_ok=True)

DOCS = [
    ("IAA小队价值主张.md", "IAA小队价值主张.html", "IAA 小队价值主张",
     "小队定位、立项方法论（选品四标准）、三大价值主张、阶段目标与团队资源"),
    ("救火英雄IAA游戏企划.md", "救火英雄IAA游戏企划.html", "救火英雄 IAA 游戏企划书",
     "FC 经典玩法 + 卡通动物包装 + 角色系统与补给队经济微创新，含市场/玩法/商业化/预算/风险"),
]

CSS = """
:root { --primary:#2f6fce; --border:#d9dee5; --bg:#f5f6f8; --text:#2b2f36; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  line-height: 1.75; font-size: 15px;
}
.topbar {
  background: #1f2937; color: #fff; padding: 10px 0;
}
.topbar .inner {
  max-width: 920px; margin: 0 auto; padding: 0 24px;
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
}
.topbar a { color: #93c5fd; text-decoration: none; font-size: 13px; }
.topbar a:hover { text-decoration: underline; }
.topbar .brand { font-size: 13px; color: #cbd5e1; }
.container {
  max-width: 920px; margin: 24px auto 60px; background: #fff;
  padding: 40px 48px 56px; border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
}
h1 { font-size: 26px; border-bottom: 3px solid var(--primary); padding-bottom: 12px; margin-top: 8px; }
h2 { font-size: 20px; margin-top: 34px; border-left: 4px solid var(--primary); padding-left: 12px; }
h3 { font-size: 16px; margin-top: 26px; color: #1f2937; }
p { margin: 10px 0; }
a { color: var(--primary); }
strong { font-weight: 600; }
ul, ol { padding-left: 26px; }
li { margin: 5px 0; }
table {
  width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13.5px;
}
th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
th { background: #eef2f7; font-weight: 600; white-space: nowrap; }
tr:nth-child(even) td { background: #fafbfc; }
blockquote {
  margin: 14px 0; padding: 10px 16px; background: #f4f8fc;
  border-left: 4px solid var(--primary); color: #445; border-radius: 0 6px 6px 0;
}
blockquote p { margin: 4px 0; }
code {
  background: #eef1f5; padding: 2px 6px; border-radius: 4px;
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace; font-size: 13px;
}
pre {
  background: #282c34; color: #e6e6e6; padding: 16px 18px; border-radius: 8px;
  overflow-x: auto; line-height: 1.5;
}
pre code { background: none; color: inherit; padding: 0; font-size: 13px; }
hr { border: none; border-top: 1px solid var(--border); margin: 26px 0; }
.footer { text-align: center; color: #8a9199; font-size: 12.5px; padding: 12px 0 40px; }
@media (max-width: 720px) {
  .container { padding: 24px 18px 40px; margin: 12px auto 30px; }
  th, td { padding: 6px 8px; }
}
@media print {
  .topbar { display: none; }
  body { background: #fff; }
  .container { box-shadow: none; margin: 0; max-width: none; }
}
"""

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>{css}</style>
</head>
<body>
<div class="topbar"><div class="inner">
  <a href="index.html">← 返回目录</a>
  <span class="brand">IAA 小队 · 内部资料</span>
</div></div>
<div class="container">
{body}
</div>
<div class="footer">IAA 小队内部资料 · 仅供立项评审使用 · 局域网共享</div>
</body>
</html>
"""

INDEX_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IAA 企划案 · 目录</title>
<style>{css}</style>
</head>
<body>
<div class="topbar"><div class="inner">
  <span class="brand">IAA 小队 · 内部资料</span>
</div></div>
<div class="container">
<h1>IAA 企划案 · 目录</h1>
<p>以下文档为 IAA 小队立项企划资料，点击标题查看。共 {count} 份。</p>
{cards}
</div>
<div class="footer">IAA 小队内部资料 · 仅供立项评审使用 · 局域网共享</div>
</body>
</html>
"""

def build_page(title, body_md):
    body = markdown.markdown(body_md, extensions=["extra", "sane_lists"], output_format="html5")
    return PAGE_TEMPLATE.format(title=title, css=CSS, body=body)

def build_index(cards_html):
    return INDEX_TEMPLATE.format(css=CSS, count=len(DOCS), cards=cards_html)

def main():
    cards = []
    for src, out, title, desc in DOCS:
        md_text = (BASE / src).read_text(encoding="utf-8")
        page = build_page(title, md_text)
        (OUT / out).write_text(page, encoding="utf-8")
        print(f"[OK] {src} -> {out} ({len(page)} bytes)")
        cards.append(
            f'<div style="margin:18px 0;padding:18px 22px;border:1px solid var(--border);'
            f'border-radius:8px;background:#fafbfc;">'
            f'<h2 style="margin-top:0;border:none;padding:0;"><a href="{out}">{title}</a></h2>'
            f'<p style="margin:6px 0 0;color:#556;">{desc}</p>'
            f'<p style="margin:8px 0 0;font-size:13px;color:#8a9199;">{out}</p>'
            f'</div>'
        )
    (OUT / "index.html").write_text(build_index("\n".join(cards)), encoding="utf-8")
    print(f"[OK] index.html")

if __name__ == "__main__":
    main()
