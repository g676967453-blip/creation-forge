"""
extract_xlsx_references.py — 提取 xlsx 内嵌参考图（WPS DISPIMG 浮动图片）

用途：把「大地图皮肤需求」Excel 中「城堡皮肤」sheet 的参考图（DISPIMG 内嵌图片）
提取为独立 PNG，按皮肤英文 id 命名，并输出映射表。

映射链：
  ① xl/worksheets/sheet1.xml  → 单元格(row,col) → DISPIMG ID
  ② xl/cellimages.xml          → ID → rId
  ③ xl/_rels/cellimages.xml.rels → rId → media 路径
  ④ zipfile 直接读出字节写入目标文件

用法：
  python extract_xlsx_references.py --xlsx "<中文源路径>.xlsx" \
      --out-dir C:/Users/Administrator/Desktop/asset-pipeline-outputs/buildings/castle-skins/_references

依赖：仅标准库（zipfile / re / json）
"""

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

# 22 个城堡皮肤：Excel「城堡皮肤」sheet 数据行 2..23，按行序排列
# (skin_id, 该行设计主题应包含的中文关键词) — 关键词用于行↔皮肤映射校验
SKIN_ORDER = [
    ("penglai-isle", "蓬莱"),
    ("divine-beast-tower", "神兽"),      # A档（巅峰赛商店）
    ("generals-mansion", "将军府"),
    ("imperial-palace", "皇宫"),
    ("heritage-tower", "古风塔楼"),
    ("beast-shrine", "神兽"),            # B档（战区赛商店）
    ("ice-fortress", "寒冰"),
    ("naval-warship", "航海"),
    ("garden-pavilion", "古代林园"),
    ("lantern-street", "古街"),
    ("desert-yurt-camp", "北漠"),
    ("peach-village", "桃源"),
    ("winter-village", "冬景"),
    ("canal-water-town", "江南水乡"),
    ("jungle-tribe-fort", "南蛮"),
    ("lute-pavilion", "琵琶"),
    ("feast-kitchen", "美食"),
    ("dragon-dance-tower", "新春"),      # 舞龙
    ("winter-temple", "冬景"),           # 庙宇
    ("lion-dance-tower", "新春"),        # 舞狮
    ("moon-rabbit-tower", "中秋"),
    ("landscape-tower", "水墨"),
]

SHEET_NAME = "城堡皮肤"


def col_index(ref: str) -> int:
    """单元格引用转列序号（A=0）"""
    letters = re.match(r"[A-Z]+", ref).group(0)
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch) - ord("A") + 1)
    return idx - 1


def parse_sheet_dispimg(sheet_xml: str):
    """解析 sheet XML 中所有 DISPIMG 单元格 → {row: [(col, dispimg_id)]}

    注意：必须按 <c ...>...</c> 块逐个解析，不能用 .*? 跨单元格匹配（会导致行号偏移）。
    自闭合单元格 <c r="G9" s="17"/> 天然不匹配 <c [^>]*>，自动跳过。
    """
    cells = {}
    for m in re.finditer(r"<c ([^>]*)>(.*?)</c>", sheet_xml, re.S):
        attrs, body = m.group(1), m.group(2)
        ref_m = re.search(r'r="([A-Z]+\d+)"', attrs)
        img_m = re.search(r"_xlfn\.DISPIMG\(&quot;(ID_[^&]+)&quot;", body)
        if not ref_m or not img_m:
            continue
        ref = ref_m.group(1)
        row = int(re.search(r"\d+", ref).group(0))
        cells.setdefault(row, []).append((col_index(ref), img_m.group(1)))
    for row in cells:
        cells[row].sort()
    return cells


def parse_cellimages(xml: str):
    """cellimages.xml → {ID: rId}"""
    mapping = {}
    for block in re.finditer(r"<etc:cellImage>.*?</etc:cellImage>", xml, re.S):
        name_m = re.search(r'name="(ID_[^"]+)"', block.group(0))
        embed_m = re.search(r'r:embed="(rId\d+)"', block.group(0))
        if name_m and embed_m:
            mapping[name_m.group(1)] = embed_m.group(1)
    return mapping


def parse_shared_strings(xml: str):
    """sharedStrings.xml → [字符串]"""
    return re.findall(r"<si>\s*<t[^>]*>(.*?)</t>", xml, re.S)


def parse_theme_by_row(sheet_xml: str, shared_strings: list):
    """sheet 的 D 列单元格 → {row: 主题文本}（t="s" 共享字符串）"""
    themes = {}
    for m in re.finditer(r'<c r="D(\d+)"[^>]*t="s"[^>]*><v>(\d+)</v></c>', sheet_xml):
        row = int(m.group(1))
        idx = int(m.group(2))
        if idx < len(shared_strings):
            themes[row] = shared_strings[idx]
    return themes


