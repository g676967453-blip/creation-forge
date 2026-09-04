# 救火英雄 · 游戏界面 Pixso 原型

> 日期：2026-09-01  
> 状态：9 屏已导入 Pixso 桌面端（含好友排行榜弹窗） 
> 对齐：`救火英雄IAA游戏企划.md` §4 / `微创新需求规格.md` / `救火英雄美术输出规格与MVP资产清单.md` / `fire-hero-iaa.html`

## 1. 目标

按项目需求，先把 **竖屏 9:16（逻辑 450×800）** 核心游戏界面在 Pixso 做成可评审原型图，作为：

- 交互/信息架构确认稿
- 美术换皮与组件切图参考
- 后续 D2C / 程序 UI 对照

## 2. Pixso 画布现状

| 项 | 值 |
|---|---|
| MCP | `http://127.0.0.1:3667/mcp`（Pixso 桌面端） |
| 页面名 | `FireHero-UI-Prototypes` |
| 布局 | 2 行 × 4 列 + 第 3 行排行榜；Frame 间距 80 / 120 |
| 单屏尺寸 | 450 × 800 |

| # | Frame 名 | 对应原型 Overlay | 用途 |
|---|---|---|---|
| 01 | `01-MainMenu` | `ovMenu` | 主菜单：开始 / 广告领币 / 角色入口 |
| 02 | `02-InGameHUD` | HUD + 局内 | 关卡/分/币/命 + 技能/暂停 + 双通道目标 |
| 03 | `03-CharacterSelect` | `ovChar` | 5 角色卡片：拥有/使用中/金币/广告解锁 |
| 04 | `04-LevelClear` | `ovLevel` | 通关结算 + 双倍广告 + 进补给队 |
| 05 | `05-Shop` | `ovShop` | 补给队：英雄位 + 道具位 + 刷新/继续 |
| 06 | `06-GameOver` | `ovOver` | 失败 + 广告复活 + 重开/回菜单 |
| 07 | `07-AdReward` | `ovAd` | 激励视频占位（多点位复用） |
| 08 | `08-Pause` | `ovPause` | 暂停：继续 / 主菜单 |
| 09 | `09-FriendRank` | 建议 `ovRank` | 好友排行榜弹窗：Tab / 我的名次 / 列表 / 邀请·刷新 |

## 3. 视觉基线（已用）

| Token | Hex | 用途 |
|---|---|---|
| `bg.night` | `#0B0F1A` | 夜空底 |
| `bg.facade` | `#1A2340` → `#12182B` | 楼体 |
| `fire.main` | `#FF8A3C` | 主按钮 / 强调 |
| `fire.hot` | `#FF3B30` | 失败 / 高级火 |
| `gold` | `#FFD24A` | 金币 / 选中 |
| `safe` | `#7EF0A0` | 通关 / 正向 |
| `water` | `#7FD4FF` | 水/冷却参考 |
| `text.sub` | `#FFE9C9` | 次文案 |

风格：清爽卡通夜景消防、正面大楼窗格、底部窄操作区；角色目前为 **色块占位**（非最终立绘），后续替换 `char_*_card`。

## 4. 仓库文件

```
ui-prototypes/
  fire-hero-ui-screens.html    # 8 屏合集（浏览器预览）
  screens/                     # 单屏 HTML（MCP code_to_design 源）
    01-main-menu.html
    02-in-game-hud.html
    ...
  pixso-previews/              # 导出预览图（若已截取）
  _pixso_import_all.ps1        # 全量导入脚本
  _pixso_import_rest.ps1       # 断点续导
  _pixso_shots.ps1             # 截图/导出
  README.md                    # 本说明
```

浏览器预览合集：

```bash
start ui-prototypes/fire-hero-ui-screens.html
```

## 5. 人机协作下一步

1. **人在 Pixso 目视确认**：信息是否够用、按钮层级是否对、有无缺屏。  
2. **改文案/层级**：直接在 Frame 内改，或改 `screens/*.html` 后重跑导入脚本。  
3. **美术替换**：角色卡/标题字/主按钮换 `art/final/ui` 与 `char_*_card`。  
4. **组件化**：主按钮、广告按钮、角色卡、商品卡抽成 Pixso Component。  
5. **D2C**（可选）：选中 Frame → MCP `design_to_code` 出 HTML/CSS 对照现有 `fire-hero-iaa.html`。

## 6. 已知限制

- `code_to_design` 复杂 CSS（多层背景/grid 火焰）还原度有限，局内窗格可能简化。  
- 角色 emoji/复杂图标在导入时可能降级为色块或文字。  
- 中文文件名在部分脚本链路易乱码，单屏源文件使用英文名。  
- 本原型 **不等于** 可玩逻辑；可玩版本仍以 `fire-hero-iaa.html` 为准。

## 7. 验收清单（原型阶段）

- [x] MCP 连通 `127.0.0.1:3667/mcp`
- [x] 8 个核心界面 Frame 落在同一页并网格排布
- [x] 尺寸 450×800，色板对齐美术规格
- [x] 覆盖菜单 / 局内 / 角色 / 结算 / 商店 / 失败 / 广告 / 暂停
- [ ] 人工在 Pixso 点名确认视觉方向
- [ ] 角色卡替换为正式/半正式立绘
- [ ] 主按钮与广告按钮出九宫/切图规范
