# Figma 变量与样式清单

> 来源：`design-system.md`  
> 目标：把 v2.0.0 规范整理成 Figma 可建库的变量、样式和命名表。

## 1. 变量命名原则

| 类型 | 命名格式 | 示例 |
| --- | --- | --- |
| 色彩变量 | `color/<类别>/<语义>` | `color/surface/page` |
| 字体样式 | `type/<层级>` | `type/page-title` |
| 间距变量 | `space/<数值>` | `space/48` |
| 圆角变量 | `radius/<层级>` | `radius/md` |
| 描边变量 | `stroke/<层级>` | `stroke/strong` |
| 阴影样式 | `effect/shadow/<层级>` | `effect/shadow/md` |
| 动效标记 | `motion/<速度>` | `motion/base` |

Figma 内中文说明写在 description 中，变量名保持英文和斜杠结构，方便后续与工程命名对齐。

## 2. 色彩变量

### 2.1 表面与文字

| 变量 | 色值 | 用途 |
| --- | --- | --- |
| `color/surface/page` | `#F5F5F5` | 页面背景 |
| `color/surface/content` | `#FFFFFF` | 卡片、列表、弹层、输入框 |
| `color/surface/weak` | `#EEEEEE` | 次级内容、选中底色、占位 |
| `color/text/primary` | `#000000` | 标题、正文、主要图标 |
| `color/text/secondary` | `#616161` | 说明、时间、单位、辅助信息 |
| `color/stroke/strong` | `#000000` | 强描边 |
| `color/stroke/weak` | `#BDBDBD` | 分隔线、次级边界 |

### 2.2 中性色阶

| 变量 | 色值 | 用途 |
| --- | --- | --- |
| `color/neutral/900` | `#111418` | 强文字与描边 |
| `color/neutral/700` | `#343A40` | 次级强文字 |
| `color/neutral/500` | `#646B73` | 辅助文字 |
| `color/neutral/300` | `#CFD3D7` | 分割线 |
| `color/neutral/200` | `#E8EBED` | 弱表面 |
| `color/neutral/100` | `#F1F2F3` | 页面底 |
| `color/neutral/0` | `#FFFFFF` | 内容表面 |

### 2.3 语义色

| 变量 | 色值 | 用途 |
| --- | --- | --- |
| `color/semantic/success` | `#2B8A3E` | 完成、有效、可领取 |
| `color/semantic/warning` | `#E67700` | 待处理、临近上限、注意事项 |
| `color/semantic/error` | `#C92A2A` | 失败、不可执行、危险操作 |
| `color/semantic/info` | `#1864AB` | 帮助、说明、可跳转提示 |

### 2.4 品质色

| 变量 | 色值 | 用途 |
| --- | --- | --- |
| `color/quality/common` | `#868E96` | 普通品质 |
| `color/quality/rare` | `#1864AB` | 稀有品质 |
| `color/quality/epic` | `#6741D9` | 史诗品质 |
| `color/quality/legendary` | `#E67700` | 传说品质 |
| `color/quality/mythic` | `#C92A2A` | 神话品质 |

品质色只表达品质，不替代成功、提醒、错误和信息状态。

## 3. 字体样式

| 样式 | 字号 / 行高 | 用途 | Figma 建议 |
| --- | --- | --- | --- |
| `type/hero-title` | `64 / 76` | 页面首要标题、关键结果 | Bold |
| `type/page-title` | `48 / 60` | 全屏页、模块标题 | Bold |
| `type/section-title` | `40 / 52` | 面板、列表组标题 | Semibold |
| `type/body-strong` | `32 / 44` | 主按钮、关键数值 | Semibold |
| `type/body` | `28 / 40` | 列表、说明、操作 | Regular |
| `type/caption` | `24 / 32` | 标签、时间、单位 | Regular |
| `type/badge` | `20 / 28` | 徽标、短状态、数量 | Medium |

字体族建议：

| 变量 | 用途 |
| --- | --- |
| `font/heading` | 标题、按钮 |
| `font/body` | 正文、标签 |
| `font/mono` | 数值、倒计时、单位 |

## 4. 间距变量

| 变量 | 数值 | 用途 |
| --- | ---: | --- |
| `space/4` | `4px` | 极小间距 |
| `space/8` | `8px` | 组件内基础间距 |
| `space/12` | `12px` | 紧凑元素间距 |
| `space/16` | `16px` | 相邻热区安全间隔 |
| `space/24` | `24px` | 列表、卡片内部间距 |
| `space/32` | `32px` | 紧凑页面边距 |
| `space/48` | `48px` | 常规页面边距 |
| `space/64` | `64px` | 大区块间距 |

## 5. 画布与栅格变量

| 变量 | 数值 | 用途 |
| --- | ---: | --- |
| `layout/canvas-width` | `1080px` | 基准画布宽 |
| `layout/canvas-height` | `1920px` | 基准画布高 |
| `layout/safe-top` | `88px` | 顶部安全区 |
| `layout/safe-bottom` | `120px` | 底部安全区 |
| `layout/margin-default` | `48px` | 常规左右边距 |
| `layout/margin-compact` | `32px` | 紧凑页面左右边距 |
| `layout/content-width` | `984px` | 内容宽 |
| `layout/grid-column` | `231px` | 四列栅格列宽 |
| `layout/grid-gap` | `20px` | 四列栅格沟槽 |

## 6. 圆角变量

| 变量 | 数值 | 用途 |
| --- | ---: | --- |
| `radius/xs` | `2px` | 状态角标、微型标签 |
| `radius/sm` | `4px` | 按钮、输入框、内容格 |
| `radius/md` | `8px` | 卡片、列表、普通面板 |
| `radius/lg` | `12px` | 弹窗、大型内容面板 |
| `radius/full` | `9999px` | 头像、开关、胶囊选择 |

## 7. 描边与阴影

| 变量 | 数值 | 用途 |
| --- | --- | --- |
| `stroke/thin` | `1px` | 弱分隔线 |
| `stroke/default` | `2px` | 次级边界 |
| `stroke/strong` | `4px` | 主要操作、强描边 |

| 样式 | 用途 |
| --- | --- |
| `effect/shadow/xs` | 开关把手、极小浮起元素 |
| `effect/shadow/sm` | 按钮默认态 |
| `effect/shadow/md` | 卡片悬浮、下拉菜单 |
| `effect/shadow/lg` | Toast、Tooltip、浮动提示 |
| `effect/shadow/xl` | 内容弹窗、全屏弹窗 |
| `effect/shadow/modal` | 系统中断、重要确认 |

## 8. 动效标记

| 标记 | 时长 | 场景 |
| --- | ---: | --- |
| `motion/instant` | `100ms` | 按钮按下、开关切换 |
| `motion/fast` | `200ms` | Hover 反馈、元素显隐 |
| `motion/base` | `300ms` | 弹窗进出、页面路由过渡 |
| `motion/slow` | `500ms` | 关键结算、获得演出 |

Figma 中不强制建立复杂 motion 资产，但需要在组件 description 中引用对应动效标记。

## 9. 建库顺序

1. 建立色彩变量。
2. 建立字体样式。
3. 建立间距、圆角、描边变量。
4. 建立阴影效果样式。
5. 按 `component-spec.md` 建立组件母版。
6. 每个组件 description 写清使用边界、状态和长文本规则。