def main():
    parser = argparse.ArgumentParser(description="提取 xlsx 内嵌 DISPIMG 参考图")
    parser.add_argument("--xlsx", required=True, help="源 xlsx 路径（支持中文路径）")
    parser.add_argument("--out-dir", required=True, help="输出目录（必须纯英文路径）")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.xlsx) as z:
        # ① 定位「城堡皮肤」sheet
        wb = z.read("xl/workbook.xml").decode("utf-8")
        wb_rels = z.read("xl/_rels/workbook.xml.rels").decode("utf-8")
        sheet_rel = {}
        for m in re.finditer(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', wb_rels):
            sheet_rel[m.group(1)] = m.group(2)
        target = None
        for m in re.finditer(r'<sheet name="([^"]+)"[^>]*r:id="(rId\d+)"', wb):
            if m.group(1) == SHEET_NAME:
                target = sheet_rel[m.group(2)].lstrip("/")
        if not target:
            print(f"ERROR: 未找到 sheet「{SHEET_NAME}」", file=sys.stderr)
            sys.exit(1)
        sheet_path = target if target.startswith("xl/") else "xl/" + target
        sheet_xml = z.read(sheet_path).decode("utf-8")

        # ② DISPIMG 单元格 + 主题文本
        disp_cells = parse_sheet_dispimg(sheet_xml)
        shared = parse_shared_strings(z.read("xl/sharedStrings.xml").decode("utf-8"))
        themes = parse_theme_by_row(sheet_xml, shared)

        # ③ ID → rId → media
        id_to_rid = parse_cellimages(z.read("xl/cellimages.xml").decode("utf-8"))
        rels_xml = z.read("xl/_rels/cellimages.xml.rels").decode("utf-8")
        rid_to_media = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels_xml))

        # ④ 按行序配对皮肤并写出（数据行 2..23 ↔ 22 皮肤；皇宫行 5 有两张图）
        mappings = []
        used_ids = set()
        for idx, (skin_id, keyword) in enumerate(SKIN_ORDER):
            row = idx + 2
            row_cells = disp_cells.get(row, [])
            if not row_cells:
                print(f"ERROR: 皮肤 {skin_id} 应位于行{row}，但该行没有 DISPIMG 单元格")
                continue
            # 行↔皮肤校验：该行 D 列主题必须包含关键词
            theme = themes.get(row, "")
            if keyword not in theme:
                print(f"WARN: 行{row} 主题「{theme}」不含关键词「{keyword}」，仍按行序配对")
            for img_idx, (col, img_id) in enumerate(row_cells):
                if img_id not in id_to_rid:
                    print(f"ERROR: 皮肤 {skin_id} 的图片 ID {img_id} 不在 cellimages.xml 中")
                    continue
                rid = id_to_rid[img_id]
                media = rid_to_media.get(rid, "").lstrip("/")
                if not media.startswith("xl/"):
                    media = "xl/" + media  # rels Target 是相对 xl/ 的路径
                if not media.startswith("xl/media/"):
                    print(f"ERROR: {skin_id} 的 rId {rid} 未映射到 media（{media}）")
                    continue
                suffix = "_2" if img_idx > 0 else ""  # 第二张图 → _2
                fname = f"{skin_id}{suffix}{Path(media).suffix}"
                if fname.lower().endswith(".emf"):
                    print(f"SKIP: {skin_id} 的参考图是 EMF 矢量格式（{media}），跳过")
                    mappings.append({
                        "skin": skin_id, "row": row, "col": col, "dispimg_id": img_id,
                        "media": media, "file": None, "note": "EMF skipped",
                    })
                    continue
                data = z.read(media)
                (out_dir / fname).write_bytes(data)
                used_ids.add(img_id)
                mappings.append({
                    "skin": skin_id, "row": row, "col": col, "dispimg_id": img_id,
                    "media": media, "file": fname,
                    "size_kb": round(len(data) / 1024, 1),
                })
                print(f"OK: {skin_id} <- {media} ({len(data)/1024:.0f} KB) -> {fname}")

        # ⑤ 校验：城堡 sheet 应提取 23 张（22 皮肤 + 皇宫副图）
        unused = [mid for mid in id_to_rid if mid not in used_ids]
        print(f"\n提取完成：{len(mappings)} 条映射；cellimages 中未使用的 ID {len(unused)} 个（部队/迁城皮肤）")

        # ⑥ mapping.md / mapping.json
        with open(out_dir / "mapping.json", "w", encoding="utf-8") as f:
            json.dump(mappings, f, ensure_ascii=False, indent=2)
        with open(out_dir / "mapping.md", "w", encoding="utf-8") as f:
            f.write(f"# 城堡皮肤参考图映射（源：{Path(args.xlsx).name}）\n\n")
            f.write("| 皮肤 id | 中文主题 | 单元格 | DISPIMG ID | media | 文件 |\n")
            f.write("|---------|---------|--------|------------|-------|------|\n")
            for m in mappings:
                theme = themes.get(m["row"], "")
                cell = f"{chr(65 + m['col'])}{m['row']}"
                f.write(f"| {m['skin']} | {theme} | {cell} | {m['dispimg_id']} | {m['media']} | {m['file'] or '—'} |\n")
        print(f"映射表已写入：{out_dir / 'mapping.md'} / mapping.json")


if __name__ == "__main__":
    main()
