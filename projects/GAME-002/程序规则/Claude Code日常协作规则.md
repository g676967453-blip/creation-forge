# Claude Code 日常协作规则

> 用途：与 Claude Code 协作开发「开仙门」时的项目级规则，贴在对话开头或设为 CLAUDE.md，让 AI 严格按此执行。
> 本文件与《AI功能模块架构设计审查提示词》配套使用——前者管"架构怎么审"，本文件管"日常怎么协作"。

---

## 一、项目铁律（AI 必须遵守）

```
1. 策划文档在 策划文档/ 目录，改需求前先去那里读
2. 波次数据从 data/wave_config.csv 加载，不要在代码里写死数组
3. 所有配置数据从 data/*.csv 加载（DataManager 统一入口），不要散落硬编码
4. scenes/ 目录按类型归位，新增场景必须放在对应子目录（ui/、enemies/、projectiles/、peaks/、debug/）
5. 不要在代码里裸写 res:// 路径 —— game_manager.gd 已有集中常量，新路径加在那里
6. 美术资源不要直接用 _exported/ 里的中间产物名，后续应该走 runtime/ 
```

---

## 二、每次改代码前的检查清单

AI 在动手改代码前，必须先回答：

```
□ 这个改动涉及哪几个 .gd 文件？列举出来
□ 是否会影响 scene 文件（.tscn）？如果会，列出来
□ 是否有硬编码路径需要同步更新？
□ 改完后是否有对应的 CSV 配置需要更新？
□ 是否需要在策划文档中记录此改动？
```

---

## 三、文件落位决策树

新增一个文件时，按以下规则决定放哪里：

```
是 .gd 脚本？
├── 管理全局状态（Autoload）        → autoload/
├── 管理一类对象（Battle/Enemy/Card）→ scripts/managers/
├── 是 UI 面板逻辑                  → scripts/ui/
├── 是数据类定义（Resource）        → scripts/data/
├── 是某个对象的运行时逻辑          → scripts/（根，如 enemy_base.gd）
└── 是纯视觉效果                    → scripts/effects/

是 .tscn 场景？
├── 是游戏主入口                   → scenes/main.tscn
├── 是 UI 面板                     → scenes/ui/
├── 是敌人/山峰/弹道模板            → scenes/enemies/ | peaks/ | projectiles/
└── 是调试/开发用场景               → scenes/debug/

是数据配置？
├── 策划在 Excel 编辑的原始表       → data/（.csv，根）
├── Godot 资源对象（由 import 生成） → data/ 按对象分文件夹
└── 未使用的旧资源                  → data/_unused_tres/

是美术资源？
├── 原始 PSD/AI 源文件             → assets/source/
├── PSD 导出中间产物（批量导出）     → assets/_exported/
└── 正式游戏使用的资源（clean 命名） → assets/runtime/
```

---

## 四、禁止事项（AI 绝对不要做）

```
❌ 不要新增 .gd 文件时平铺在 scripts/ 根目录 —— 按决策树落位
❌ 不要在代码里写死数值（血量、速度、波次配置）
❌ 不要用 get_node("硬编码路径/XXX") —— 用常量或 @export var
❌ 不要改 .tscn 的场景树节点名而不更新对应的 get_node 引用
❌ 不要创建新的 .tres 文件 —— 项目数据来源统一为 CSV
❌ 不要在策划不知道的情况下改游戏机制数值
❌ 不要删 data/ 下的 .csv 文件除非确认不再使用
❌ 不要引入新的 addon/ 除非用户明确要求
```

---

## 五、常用协作工作流

### 新功能开发流程

```
1. 用户描述需求
2. AI 先读 策划文档/ 下的相关文档，确认是否已有设计
3. AI 输出模块拆分（用架构审查提示词的格式）
4. 用户确认方案
5. AI 实现：先写数据（CSV），再写逻辑（.gd），最后连场景（.tscn）
6. AI 自检：跑一遍检查清单
```

### Bug 修复流程

```
1. AI 先定位涉及的 .gd 文件，用 grep 搜索相关关键词
2. AI 判断是逻辑错误还是数据错误
   - 数据错误 → 改 CSV
   - 逻辑错误 → 改 .gd，同时检查是否有同类问题
3. 修复后 AI 输出：根因 + 修了什么 + 影响范围
```

### 重构/整理流程

```
1. AI 先列出所有受影响文件的清单
2. AI 评估改动风险（高/中/低）
3. 高风险改动 → 先解耦硬编码依赖 → 再搬文件
4. 低风险改动 → 直接搬 + 同步更新引用
5. 改完后 AI 用 grep 验证无残留引用
```

---

## 六、项目当前状态速查

| 项 | 现状 |
|----|------|
| 数据来源 | CSV（DataManager 加载） |
| 波次配置 | data/wave_config.csv（15波，51行数据） |
| 敌人配置 | data/enemy_config.csv（9种，含 flying 类型） |
| 功法配置 | data/form_config.csv（6种） |
| 山峰配置 | data/peak_config.csv（6座） |
| 卡牌配置 | data/card_config.csv（28张，分布4/5/5/5/5/4） |
| 器灵配置 | data/main_peak_config.csv（HP=2000） |
| V0.1 新增 | disciple/blessing/artifact/spirit_growth（4份CSV就位，代码待接入） |
| 场景入口 | scenes/main.tscn |
| 全局单例 | CsvLoader + DataManager + MCPRuntimeProbe（autoload/） |
| 管理器 | GameManager / WaveManager / CardManager / MountainManager / EconomyManager / BattleFlowController / UIStateCoordinator / SpiritGrowthManager / BillManager |
| Godot 版本 | 4.7（GL Compatibility） |
| 窗口 | 1280×720，不可缩放 |

---

## 七、AI 对话常用指令

在 Claude Code 对话中可直接使用：

```
"按架构审查规则分析这个功能"   → 触发《AI功能模块架构设计审查提示词》的评审流程
"检查一下这个模块的耦合度"     → 检查是否违反信号优先原则
"这个改动有哪些风险"           → 列出影响范围和风险等级
"按协作规则检查我的改动"       → 跑一遍本文件的检查清单
"更新 CLAUDE.md"              → 把当前项目状态同步到 CLAUDE.md
```

---

## 八、文件体系

```
程序规则/ 三份文件的定位：

Godot架构规范与模块化标准.md  ← 核心文件
  │
  │  定义了"什么是好的 Godot 架构"
  │  "模块怎么拆分" "代码怎么写"
  │
  ├── AI功能模块架构设计审查提示词.md
  │   │
  │   │  基于核心规范，定义了"怎么审查架构"
  │   │  用于新功能开发前的方案评审
  │
  └── Claude Code日常协作规则.md（本文件）
      │
      │  基于核心规范，定义了"日常怎么执行"
      │  用于每次改代码时的操作规范
      
开仙门/CLAUDE.md
  │
  │  项目地图 + 关键约束速查
  │  每次 Claude Code 启动自动加载
  │  指向程序规则/ 目录获取详细规则
```
