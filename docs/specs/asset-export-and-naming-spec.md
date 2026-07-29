# 输出与切图命名规范

> 📂 分类：技术规范 / 美术资产
> 📅 来源导入：2026-07-29

---

# 输出规则

- 所有的切图长宽均需为 **2的N次方**（即为能被4整除）。

- 常规图标输出：遵守几个固定尺寸，即 **64×64、128×128、256×256**。具体如何应用，根据具体情况选择。绿色部分为图标摆放安全区，图标主体在此范围内摆放应保持居中，同时保持横向或纵向至少有一个轴能充满安全区。

![安全区示意图](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/pLdn55X0pE6vwno8/img/33de80b1-fdb2-44a6-831f-3ae92dff0939.png)

- **全屏背景图输出尺寸为 1334×1750**，以中心锚点适配，其核心内容区域限制在同中心 1334×750 范围内。如下图所示。

![背景图适配示意1](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/pLdn55X0pE6vwno8/img/dfa14de4-5e1f-4078-a629-931812041f8e.png)
![背景图适配示意2](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/pLdn55X0pE6vwno8/img/960e4e4e-6100-46cb-8f47-b1a01dc13f10.png)

---

# 命名规则

下表 "/" 单独出现时，表示命名未必要有这个字段，根据实际需要来定。

## 常规

| 例举 | 前缀 | 类型 | 所属功能 | 描述 | 后缀 | 最终输出 |
| --- | --- | --- | --- | --- | --- | --- |
| 装备图标/icon | sp | _icon | _equipe | / | 001 | sp_icon_equipe_001 |
| 页签/tab | sp | _tab | _alliance | _on/still/disable | / | sp_tab_alliance_on |
| 按钮 | sp | _btn | _alliance | _add | / | sp_btn_alliance_add |
| 全屏背景大图 | sp | _base | _alliance | / | _ignore | sp_base_alliance_ignore |
| 非全屏背景 | sp | _base | _mail | _mainbg | / | sp_base_mail_mainbg |
| buff | sp | _buf | _battle | _powerup | / | sp_buf_battle_powerup |
| 图片 | sp | _pic | _mail | _activitytheme | / | sp_pic_mail_activitytheme |
| banner | sp | _banner | _mail | _activitytheme | / | sp_banner_mail_activitytheme |
| 普通单个图标 | sp | _icon | _mail | _tittle | / | sp_icon_mail_tittle |

> ⚠️ **注意：全屏背景大图必须加后缀 "_ignore" 才能不被程序压缩！**

## 通用

| 例举 | 前缀 | 类型 | 所属功能 | 描述 | 后缀 | 最终输出 |
| --- | --- | --- | --- | --- | --- | --- |
| 道具 | sp | _icon | _item | / | 001 | sp_icon_item_001 |
| 弹窗 | sp | _base | _common | _dlg | _info | sp_base_common_dlg_info |
| 背景 | sp | _base | _mail | _mainbg | | sp_base_mail_mainbg |
| 页签 | sp | _tab | _common | _first/second/thirdly | / | sp_tab_common_frist |

### 通用按钮命名

| 例举 | 前缀 | 类型 | 用途代号 | 描述 | 后缀 | 最终输出 |
| --- | --- | --- | --- | --- | --- | --- |
| 普通 | sp | _btn | _a | _nml | _big/middle/small | sp_btn_a_nml_big |
| 引导点击 | sp | _btn | _b | _nml | _big/middle/small | sp_btn_b_nml_big |
| 付费 | sp | _btn | _d | _nml | _big/middle/small | sp_btn_d_nml_big |
| 警示 | sp | _btn | _c | _nml | _big/middle/small | sp_btn_c_nml_big |
| 置灰 | sp | _btn | _g | _nml | _big/middle/small | sp_btn_g_nml_big |

### 类型代码

| 背景 | 按钮 | 图标 | 文字 | 技能 | 头像 | 进度条 |
| --- | --- | --- | --- | --- | --- | --- |
| _base | _btn | _icon | _txt | _skill | _photo | _bar |

### 多语言后缀

| 地区/平台 | 后缀 |
| --- | --- |
| 微信 | _wx |
| 意大利 | _it |
| 葡萄牙 | _po |
| 西班牙 | _sp |
| 英语地区 | _en |
| 法语 | _fr |
| 德语 | _ge |
| 中文 | _cn（默认不加，除非有区分需要） |

---

## 命名格式总结

```
sp_{类型}_{所属功能}_{描述}_{后缀}
  │    │       │         │       └── 序号/状态/尺寸/多语言/平台标识
  │    │       │         └── 具体描述（可选）
  │    │       └── 功能模块（如 alliance, mail, battle, common）
  │    └── 元素类型（icon, btn, base, tab, buf, pic, banner, txt, skill, photo, bar）
  └── 固定前缀（sp = sprite）
```
