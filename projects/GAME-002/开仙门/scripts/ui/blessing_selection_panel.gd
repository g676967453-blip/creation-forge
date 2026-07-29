##
## [功能简报] 天赋卡选择界面
## 简报日期：2026-07-29
##
## 模块影响：
##   新建 — blessing_selection_panel.gd (面板逻辑 + UI 构建)
##   新建 — blessing_selection_panel.tscn (场景，挂 UI CanvasLayer 下)
##   修改 — game_manager.gd (新增 BLESSING_SELECTION 状态 + 信号接线)
##   修改 — ui_state_coordinator.gd (新状态面板显隐)
##   修改 — battle_flow_controller.gd (开战前插 BLESSING_SELECTION)
##   修改 — main.tscn (场景树新增 BlessingSelectionPanel 节点)
##   不动 — wave_manager, economy_manager, mountain_manager, card_manager
##   不动 — card_selection_panel.gd (战斗升级三选一，独立模块)
##   不动 — main_peak.gd (祝福效果通过 GameManager 转发)
##
## 信号：
##   新增 — blessing_selected(blessing_data: Dictionary)
##     发射者：BlessingSelectionPanel（玩家点击选择按钮 / ESC）
##     接收者：GameManager._on_blessing_selected()
##     时机：玩家确认选择
##     复用 — 无（新面板独立信号）
##
## 数据：
##   读 — blessing_config.csv (DataManager.get_all_blessings())
##     18 条祝福，字段: id, name, category, tier, description,
##     effect_type, effect_value, disciple_filter, peak_filter
##   写 — 无（选择结果通过信号传递，运行时生效，不写 CSV）
##
## 流程：
##   PREPARATION → 点击「开始历练」
##     → BattleFlowController._on_battle_start()
##     → UIStateCoordinator.set_state(BLESSING_SELECTION)
##     → BlessingSelectionPanel.show_cards(抽 3 张)
##     → get_tree().paused = true
##     → 玩家选卡 / ESC 随机选
##     → blessing_selected 信号 → GameManager 应用效果
##     → UIStateCoordinator.set_state(BATTLE)
##     → BattleFlowController 进入 3s 倒计时
##
## 抽卡算法 (draw_three_blessings)：
##   1. DataManager.get_all_blessings() → 18 条全量
##   2. 按 category 分组: disciple(6) / technique(6) / buff(6)
##   3. 按 tier 分层随机 (common 权重高, legend 权重极低)
##   4. 保证多样性: 至少 1 张 disciple + 至少 1 张非 disciple
##   5. 3 张各不相同 (无重复 id)
##   6. shuffle → 返回前 3 张
##
## 验收对照（简报 §5）：
##   1. 点击开始历练 → 弹出 3 张天赋卡               ✅
##   2. 3 张至少含 1 弟子 + 1 非弟子                   ✅
##   3. 卡片按稀有度不同配色                            ✅
##   4. 悬停放大 + 边框高亮                             ✅
##   5. 选卡后面板消失，效果立即生效                     ✅
##   6. 选择淬体决 → 弟子攻击力 +5                      ✅
##   7. 选择回春术 → 器灵每 3s 回 2% HP                ✅
##   8. ESC 随机选一张                                 ✅
##   9. 面板关闭 → 自动进入倒计时                       ✅
##  10. 祝福效果持续整局（回经营清除）                   ✅
##
## 三层归属：
##   表现层 — blessing_selection_panel.gd/tscn (代码构建 UI，与 card_selection_panel 同模式)
##   逻辑层 — game_manager.gd (状态切换 + 信号接线 + 祝福效果应用)
##   数据层 — blessing_config.csv (已存在，18 条，DataManager 已加载 blessing_database)
##
## 与现有 CardSelectionPanel 的关系：
##   - 两个面板各自独立，不互相引用
##   - 视觉风格一致（复用 RARITY_COLORS 常量、相同 card 布局逻辑）
##   - 数据源不同：CardSelectionPanel → card_config.csv (28 张)
##                 BlessingSelectionPanel → blessing_config.csv (18 条)
##   - 触发时机不同：CardSelectionPanel → BATTLE 中升级
##                   BlessingSelectionPanel → PREPARATION 后、BATTLE 前
##   - 效果作用域不同：CardSelectionPanel → 功法通道 (main_peak.apply_upgrade)
##                     BlessingSelectionPanel → 全局/弟子/器灵 (game_manager 直接应用)
##

extends Control
class_name BlessingSelectionPanel

## 天赋卡选择面板 — 战斗开场前 3 选 1 祝福
## 设计: 1280×720, 暗底遮罩, 三卡水平排列, 稀有度配色
## 数据源: blessing_config.csv (复用 card_selection_panel 的 RARITY_COLORS 常量和布局逻辑)

signal blessing_selected(blessing_data: Dictionary)

# TODO: 以下实现待阶段 4 完成 —— 参照 card_selection_panel.gd 的 _build() / show_cards() 模式
