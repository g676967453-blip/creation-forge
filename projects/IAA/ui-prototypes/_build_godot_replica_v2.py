# -*- coding: utf-8 -*-
"""Godot UI replica v2: UTF-8 Chinese, absolute layout, asset board by category native size."""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path

ROOT = Path(r"J:\ceshi\projects\IAA")
ASSETS = ROOT / "fire-hero-godot" / "assets"
OUT = ROOT / "ui-prototypes" / "godot-replica"
SCREENS = OUT / "screens-v2"
SCREENS.mkdir(parents=True, exist_ok=True)


def data_uri(rel: str) -> str:
    p = ASSETS / rel
    if not p.exists():
        raise FileNotFoundError(p)
    b64 = base64.b64encode(p.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def img_size(rel: str) -> tuple[int, int]:
    # PNG IHDR
    data = (ASSETS / rel).read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(rel)
    w = int.from_bytes(data[16:20], "big")
    h = int.from_bytes(data[20:24], "big")
    return w, h


A = {
    "bg": "backgrounds/bg_level_default.png",
    "winN": "props/windows/window_normal.png",
    "winF1": "props/windows/window_fire_lv1.png",
    "winF2": "props/windows/window_fire_lv2.png",
    "winF3": "props/windows/window_fire_lv3.png",
    "winR": "props/windows/window_rescue.png",
    "winRR": "props/windows/window_rescue_red.png",
    "mat": "props/trampoline/mat.png",
    "fmL": "props/trampoline/fireman_left.png",
    "fmR": "props/trampoline/fireman_right.png",
    "cat": "props/ball/char_cat.png",
    "dog": "props/ball/char_dog.png",
    "panda": "props/ball/char_panda.png",
    "capy": "props/ball/char_capybara.png",
    "fox": "props/ball/char_naruto.png",
    "icLv": "pixel/ui/ui_icon_level.png",
    "icSc": "pixel/ui/ui_icon_score.png",
    "icCn": "pixel/ui/ui_icon_coin.png",
    "icLife": "pixel/ui/ui_icon_life.png",
    "icPause": "pixel/ui/ui_icon_pause.png",
    "icSkill": "pixel/ui/ui_icon_skill.png",
    "icFire": "pixel/ui/ui_icon_fire.png",
    "icRescue": "pixel/ui/ui_icon_rescue.png",
    "itemBag": "props/items/item_bag.png",
    "itemWide": "props/items/item_wide.png",
    "itemHam": "props/items/item_hammer.png",
    "itemExt": "props/items/item_extinguish.png",
    "itemUp": "props/items/item_up.png",
    "itemFb": "props/items/item_fireball.png",
    "vilR": "pixel/villagers/vil_rabbit_front_call.png",
    "vilRc": "pixel/villagers/vil_rabbit_front.png",
    "vilF": "pixel/villagers/vil_fox_front_call.png",
    "vilP": "pixel/villagers/vil_pig_front_call.png",
}

U = {k: data_uri(v) for k, v in A.items()}
S = {k: img_size(v) for k, v in A.items()}

# GameConstants
VIEW_W, VIEW_H = 450, 800
BRICK_W, BRICK_H, BRICK_GAP, BRICK_COLS = 48, 48, 4, 7
GRID_TOP = 80
PADDLE_W, PADDLE_H, PADDLE_Y = 92, 18, 650
facade_total = BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_GAP
facade_x0 = int((VIEW_W - facade_total) * 0.5)  # 39


def css_common() -> str:
    return f"""
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{margin:0;padding:0;background:#0d121c}}
.phone{{position:relative;width:{VIEW_W}px;height:{VIEW_H}px;overflow:hidden;background:#0d121c;
  font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif;color:#fff}}
.bg{{position:absolute;left:0;top:0;width:{VIEW_W}px;height:{VIEW_H}px;display:block}}
.win{{position:absolute;width:{BRICK_W}px;height:{BRICK_H}px;image-rendering:pixelated}}
.paddle-mat{{position:absolute;image-rendering:pixelated}}
.paddle-fm{{position:absolute;image-rendering:pixelated}}
.ball{{position:absolute;image-rendering:pixelated}}
.hud-icon{{position:absolute;width:16px;height:16px;image-rendering:pixelated}}
.hud-text{{position:absolute;font-size:15px;font-weight:700;line-height:16px;white-space:nowrap;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.goal-text{{position:absolute;left:8px;top:44px;width:434px;height:28px;text-align:center;
  font-size:15px;font-weight:700;line-height:28px;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.hint{{position:absolute;left:25px;top:752px;width:400px;text-align:center;font-size:12px;color:#a6b8cc;font-weight:600;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.btn{{position:absolute;border-radius:10px;text-align:center;font-weight:800;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif;box-shadow:0 4px 0 rgba(0,0,0,.22)}}
.btn-main{{background:#ffb020;color:#1a1208;font-size:16px;line-height:44px}}
.btn-ad{{background:#345c94;color:#fff;font-size:16px;line-height:44px}}
.btn-ghost{{background:rgba(255,255,255,.12);color:#fff;font-size:16px;line-height:44px;border:1px solid rgba(255,255,255,.18)}}
.btn-char{{background:#593d1a;color:#ffe9c9;font-size:13px;line-height:1.35;padding:10px 12px}}
.title{{position:absolute;width:420px;left:15px;text-align:center;font-weight:900;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.sub{{position:absolute;width:420px;left:15px;text-align:center;font-size:13px;color:#b2c7e0;font-weight:600;line-height:1.5;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.stats{{position:absolute;width:420px;left:15px;text-align:center;font-size:15px;font-weight:700;line-height:1.6;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.ov{{position:absolute;left:0;top:0;width:{VIEW_W}px;height:{VIEW_H}px}}
.ov-menu{{background:rgba(13,18,26,.92)}}
.ov-level{{background:rgba(13,26,20,.90)}}
.ov-over{{background:rgba(31,13,13,.92)}}
.ov-pause{{background:rgba(13,15,26,.85)}}
.vpad{{position:absolute;width:120px;height:110px;border-radius:999px;background:rgba(255,255,255,.10);
  border:2px solid rgba(255,255,255,.35);color:#fff;font-size:34px;font-weight:800;text-align:center;line-height:110px}}
.skill{{position:absolute;width:130px;height:52px;border-radius:10px;background:#b3401f;color:#fff;font-weight:800;font-size:15px;
  text-align:center;line-height:52px;font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.char-thumb{{position:absolute;image-rendering:pixelated}}
.char-name{{position:absolute;text-align:center;font-size:11px;font-weight:800;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.shop-box{{position:absolute;left:35px;width:380px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.12);border-radius:12px}}
.shop-row{{position:absolute;left:10px;width:360px;height:40px;background:rgba(255,255,255,.06);border-radius:8px}}
.shop-ico{{position:absolute;left:6px;top:6px;width:28px;height:28px;image-rendering:pixelated}}
.shop-info{{position:absolute;left:42px;top:6px;width:210px;font-size:12px;font-weight:700;line-height:1.3;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.shop-price{{position:absolute;right:8px;top:8px;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:800;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
.test-coin{{position:absolute;right:8px;top:46px;padding:6px 10px;border-radius:8px;background:#cc9e1a;color:#1a1208;font-size:12px;font-weight:800;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif}}
"""


def window_grid(pattern: list[list[str]]) -> str:
    """pattern row-major keys: N F1 F2 F3 R RR"""
    key_map = {
        "N": U["winN"],
        "F1": U["winF1"],
        "F2": U["winF2"],
        "F3": U["winF3"],
        "R": U["winR"],
        "RR": U["winRR"],
    }
    parts = []
    for r, row in enumerate(pattern):
        for c, k in enumerate(row):
            x = facade_x0 + c * (BRICK_W + BRICK_GAP)
            y = GRID_TOP + r * (BRICK_H + BRICK_GAP)
            parts.append(
                f'<img class="win" src="{key_map[k]}" style="left:{x}px;top:{y}px" alt="w{r}{c}"/>'
            )
    return "\n".join(parts)


DEFAULT_GRID = [
    ["F2", "N", "F1", "R", "N", "F3", "N"],
    ["N", "F2", "N", "N", "F1", "N", "F2"],
    ["F1", "N", "RR", "N", "F2", "N", "N"],
    ["N", "F3", "N", "F1", "N", "R", "N"],
    ["F2", "N", "N", "N", "F1", "N", "F2"],
    ["N", "F1", "N", "F2", "N", "N", "F3"],
    ["F1", "N", "R", "N", "F2", "N", "N"],
    ["N", "F2", "N", "F1", "N", "N", "F1"],
]


def field_layer(ball_top: int = 400, ball_left: int = 206, show_ball: bool = True) -> str:
    cw, ch = S["cat"]
    mw, mh = S["mat"]
    flw, flh = S["fmL"]
    frw, frh = S["fmR"]
    # paddle center x=225, mat under firemen
    paddle_left = int(VIEW_W / 2 - PADDLE_W / 2)  # 179
    mat_left = paddle_left + int((PADDLE_W - mw) / 2)
    mat_top = PADDLE_Y + 8
    fmL_left = paddle_left - 6
    fmR_left = paddle_left + PADDLE_W - frw + 6
    fm_top = PADDLE_Y - 10
    ball = ""
    if show_ball:
        ball = f'<img class="ball" src="{U["cat"]}" style="left:{ball_left}px;top:{ball_top}px;width:{cw}px;height:{ch}px" alt="ball"/>'
    return f"""
<img class="bg" src="{U['bg']}" alt="bg"/>
{window_grid(DEFAULT_GRID)}
<img class="paddle-fm" src="{U['fmL']}" style="left:{fmL_left}px;top:{fm_top}px;width:{flw}px;height:{flh}px" alt="fl"/>
<img class="paddle-mat" src="{U['mat']}" style="left:{mat_left}px;top:{mat_top}px;width:{mw}px;height:{mh}px" alt="mat"/>
<img class="paddle-fm" src="{U['fmR']}" style="left:{fmR_left}px;top:{fm_top}px;width:{frw}px;height:{frh}px" alt="fr"/>
{ball}
"""


def hud_layer() -> str:
    # TopBar: left 8, top 8, right 8, height ~32, 4 boxes equal
    boxes = [
        (U["icLv"], "3", False),
        (U["icSc"], "2460", True),
        (U["icCn"], "1280", True),
        (U["icLife"], "3", True),
    ]
    gap = 8
    left = 8
    usable = VIEW_W - 16
    box_w = int((usable - gap * 3) / 4)
    parts = []
    x = left
    for ico, text, center in boxes:
        parts.append(
            f'<div style="position:absolute;left:{x}px;top:8px;width:{box_w}px;height:28px;'
            f'background:rgba(10,14,26,.45);border:1px solid rgba(255,255,255,.1);border-radius:8px"></div>'
        )
        parts.append(
            f'<img class="hud-icon" src="{ico}" style="left:{x+4}px;top:14px" alt="i"/>'
        )
        tx = x + box_w // 2 - 12 if center else x + 24
        parts.append(
            f'<div class="hud-text" style="left:{tx}px;top:14px">{text}</div>'
        )
        x += box_w + gap
    parts.append(
        f'<div class="goal-text">火 5　人 3　· 双通道</div>'
    )
    return "\n".join(parts)


def write_screen(name: str, body: str, w: int = VIEW_W, h: int = VIEW_H) -> Path:
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<title>{name}</title>
<style>
{css_common()}
.board{{position:relative;width:{w}px;height:{h}px;background:#0d121c;overflow:hidden;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif;color:#fff}}
</style>
</head>
<body>
<div class="{'phone' if w==VIEW_W and h==VIEW_H else 'board'}" data-name="{name}" style="width:{w}px;height:{h}px">
{body}
</div>
</body>
</html>
"""
    path = SCREENS / f"{name}.html"
    path.write_text(html, encoding="utf-8")
    print(f"wrote {path.name} bytes={path.stat().st_size} utf8-check=", "救火" in html or name.startswith("G06"))
    return path


# ---------- screens ----------

write_screen(
    "G01-Menu",
    field_layer(560, 205)
    + f"""
<div class="ov ov-menu"></div>
<div class="title" style="top:200px;font-size:28px">救火英雄</div>
<div class="sub" style="top:248px">灭火或救人 · 双通道过关<br/>Godot 4.7 · IAA 验证版</div>
<div class="stats" style="top:300px;color:#ffe070">最高分 12840　金币 1280</div>
<div class="btn btn-char" style="left:75px;top:340px;width:300px">角色：小猫 · 敏捷（点击切换）</div>
<div class="btn btn-main" style="left:95px;top:400px;width:260px;height:44px">开始游戏</div>
"""
    + "".join(
        f'<img class="char-thumb" src="{U[k]}" style="left:{60+i*75}px;top:470px;width:{S[k][0]}px;height:{S[k][1]}px"/>'
        f'<div class="char-name" style="left:{50+i*75}px;top:528px;width:64px">{n}</div>'
        for i, (k, n) in enumerate(
            [("cat", "小猫"), ("dog", "小狗"), ("panda", "熊猫"), ("capy", "卡皮"), ("fox", "狐狸")]
        )
    )
    + '<div class="test-coin">+500 金币</div>',
)

write_screen(
    "G02-InGame",
    field_layer(400, 206)
    + hud_layer()
    + f"""
<div class="skill" style="left:300px;top:560px">影分身</div>
<div class="vpad" style="left:18px;top:670px">◀</div>
<div class="vpad" style="left:312px;top:670px">▶</div>
<div class="hint">A/D 或拖拽移动 · 空格/点击发射 · Esc 暂停</div>
""",
)

# shop rows absolute
shop_rows = [
    (U["panda"], "熊猫 · 力量：灭火效率+1级", "2000 金币", "#ffb020", "#1a1208"),
    (U["itemWide"], "长条 · 蹦床加长 8 秒", "100 金币", "#337352", "#fff"),
    (U["itemExt"], "灭火器 · 下关首次着火自灭", "120 金币", "#337352", "#fff"),
    (U["itemUp"], "1UP · 灭火等级 +1", "200 金币", "#337352", "#fff"),
    (None, "商品不满意？", "看广告刷新", "#345c94", "#fff"),
]
shop_html = [
    '<div class="shop-box" style="top:250px;height:290px">',
    '<div class="title" style="position:relative;left:0;top:8px;width:380px;font-size:18px">补给队 · 过关补给</div>',
    '<div class="stats" style="position:relative;left:0;top:4px;width:380px;color:#ffe070;font-size:14px">金币 1360</div>',
]
y0 = 50
for i, (ico, info, price, bg, fg) in enumerate(shop_rows):
    top = y0 + i * 46
    shop_html.append(f'<div class="shop-row" style="top:{top}px"></div>')
    if ico:
        shop_html.append(f'<img class="shop-ico" src="{ico}" style="top:{top+6}px" alt="s"/>')
        info_left = 42
    else:
        info_left = 12
    shop_html.append(
        f'<div class="shop-info" style="left:{info_left}px;top:{top+8}px">{info}</div>'
    )
    shop_html.append(
        f'<div class="shop-price" style="top:{top+8}px;background:{bg};color:{fg}">{price}</div>'
    )
shop_html.append("</div>")

write_screen(
    "G03-LevelClear-Shop",
    field_layer(show_ball=False)
    + f"""
<div class="ov ov-level"></div>
<div class="title" style="top:70px;font-size:26px">扑灭成功！</div>
<div class="stats" style="top:115px;color:#fff">本关奖励<br/>分数 +860　金币 +80</div>
<div class="btn btn-ad" style="left:95px;top:175px;width:260px;height:44px">看广告 · 双倍金币</div>
{''.join(shop_html)}
<div class="btn btn-main" style="left:95px;top:560px;width:260px;height:44px">下一关 →</div>
""",
)

write_screen(
    "G04-GameOver",
    field_layer(show_ball=False)
    + f"""
<div class="ov ov-over"></div>
<div class="title" style="top:250px;font-size:26px;color:#ff6659">任务失败…</div>
<div class="stats" style="top:310px;color:#fff">本局得分 1980<br/>最高分 12840<br/>金币 1280<br/>到达第 3 关</div>
<div class="btn btn-ad" style="left:95px;top:430px;width:260px;height:44px">看广告 · 复活</div>
<div class="btn btn-main" style="left:95px;top:490px;width:260px;height:44px">重新开始</div>
<div class="btn btn-ghost" style="left:95px;top:550px;width:260px;height:44px">主菜单</div>
""",
)

write_screen(
    "G05-Pause",
    field_layer(400, 206)
    + hud_layer()
    + f"""
<div class="ov ov-pause"></div>
<div class="title" style="top:320px;font-size:26px">已暂停</div>
<div class="btn btn-main" style="left:115px;top:390px;width:220px;height:44px">继续</div>
<div class="btn btn-ghost" style="left:115px;top:450px;width:220px;height:44px">主菜单</div>
""",
)

# ---------- Asset board: natural sizes, sections 场景 / 角色 / 道具 ----------
# Measure content
pad = 24
section_gap = 28
label_h = 36
row_gap = 16
col_gap = 16

scene_items = [
    ("bg", "背景 bg_level_default", True),  # scale down display? user asked native size - bg is 450x800 huge
    # For bg, show at 0.35 scale labeled, but place other scene tiles at 1:1
]
# User said 存放资产的画布不用 450x800 based on asset itself. So board is large canvas.
# Background at full 450x800 is ok as one item in 场景 section.
# Windows 1:1, trampoline 1:1

scene_sprites = [
    ("bg", "背景", 1.0),
    ("winN", "普通窗", 1.0),
    ("winF1", "火1", 1.0),
    ("winF2", "火2", 1.0),
    ("winF3", "火3", 1.0),
    ("winR", "救援窗", 1.0),
    ("winRR", "红窗", 1.0),
    ("mat", "蹦床垫", 1.0),
    ("fmL", "消防员左", 1.0),
    ("fmR", "消防员右", 1.0),
    ("vilR", "村民呼救", 1.0),
    ("vilRc", "村民", 1.0),
    ("vilF", "狐狸村民", 1.0),
    ("vilP", "猪村民", 1.0),
]
role_sprites = [
    ("cat", "小猫 cat"),
    ("dog", "小狗 dog"),
    ("panda", "熊猫 panda"),
    ("capy", "卡皮巴拉 capy"),
    ("fox", "狐狸 fox"),
]
prop_sprites = [
    ("itemBag", "钱袋"),
    ("itemWide", "长条"),
    ("itemHam", "锤子"),
    ("itemExt", "灭火器"),
    ("itemUp", "1UP"),
    ("itemFb", "火球"),
    ("icLv", "图标关卡"),
    ("icSc", "图标分数"),
    ("icCn", "图标金币"),
    ("icLife", "图标生命"),
    ("icPause", "图标暂停"),
    ("icSkill", "图标技能"),
    ("icFire", "图标火"),
    ("icRescue", "图标救援"),
]


def layout_row(items: list[tuple[str, str]], x0: int, y0: int, max_w: int) -> tuple[str, int, int]:
    """Place items left-to-right wrapping. Returns html, used_height, max_x."""
    x, y = x0, y0
    row_h = 0
    max_x = x0
    parts = []
    for key, label in items:
        w, h = S[key]
        # label under image ~18px
        need_w = max(w, 72)
        block_h = h + 22
        if x + need_w > x0 + max_w and x > x0:
            x = x0
            y += row_h + row_gap
            row_h = 0
        parts.append(
            f'<img src="{U[key]}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;image-rendering:pixelated" alt="{key}"/>'
        )
        parts.append(
            f'<div style="position:absolute;left:{x}px;top:{y+h+2}px;width:{need_w}px;font-size:12px;font-weight:700;'
            f'text-align:center;font-family:Microsoft YaHei,Noto Sans SC,sans-serif">{label}</div>'
        )
        x += need_w + col_gap
        max_x = max(max_x, x)
        row_h = max(row_h, block_h)
    return "\n".join(parts), y + row_h - y0, max_x


# scene section: bg full size first alone, then others
board_w = 1400
x0 = pad
y = pad
parts = [
    f'<div style="position:absolute;left:{x0}px;top:{y}px;font-size:28px;font-weight:900;'
    f'font-family:Microsoft YaHei,Noto Sans SC,sans-serif">Godot PNG 资产板（原尺寸）</div>',
    f'<div style="position:absolute;left:{x0}px;top:{y+36}px;font-size:14px;color:#b2c7e0;font-weight:600;'
    f'font-family:Microsoft YaHei,Noto Sans SC,sans-serif">按板块分区 · 场景 / 角色 / 道具 · 非 450×800 强行画板</div>',
]
y += 70

# Section 场景
parts.append(
    f'<div style="position:absolute;left:{x0}px;top:{y}px;font-size:22px;font-weight:800;color:#ffd24a;'
    f'font-family:Microsoft YaHei,Noto Sans SC,sans-serif">一、场景</div>'
)
y += label_h
# bg at native 450x800
bw, bh = S["bg"]
parts.append(
    f'<img src="{U["bg"]}" style="position:absolute;left:{x0}px;top:{y}px;width:{bw}px;height:{bh}px" alt="bg"/>'
)
parts.append(
    f'<div style="position:absolute;left:{x0}px;top:{y+bh+4}px;font-size:12px;font-weight:700;'
    f'font-family:Microsoft YaHei,Noto Sans SC,sans-serif">背景 {bw}×{bh}</div>'
)
# other scene tiles to the right of bg
sx = x0 + bw + 32
sy = y
html_s, h_s, _ = layout_row(
    [(k, n) for k, n, *_ in scene_sprites if k != "bg"],
    sx,
    sy,
    board_w - sx - pad,
)
# fix scene_sprites loop - use list without bg
html_s, h_s, _ = layout_row(
    [
        ("winN", "普通窗 48×48"),
        ("winF1", "火1"),
        ("winF2", "火2"),
        ("winF3", "火3"),
        ("winR", "救援窗"),
        ("winRR", "红窗"),
        ("mat", "蹦床垫"),
        ("fmL", "消防员左"),
        ("fmR", "消防员右"),
        ("vilR", "村民呼救"),
        ("vilRc", "村民静"),
        ("vilF", "狐狸村民"),
        ("vilP", "猪村民"),
    ],
    sx,
    sy,
    board_w - sx - pad,
)
parts.append(html_s)
y = max(y + bh + 28, sy + h_s + 28)

# Section 角色
parts.append(
    f'<div style="position:absolute;left:{x0}px;top:{y}px;font-size:22px;font-weight:800;color:#ffd24a;'
    f'font-family:Microsoft YaHei,Noto Sans SC,sans-serif">二、角色</div>'
)
y += label_h
html_r, h_r, _ = layout_row(
    [
        ("cat", f"小猫 {S['cat'][0]}×{S['cat'][1]}"),
        ("dog", f"小狗 {S['dog'][0]}×{S['dog'][1]}"),
        ("panda", f"熊猫 {S['panda'][0]}×{S['panda'][1]}"),
        ("capy", f"卡皮 {S['capy'][0]}×{S['capy'][1]}"),
        ("fox", f"狐狸 {S['fox'][0]}×{S['fox'][1]}"),
    ],
    x0,
    y,
    board_w - 2 * pad,
)
parts.append(html_r)
y += h_r + section_gap

# Section 道具 + UI icons
parts.append(
    f'<div style="position:absolute;left:{x0}px;top:{y}px;font-size:22px;font-weight:800;color:#ffd24a;'
    f'font-family:Microsoft YaHei,Noto Sans SC,sans-serif">三、道具 / HUD 图标</div>'
)
y += label_h
html_p, h_p, _ = layout_row(
    [
        ("itemBag", "钱袋"),
        ("itemWide", "长条"),
        ("itemHam", "锤子"),
        ("itemExt", "灭火器"),
        ("itemUp", "1UP"),
        ("itemFb", "火球"),
        ("icLv", "关卡"),
        ("icSc", "分数"),
        ("icCn", "金币"),
        ("icLife", "生命"),
        ("icPause", "暂停"),
        ("icSkill", "技能"),
        ("icFire", "火"),
        ("icRescue", "救援"),
    ],
    x0,
    y,
    board_w - 2 * pad,
)
parts.append(html_p)
y += h_p + pad

board_h = y + pad
write_screen("G06-AssetBoard", "\n".join(parts), w=board_w, h=board_h)

# meta for importer
meta = {
    "screens": [
        {"file": "G01-Menu.html", "name": "G01-Menu", "w": 450, "h": 800, "col": 0, "row": 0},
        {"file": "G02-InGame.html", "name": "G02-InGame", "w": 450, "h": 800, "col": 1, "row": 0},
        {"file": "G03-LevelClear-Shop.html", "name": "G03-LevelClear-Shop", "w": 450, "h": 800, "col": 2, "row": 0},
        {"file": "G04-GameOver.html", "name": "G04-GameOver", "w": 450, "h": 800, "col": 0, "row": 1},
        {"file": "G05-Pause.html", "name": "G05-Pause", "w": 450, "h": 800, "col": 1, "row": 1},
        {"file": "G06-AssetBoard.html", "name": "G06-AssetBoard", "w": board_w, "h": board_h, "col": 0, "row": 2},
    ]
}
(OUT / "screens-v2-meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
print("board", board_w, board_h)
print("done")
