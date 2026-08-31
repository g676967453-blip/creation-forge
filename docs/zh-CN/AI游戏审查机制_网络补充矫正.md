# AI 游戏审查机制 —— 网络补充矫正（IAA 视角）

> 配套文档：《AI游戏从立项到制作到变现_完整三章》、《AI游戏分阶段审查机制》
> 依据：2024–2025 年公开行业报告与媒体信息（来源见文末）
> 结论先行：**原文档"流程框架"仍然成立且方向正确，但"行业现状"与"合规"两个维度不全面，需矫正 3 点、补充 3 个维度。**

---

## 1. 总体结论

| 维度 | 原文档情况 | 评估 |
| --- | --- | --- |
| 立项流程框架（先定方向、范围、标准再制作） | 与行业实践一致 | ✅ 成立，无需矫正 |
| 受控制作与 QA 闭环 | 与工程实践一致 | ✅ 成立，无需矫正 |
| 数据闸门、回收先于放量 | 与投放实践一致 | ✅ 成立，需补充口径 |
| 产品路线划分 | 只有"短期爆款 / 轻度长线"二分 | ⚠️ 需矫正：补"混合休闲"第三条路线 |
| 变现逻辑 | 只有"纯广告 / 长线 LTV"二分 | ⚠️ 需矫正：补 IAA+IAP 混合变现 |
| 买量与素材 | 只把"素材可表达"列为立项标准 | ⚠️ 需矫正：素材测试应前置并持续化 |
| 隐私与归因 | 完全未涉及 | ❌ 缺失，需补充 |
| 合规（版号/备案/防沉迷/广告合规） | 完全未涉及 | ❌ 缺失，需补充 |

---

## 2. 矫正点（基于 2024–2025 行业信息）

### 2.1 矫正一：纯 IAA 超休闲市场萎缩，"混合休闲"成为主流第三条路线

