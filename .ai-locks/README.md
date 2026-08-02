# .ai-locks — 文件锁目录

> 多 AI 协作时，修改共享状态文件前在此目录创建锁文件，防止两个 AI 同时修改同一文件。

## 协议

见 [AI_COLLABORATION.md](../AI_COLLABORATION.md) 第 4 节「文件锁协议」。

## 锁文件格式

```yaml
---
ai: <身份标签>
file: <相对于项目根目录的文件路径>
operation: <操作描述>
locked_at: <ISO 8601 时间戳>
expires_at: <ISO 8601 时间戳，建议 locked_at + 30分钟>
---
```

## 需要锁的共享文件

- `docs/目标规划.md`
- `docs/个人待办.md`
- `tools/collect-data.ts`
- `CLAUDE.md`
- `AI_COLLABORATION.md`
- `.claude/settings.json`
- `memory/MEMORY.md`
- `memory/` 下的任何 `.md` 文件

## 规则

1. 修改前检查此目录是否有对应锁文件
2. 无锁或锁已过期 → 创建锁 → 修改 → 删除锁
3. 有锁且未过期 → 等待或告知用户
4. 只读不需要锁
5. 锁文件不提交到 Git（已在 .gitignore 排除）
6. 锁 30 分钟后自动过期（防止崩溃残留）

## 当前锁状态

_（空 — 没有正在进行的修改）_
