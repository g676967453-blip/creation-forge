# -*- coding: utf-8 -*-
"""重新生成 UI 中文字体子集（圆润字体）。

用途：改动 UI 文案后，重新生成 assets/fonts/round_ui.ttf，
      确保新增汉字被包含（否则运行时显示方块）。

依赖：pip install fonttools brotli
源字体：站酷快乐体 ZCOOL KuaiLe（SIL OFL / 免费商用）
        https://github.com/google/fonts/tree/main/ofl/zcoolkuaile

用法：
  python make_font_subset.py <源字体.ttf> <输出.ttf> [工程根目录]
示例：
  python make_font_subset.py ZCOOLKuaiLe-Regular.ttf \
      ../../assets/fonts/round_ui.ttf
"""
import pathlib
import subprocess
import sys

# 工程根（默认本脚本上两级 = fire-hero-godot/）
ROOT = pathlib.Path(__file__).resolve().parent.parent if len(sys.argv) <= 3 else pathlib.Path(sys.argv[3])
OUT = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "assets" / "fonts" / "round_ui.ttf"
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None

# 额外补充：确保常用的游戏/UI 词不会缺字（可按需扩充）
EXTRA = (
    "零一二三四五六七八九十百千万亿"
    "关卡分数金币生命目标火人救援灭火道具补给队角色切换解锁购买价格刷新继续下一重新开始返回主菜单暂停最高记录等级时间冷却影分身技能通用商店英雄装备已拥有使用中不足"
    "猫狗熊猫狐卡皮巴拉哪吒村民跳楼获救抓住带回蹦床长条螺丝灭火器穿透无敌钱袋视野范围速度攻击防御伤害生命值经验升级奖励任务失败成功完成胜利"
    "入门混编平衡高压二级三级红窗救援窗正常窗森林大楼城市"
)
PUNCT = "　、。，！？：；（）【】《》…—·“”‘’％＃＋－×÷"


def collect_chars() -> str:
    chars = set()
    for pat in ("**/*.gd", "**/*.tscn", "assets/**/*.json"):
        for p in ROOT.glob(pat):
            if ".godot" in str(p):
                continue
            try:
                chars.update(p.read_text(encoding="utf-8", errors="ignore"))
            except Exception:
                pass
    chars.update(EXTRA)
    keep = set()
    for ch in chars:
        o = ord(ch)
        if 0x4E00 <= o <= 0x9FFF or 0x20 <= o <= 0x7E or ch in PUNCT:
            keep.add(ch)
    return "".join(sorted(keep))


def main() -> None:
    if SRC is None or not SRC.exists():
        print("用法: python make_font_subset.py <源字体.ttf> <输出.ttf> [工程根]")
        raise SystemExit(2)
    text = collect_chars()
    tmp = ROOT / "_font_subset_chars.txt"
    tmp.write_text(text, encoding="utf-8")
    print(f"字符集: {len(text)} 字 -> {tmp}")
    subprocess.run(
        [sys.executable, "-m", "fontTools.subset", str(SRC),
         f"--text-file={tmp}", f"--output-file={OUT}",
         "--layout-features=*", "--no-hinting"],
        check=True,
    )
    tmp.unlink(missing_ok=True)
    print(f"[OK] 子集字体 -> {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")
    print("提示：重新生成后请在 Godot 里重新导入并重导 Web 包。")


if __name__ == "__main__":
    main()