**行业证据**：
- 超休闲（hypercasual）下载量持续下滑：Sensor Tower 数据显示超休闲品类下载量连年下降，行业媒体称之为"hypercasual's decline continues"（[mobilegamer.biz](https://mobilegamer.biz/data-digest-hypercasuals-decline-continues-as-offline-games-wuthering-waves-and-yes-twerk-race-3d-hit-milestones/)）
- 头部厂商集体转向"混合休闲"（hybrid-casual）：四年狂揽 57 亿下载、做到全球 Top4 的团队宣布发力混合休闲（[nadianshi](http://www.nadianshi.com/2024/12/380339#1)）；Supersonic 2024 年度总结明确提出"混合休闲游戏崛起、多元变现是关键"（[cnmo](https://phone.cnmo.com/news/u_21081.html)）
- 2024 年手游市场继续向混合变现迈进（[新浪科技](https://finance.sina.cn/2024-09-24/detail-incqfsss6049477.d.html#1)）

**矫正动作**：
- 原文档 1.4 的路线二分 → 扩展为三分：**短期爆款（纯 IAA 验证型）/ 混合休闲 / 轻度长线**
- 原文档 3.8 商业化节奏表 → 增加"混合休闲"一行：
  - 获客：IAA 效率获客（广告可承载） + IAP 转化留存
  - 广告节奏：前期用广告快速验证、中后期压低广告频次保护付费用户
  - 回收逻辑：广告回收覆盖获客成本 + IAP 抬高 LTV
- 审查机制影响：**G0 路线审查**增加混合休闲判定；**G5** 增加变现结构审查（见 3.3）

### 2.2 矫正二：变现逻辑从"IAA / 长线"二分 → "IAA / IAA+IAP / IAP"三态

**行业证据**：
- AppsFlyer 研究结论：混合变现策略（hybrid monetization）正在重新定义应用变现（[AppsFlyer](https://www.appsflyer.com/company/newsroom/pr/app-monetization-report/)）
- 中重度游戏也开始尝试多元广告样式补充收益（[Taku 2024 全球手游广告变现报告](https://finance.stockstar.com/IG2025022500013830.shtml#1)）

**矫正动作**：
- 原文档 3.2 "短期看首日 ROI、长线看 LTV" → 补充混合变现判定：
  - IAP 转化率、ARPPU、IAA/IAP 收入占比目标（立项时预设）
  - **广告不得伤害付费用户**：付费用户广告频次/激励位设计单独审查
  - 混合产品的 D0/D3/D7 留存需同时支撑广告与 IAP 两条回收线

### 2.3 矫正三：买量与素材环境变化，"素材可表达"应升级为"素材可测试"

**行业证据**：
- CPI 暴涨、创意内卷加剧，休闲游戏出海突围靠素材与创意迭代（[AppGrowing](https://appgrowing.net/blog/1017review/)）
- 2025 全球移动游戏 UA 报告基于 600 万素材分析，强调创意迭代与素材生命周期（[Mobvista](https://xmp.mobvista.com/en-partner/docs/report-2025-global-mobile-gaming-ua-trends-strategy)）
- Unity 官方建议通过 5 项 A/B 测试提升超休闲游戏收入与用户（[Unity](https://unity.com/cn/blog/5-a-b-tests-to-increase-revenue-and-users-for-your-hyper-casual-game#1)）

**矫正动作**：
- 原文档 1.5 "素材可表达" → 升级为"**素材可测试**"：一张图/3 秒视频不止要能表达吸引力，还要能在投放中测出 CTR/转化
- 原文档 3.7 放量四步 → 前置"素材测试"环节：素材 CTR、素材生命周期、素材矩阵（每期 3–5 套并行测试）
- 审查机制影响：G0 增加"**素材-产品双验证**"审查项（立项就要有素材测试计划）

### 2.4 矫正四：隐私政策改变数据口径与买量归因

**行业证据**：
- 苹果收紧 SDK 审核规则，2024 年春落地新规（[gamelook](http://www.gamelook.com.cn/2023/12/533685/)）
- 中国游戏出海进入"高质量增长"阶段，归因与数据质量成为重点（[AppsFlyer 2025 游戏 App 全景观察报告](https://m.moneyweekly.com.cn/MoneyNews/news_21053.html#1)、[汇量科技 2024 手游出海白皮书](https://news.yxrb.net/2025/0113/5176.html)）

**矫正动作**：
- 原文档 3.5 数据链 → 补充口径说明：
  - iOS 端受 ATT/SKAdNetwork 影响，**D0 数据存在回传延迟**，D0 ROI 应使用"预估值 + 延迟修正"
  - 买量效果不能只看 CPI，应补充 **oCPI（优化后 CPI）与自然量/买量占比**，防止"买量掩盖自然量"
- 审查机制影响：G5 增加"**数据口径审查**"：归因平台、SKAN 回传、归因窗口一致性

---

## 3. 补充维度（原文档完全缺失）

### 3.1 新增门禁：G-合规 审查

**为什么必须加**：原文档三章均未提及任何合规事项，但 2024–2025 年合规是 IAA 项目的一票否决项。

| 市场 | 审查项 | 说明 |
| --- | --- | --- |
| 国内 | 版号 / 小游戏备案 | 无版号/备案不允许上线；小游戏走平台资质备案（[快手小游戏资质规范](https://open.kuaishou.com/miniGameDocs/operation/specification/qualifications.html)） |
| 国内 | 防沉迷 / 未成年人保护 | 实名、时长限制 |
| 国内 | 广告内容合规 | 激励视频不得诱导点击/误导；广告位符合平台广告规范 |
| 海外 | 隐私政策与 ATT | iOS 隐私弹窗、数据收集声明 |
| 海外 | 儿童隐私 | COPPA（美国）/ GDPR-K（欧盟） |
| 海外 | 商店政策 | Google Play 家庭政策、App Store 审核 |

**审查时机**：
- G0：确认目标市场时**粗查**（评估合规成本是否可承受，例如国内版号成本对小团队可能是致命项）
- G4：发布候选前**终审**（不合规不允许上线）

### 3.2 新增审查维度：数据基建

原文档 3.1 要求"数据同时过线"，但未说明数据从哪来。G5 之前必须就位，否则闸门无法执行：
- **广告聚合平台**：MAX / IronSource LevelPlay / AdMob Mediation（国内：穿山甲/优量汇/快手联盟聚合）
- **归因平台**：AppsFlyer / Adjust（买量效果归属）
- **BI 看板**：留存、广告、IAP、LTV 统一口径
- 审查项：G4→G5 之间增加"**数据基建就绪检查**"

### 3.3 新增审查项：指标补充

在原文档 3.1 指标表基础上补充（立项时一并预设及格线）：

| 新增指标 | 用途 | 对应矫正 |
| --- | --- | --- |
| IPM（每千次展示安装） | 素材-安装效率，超休闲常用 | 矫正三 |
| eCPM 单价 | 广告收入端单价监控 | 矫正一/二 |
| ARPPU、IAP 转化率 | 混合变现 IAP 线 | 矫正二 |
| IAA/IAP 收入占比 | 变现结构是否符合预设模型 | 矫正二 |
| 自然量/买量占比、oCPI | 买量效率与自然量健康度 | 矫正四 |
| 素材生命周期、素材 CTR | 创意迭代节奏 | 矫正三 |

---

## 4. 对七个门禁的增补对照表

| 门禁 | 增补审查项 | 依据 |
| --- | --- | --- |
| G0 立项 | 路线增加"混合休闲"判定；"素材可表达"→"素材可测试"（含素材测试计划）；目标市场合规粗查（合规成本可承受性） | 2.1 / 2.3 / 3.1 |
| G1 策划 | （无结构性增补）混合休闲产品需在功能清单中体现 IAP 付费点设计 | 2.2 |
| G2 美术 | 素材资产需可导出为投放素材（试玩广告/图片素材），与立项素材测试计划衔接 | 2.3 |
| G3 工程 | （无增补）混合变现 SDK 接入列入工作包范围与验收 | 2.2 |
| G4 内容与 QA | **合规终审**（版号/备案/隐私/防沉迷/广告合规）成为发布候选的硬性通过项；数据基建就绪检查 | 3.1 / 3.2 |
| G5 产品成立 | 变现结构审查（IAA/IAP 占比、IAP 转化、广告不伤付费）；数据口径审查（SKAN 回传、归因窗口、oCPI/自然量占比）；新增 IPM、eCPM、ARPPU 及格线 | 2.2 / 2.4 / 3.3 |
| G6 放量 | 放量四步前置"素材测试与素材矩阵"；混合变现产品放量时同时监控 IAP 转化不恶化 | 2.3 / 2.2 |

---

## 5. 全面性评估结论

原文档对标 2024–2025 年 IAA 行业现状：

1. **流程层面（全面）**：立项 → 受控制作 → 数据闸门 → 回收先于放量，与行业实践一致，无需大改
2. **路线与变现层面（需矫正）**：纯 IAA 超休闲萎缩、混合休闲崛起，路线与变现必须补第三条路径，否则"立项即过时"
3. **合规层面（缺失，最严重）**：国内版号/备案、海外隐私是现实中的一票否决项，原文档完全没有；必须新增 G-合规 门禁
4. **数据口径层面（需补充）**：隐私政策下的归因延迟、oCPI/自然量占比、IPM/eCPM 等指标缺失，导致"数据同时过线"在实际执行中口径不清

> 完成上述矫正与补充后，审查机制可覆盖 2025 年 IAA 项目的主要真实风险；建议将本文档第 2、3 节内容合并进《AI游戏分阶段审查机制》。

---

## 6. 来源

**行业趋势与路线**
- [Data digest: hypercasual's decline continues](https://mobilegamer.biz/data-digest-hypercasuals-decline-continues-as-offline-games-wuthering-waves-and-yes-twerk-race-3d-hit-milestones/)（mobilegamer.biz）
- [What happened to hypercasual? The market's evolution over the past year](https://www.pocketgamer.biz/what-happened-to-hypercasual-the-markets-evolution-over-the-past-year/)（PocketGamer.biz）
- [Supersonic 总结 2024：混合休闲游戏崛起，多元变现是关键](https://phone.cnmo.com/news/u_21081.html)
- [四年狂揽 57 亿下载、做到全球 Top4，如今他们再发力"混合休闲"](http://www.nadianshi.com/2024/12/380339#1)
- [State of Mobile Gaming 2025](https://sensortower.com/blog/state-of-mobile-gaming-2025)（Sensor Tower）

**混合变现**
- [AppsFlyer：hybrid strategies are redefining app monetization](https://www.appsflyer.com/company/newsroom/pr/app-monetization-report/)
- [2024 年，手游市场继续向混合变现的模式迈进（新浪科技）](https://finance.sina.cn/2024-09-24/detail-incqfsss6049477.d.html#1)
- [Taku《2024 全球手游广告变现报告》](https://finance.stockstar.com/IG2025022500013830.shtml#1)

**买量与素材**
- [CPI 暴涨，创意内卷加剧，休闲游戏出海如何突围？](https://appgrowing.net/blog/1017review/)（AppGrowing）
- [2025 Mobile Game UA Report：Six Million Creatives Analyzed](https://xmp.mobvista.com/en-partner/docs/report-2025-global-mobile-gaming-ua-trends-strategy)（Mobvista）
- [为您的超休闲游戏增加收入和用户的 5 项 A/B 测试（Unity）](https://unity.com/cn/blog/5-a-b-tests-to-increase-revenue-and-users-for-your-hyper-casual-game#1)

**隐私与合规**
- [开发者需负全责，苹果"怒锤 SDK"！2024 年春落地新审核规则](http://www.gamelook.com.cn/2023/12/533685/)（gamelook）
- [快手小游戏：资质规范（备案）](https://open.kuaishou.com/miniGameDocs/operation/specification/qualifications.html)

**市场与数据**
- [中国游戏出海进入"高质量增长"阶段，AppsFlyer 发布 2025 游戏 App 全景观察报告](https://m.moneyweekly.com.cn/MoneyNews/news_21053.html#1)
- [汇量科技发布 2024 手游出海白皮书](https://news.yxrb.net/2025/0113/5176.html)
- [微信史凯中：IAA 小游戏广告如何商业化？](http://www.gamelook.com.cn/2024/04/542933/#1)
- [IAA 小游戏：消耗、活跃、用户画像、eCPM 最新数据全揭秘](https://news.17173.com/content/11152024/101215513.shtml#1)
- [我们观察到的 2025：IAA 出海团队做对与做错的事](https://news.17173.com/content/08142025/194201699.shtml#1)
