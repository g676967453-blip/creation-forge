# 建筑资产产出目录

> 3D 等距建筑资产 — Lovart 生成 → 绿底抠图 → 2×2 切片 → 1024×1024 透明 PNG

---

## 目录约定

```
outputs/buildings/
├── README.md              ← 本文件
├── {project-name}/        ← 按游戏项目分目录
│   ├── {building_name}.png
│   └── ...
└── _drafts/               ← 风格探索草稿（不提交到 git）
```

---

## 命名规范

```
{building_name}.png

示例：
- blacksmith_forge.png
- wizard_tower.png
- tavern_inn.png
- barracks_fort.png
```

---

## 资产规格

| 属性 | 值 |
|------|-----|
| 分辨率 | 1024×1024 |
| 格式 | PNG (RGBA) |
| 背景 | 透明 |
| 视角 | 45° 等距 (isometric) |
| 风格 | 3D 预渲染 |

---

## 生产工作流

详见 [../../docs/07-建筑工作流.md](../../docs/07-建筑工作流.md)
