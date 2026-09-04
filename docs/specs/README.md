# specs · 技术规范收口

> 可执行的「必须遵守」规格。正文可分散在仓内各处，**发现从本页进入**。  
> 总导航：[../README.md](../README.md)

---

## 仓内 specs

| 规范 | 路径 | 说明 |
|------|------|------|
| 资产导出与切图命名 | [asset-export-and-naming-spec.md](./asset-export-and-naming-spec.md) | 导出尺寸、命名约定 |

---

## 工程约定（权威在 zh-CN）

| 规范 | 路径 |
|------|------|
| 编码规范 | [../zh-CN/05-coding-standards.md](../zh-CN/05-coding-standards.md) |
| Git 分支与提交 | [../zh-CN/06-git-conventions.md](../zh-CN/06-git-conventions.md) |
| 项目结构 | [../zh-CN/04-project-structure.md](../zh-CN/04-project-structure.md) |

---

## 项目内 / 主美知识库（链入，不强制搬家）

| 规范 | 路径 | 说明 |
|------|------|------|
| 游戏交互规范系统 | `projects/interaction-spec-system/` | MD 为数据源；见项目 README |
| UI 协作规范（rewritten） | [../personal-work-records/01-美术规范与标准/_rewritten/game-ui-collaboration-spec.md](../personal-work-records/01-美术规范与标准/_rewritten/game-ui-collaboration-spec.md) | 网格、安全区、双分辨率等 |
| UI 生产管线（rewritten） | [../personal-work-records/01-美术规范与标准/_rewritten/game-ui-production-pipeline.md](../personal-work-records/01-美术规范与标准/_rewritten/game-ui-production-pipeline.md) | 五阶段包装流程 |
| UI 外包指南（rewritten） | [../personal-work-records/01-美术规范与标准/_rewritten/game-ui-outsourcing-guide.md](../personal-work-records/01-美术规范与标准/_rewritten/game-ui-outsourcing-guide.md) | 外包生命周期 |
| asset-pipeline 产出规则 | `projects/asset-pipeline/CLAUDE.md` + memory | 媒体产出不进仓库，桌面目录 |

---

## 新增规范时

1. 若是**全仓硬约束** → 优先放本目录 `docs/specs/*.md` 并登记上表  
2. 若是**单项目** → 放 `projects/<id>/`，本页只加链接  
3. 若是**主美经验成文** → `personal-work-records/`，优选 `_rewritten`，本页链「首选 rewritten」
