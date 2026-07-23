# GAME-002 UI 图层架构与命名规范

> 版本：v2 | 最后更新：2026-07-22 | 适用范围：GAME-002「开仙门」所有 UI 界面
> 设计原则：引擎（Unity/Godot）可按图层名直接解析类型、生成节点树、拼接界面

## 一、固定名（5 个）

引擎识别规则：id 精确匹配固定名 → 创建对应类型的节点。

| 固定名 | 类型 | 引擎映射 | 说明 |
|--------|------|---------|------|
| `Bg` | 背景 | ColorRect / Image | 界面或组件背景 |
| `Mask` | 全屏遮罩 | ColorRect | 压暗/模糊全屏遮罩 |
| `Root` | 容器 | Control | 内容根节点 |
| `Icon` | 图标 | TextureRect | 通用图标 |
| `RedPoint` | 指示器 | Badge | 红点/角标 |

## 二、命名后缀（5 个）

引擎识别规则：名称匹配后缀 → 创建对应类型的节点。

| 后缀 | 引擎映射 | 命名规则 | 示例 |
|------|---------|---------|------|
| `-Ui` | 场景实例化 | `功能语义 + Ui` | `SpiritSelectUi`、`ManageMainUi`、`PeakMenuUi` |
| `-Btn` | Button | `动作 + Btn` | `StartBtn`、`CloseBtn`、`RepairBtn`、`BattleBtn` |
| `-List` | ItemList | `集合名 + List` | `CardList`、`PeakList`、`FormList` |
| `-Text` | Label | `角色 + Text` | `TitleText`、`NameText`、`HintText`、`StatusText`、`ValueText` |
| `-Item` | 模板实例 | `List 名单数 + Item + 数字` | `CardItem1`、`PeakItem3`、`FormItem2` |

### Text 角色的标准用词

| 角色 | 命名 | 说明 |
|------|------|------|
| 标题 | `TitleText` | 界面主标题 |
| 名称 | `NameText` | 物品/角色/山峰名 |
| 提示 | `HintText` | 说明文字、操作提示 |
| 状态 | `StatusText` | 动态状态文字 |
| 数值 | `ValueText` | 灵气量、HP 值等 |

## 三、无后缀元素

名称不匹配任何固定名或后缀 → 引擎创建通用 Node/Control。

| 命名 | 说明 | 示例用途 |
|------|------|---------|
| `TopArea` | 顶部区域 | 经营主界面顶部 HUD |
| `SpiritArea` | 器灵区域 | 灵气显示区、底部器灵区 |
| `HpArea` | HP 条区域 | 血条容器 |
| `ExpArea` | 经验条区域 | 经验条容器 |
| `ExpFill` | 经验条填充 | 进度填充色块 |
| `SelectMark` | 选中标记 | 山峰选中光圈 |
| `Separator` | 分隔线 | 面板内分隔 |

## 四、层级骨架

```
{Name}Ui                  ← 界面顶层
├─ Bg                     ← 背景，图层树最上方（视觉底层）
├─ Mask                   ← 全屏遮罩（如需要）
├─ Root                   ← 内容容器
│  ├─ 功能组件
│  │  └─ Root             ← 组件级容器
│  │     ├─ Bg
│  │     ├─ Icon
│  │     └─ *Text
│  ├─ *List               ← 列表容器
│  │  ├─ Bg
│  │  ├─ XxxItem1
│  │  │  ├─ Root
│  │  │  │  ├─ Bg
│  │  │  │  ├─ Icon
│  │  │  │  └─ *Text
│  │  └─ XxxItem2
│  └─ *Btn
└─ (无其他顶层子节点)
```

## 五、嵌套约束

| 父节点类型 | 允许直接子节点 |
|-----------|--------------|
| `*Ui` 顶层 | `Bg`、`Mask`、`Root` |
| `Root`（界面级） | 功能组件、`*List`、`*Btn`、`*Text`、`*Area` |
| `Root`（组件级） | `Bg`、`Icon`、`*Text`、`RedPoint` |
| `*List` | `Bg`（必须）+ `*Item*` |
| `*Item*` | `Root`（必须） |
| `*Area` | `Bg`、`Icon`、`*Text`、`RedPoint` |

## 六、HTML → Pixso 操作约定

### 6.1 DOM 顺序规则

`code_to_design` 将 DOM 最后的元素放到 Pixso 图层树顶部（视觉底层）。遵循：

```html
<section>  <!-- XxxUi -->
  <main>     <!-- Root — DOM 第1个 → 图层树底部 = 视觉顶层 -->
  <div>      <!-- Mask — DOM 第2个 → 图层树中间 -->
  <div>      <!-- Bg — DOM 最后 1个 → 图层树顶部 = 视觉底层 -->
</section>
```

同时加 `z-index` 保证浏览器预览正确：`Root: z-index:3 → Mask: z-index:2 → Bg: z-index:1`

### 6.2 @pixso 注释

HTML 中每个元素用 `<!-- @pixso 目标名称 -->` 标注，供 AI 导入时读取，自动构造 `apply_design` 重命名脚本。

### 6.3 全自动导入流程（无需人手点空白）

| 步骤 | 工具 | 操作 | 说明 |
|------|------|------|------|
| 1 | `code_to_design` | 导入 HTML | 产生顶层 "html" Frame |
| 2 | `get_top_level_frames` | 找到 html Frame ID | 同时 `I("document",…)` 创建中文命名 Frame |
| 3 | `query_nodes` | readDepth:3 | 从 html Frame 找到 section 节点 |
| 4 | `apply_design` | `M("sectionId","namedFrameId")` | 移入命名 Frame |
| 5 | `apply_design` | `D("htmlFrameId")` | 删除 html 空壳 |
| 6 | `apply_design` | `U("sectionId",{x:0,y:0,w,h})` | **居中校准** + 尺寸修正 |
| 7 | `apply_design` | 批量 `U()` 重命名 | 按规范命名所有层 |
| 8 | `get_export_image` | 导出 PNG | 存证 |

> ⚠️ Step 6 必须执行：`M()` 移入后 section 可能偏移，需显式设 `x:0, y:0` 居中。

## 七、GAME-002 界面清单

| Frame 名 | GameState | 类型 |
|----------|-----------|------|
| `IntroUi` | INTRO | 全屏—极简型 |
| `SpiritSelectUi` | MAIN_PEAK_SELECT | 面板—卡片选择型 |
| `ManageMainUi` | PREPARATION | 全屏—HUD+列表型 |
| `PeakMenuUi` | PREPARATION (弹窗) | 面板—菜单型 |
| `BattleHudUi` | BATTLE | HUD |
| `CardSelectUi` | CARD_SELECTION | 面板 |
| `ResultUi` | GAME_OVER | 面板 |

## 八、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-07-22 | 初版 |
| v2 | 2026-07-22 | 对齐 Unity UI 框架参考规范：5 固定名 + 5 后缀，去掉自创后缀，增加 Mask 固定名 |
