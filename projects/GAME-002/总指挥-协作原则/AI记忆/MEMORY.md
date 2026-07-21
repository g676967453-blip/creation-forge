# AI记忆索引

> 本文件夹存放AI跨会话持久记忆。AI每次会话开始时读取此索引了解项目状态。

## 工作日志

- [2026-07-04](project_worklog_2026-07-04.md) — 御剑诀回旋收尾、攻击范围过滤、Boss击杀要求、多项bug修复
- [2026-07-05](project_worklog_2026-07-05.md) — 项目全面复盘、MVP完成度评估、下阶段规划（让游戏更好玩）
- [2026-07-06](project_worklog_2026-07-06.md) — 防御机制实装完成（evasion/shield/block/lifesteal）、数值配表CSV扩展（spirit加成+敌人护甲）、Lovart图标资产生成规范
- [2026-07-07](project_worklog_2026-07-07.md) — 远程怪实装、波次修正（right_flank+波间停顿）、ENEMY_SPRITES→CSV清理、器灵血条/护盾/飘字可视化
- [2026-07-09](project_worklog_2026-07-09.md) — 搭建"总指挥-协作原则"人机协作工程系统（21个文件、6大模块）

## 行为规则

- [功能规划工作流](feedback_feature_planning_workflow.md) — 用户提功能时：先探索代码→提问澄清→填写需求模板→用户批准后再实现
- [UI必须在编辑器中可编辑](project_dev_standard_ui_in_scenes.md) — UI节点用.tscn场景文件，不用纯代码生成；动态元素引用预制模板场景
