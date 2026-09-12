# 占位资产表（placeholder → 正式 key）

> 对应通用 SOP 阶段 1 / 4：  
> [`docs/workflows/游戏开发-Godot-Pixso-Lovart四阶段.md`](../../../../docs/workflows/游戏开发-Godot-Pixso-Lovart四阶段.md)  
> 项目配置：[`../docs/project-workflow-profile.md`](../../docs/project-workflow-profile.md)  
>  
> **用途**：登记「现在屏幕上是什么占位」以及「将来用哪条正式资产替换」。  
> 风格与最终规格见本项目美术文档，不在本表重复定义画风。

## 状态约定

| status | 含义 |
|--------|------|
| `placeholder` | 阶段 1：SVG / ColorRect / 程序绘 / 临时图 |
| `wip` | 已有候选图，未过 Pixso Gate C |
| `approved` | Gate C 通过，待进引擎或已拷贝未绑完 |
| `replaced` | Gate D：运行时已引用正式资源 |

| placeholder 类型 | 说明 |
|------------------|------|
| `svg` | 矢量占位 |
| `code` | ColorRect / 代码绘制 / modulate 区分 |
| `temp_png` | 临时位图（非定稿） |
| `final_png` | 已是或接近正式 PNG |

## 表（随开发维护）

> 初稿：按当前工程常见节点预填；**以场景实装为准**，缺行请补，错行请改。

| Godot 节点路径（示意） | 用途 | placeholder | 正式 key（目标） | Pixso / 备注 | status |
|------------------------|------|-------------|------------------|--------------|--------|
| `Main/GameRoot/Background` | 关卡背景 | `temp_png` | `bg_level_default` 等 | 背景规范见 scene-config | 按实装更新 |
| `Main/GameRoot/BrickHost/*` | 火/救/红窗 | `temp_png` / `code` | `win_fire_lv*` / `win_rescue*` | 美术规格窗表 | 按实装更新 |
| `Main/GameRoot/Paddle` | 蹦床+两侧员 | `temp_png` | `prop_trampoline*` / paddle char | | 按实装更新 |
| `Main/GameRoot/Ball` | 弹射角色 | `temp_png` | `char_*_fly` 等 | 角色 id：cat/dog/… | 按实装更新 |
| `Main/GameRoot/ItemHost/*` | 掉落道具 | `code` | `prop_bag` 等 | 道具最小集 | placeholder |
| `Main/UI/HUD/*` | 顶栏图标字 | `temp_png` / 字体 | `ui_icon_*` | pixel ui | 按实装更新 |
| `Main/UI/.../Menu` | 主菜单 | `code` | `ui_btn_*` / `ui_logo_*` | Frame `01-MainMenu` | 按实装更新 |
| `Main/UI/.../Char` | 角色选择 | `code` | `char_*_card` | `03-CharacterSelect` | 按实装更新 |
| `Main/UI/.../Shop` | 补给队 | `code` | shop UI keys | `05-Shop` | 按实装更新 |
| `Main/UI/.../LevelClear` | 通关 | `code` | panel/btn | `04-LevelClear` | 按实装更新 |
| `Main/UI/.../GameOver` | 失败复活 | `code` | panel/btn | `06-GameOver` | 按实装更新 |
| `Main/UI/.../Pause` | 暂停 | `code` | panel/btn | `08-Pause` | 按实装更新 |
| `Main/UI/.../Ad` | 激励视频 mock | `code` | — | `07-AdReward` | placeholder |
| `Main/UI/.../Rank`（若有） | 好友排行榜 | `code` / 未做 | rank UI keys | `09-FriendRank` | 待功能 |

## 维护规则

1. 阶段 1 每新增可见物 → 加一行 `placeholder`。  
2. 阶段 3 通过 → `approved` 并填文件路径。  
3. 阶段 4 绑进场景 → `replaced`。  
4. 正式 key 与目录命名遵循本项目 [`救火英雄美术输出规格与MVP资产清单.md`](../../救火英雄美术输出规格与MVP资产清单.md)。  
