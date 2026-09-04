---
date: 2026-08-06
ai: codex
type: 设计
status: 完成
tags: [interaction-spec-system, component, button]
---

# [2026-08-06] 补齐按钮组件层级

---

## 📋 问题解决日志

### 遇到了什么

现有按钮规范只按主、次、危险和文字按钮划分，未明确只有一个按钮、两个并排按钮和列表右侧小按钮三种尺寸场景。

### AI 怎么协作的

用户补充按钮界面要求，明确按钮仅分三级：一级用于单个“升级 / 升星”操作，二级用于弹窗底部并排的“确认 / 取消”，三级用于任务或功能列表最右侧的“领取 / 前往”。Codex 将等级、场景和状态拆开定义。

### 产出结果

- 更新 [组件规范](../projects/interaction-spec-system/docs/component-spec.md) 的三级按钮组件表与补充规则。
- 更新 [设计系统总则](../projects/interaction-spec-system/docs/design-system.md) 的 `3.3 按钮 Button`。
- 更新 [HTML 预览页](../projects/interaction-spec-system/docs/design-system-preview.html) 的三级尺寸示例和规则表。

### 关联项目

support / interaction-spec-system
