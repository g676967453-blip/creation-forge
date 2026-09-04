# Creation Forge (造化坊)

> **Maintenance status:** English here is a **minimal overview only**. Full docs are Chinese under `docs/zh-CN/` and the [docs hub](../README.md). We do **not** keep bilingual parity.

> _A single spark can start a prairie fire._ — Chinese proverb

Creation Forge is the practice ground for **a new learning philosophy for the AI era**:
start with a project → encounter problems → learn what's needed → solve → ship.

AI makes this "learning by doing" truly practical for the first time — when you're stuck,
ask AI, get an instant answer with code, keep building. The bottleneck shifts from
"how to find knowledge" to "are you building something right now?"

Our vehicle is **indie game development** — instant feedback, cross-disciplinary by nature,
infinitely scalable, and inherently fun.

> 📖 The full manifesto: [AI时代的新学习思想](../zh-CN/manifesto.md) (Chinese)

## Our Approach

1. **Project-Based Learning** — Learn by building games, not reading textbooks. Start simple, iterate fast. Done beats perfect.
2. **Human-AI Collaboration** — AI plays a dual role: instant learning engine (makes just-in-time learning fast enough) and cognitive shift enabler (redefines "learned it" from "I remember" to "I can harness AI to build it").
3. **Indie Game Development** — Make playable games. Gameplay > graphics. Done > perfect.

## Tech Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Language  | TypeScript 5.x (strict)       |
| 2D Engine | Phaser 3.80+                  |
| 3D Engine | Godot 4.7 (active track)      |
| Bundler   | Vite 6.x                      |
| Linting   | ESLint 9.x + Prettier 3.x     |
| Testing   | Vitest                        |

## Active Projects

| Project | Tech | Status |
|---------|------|--------|
| GAME-002「开仙门」— Roguelike Tower Defense | Godot 4.7 | V0.1 in progress |
| Xiaohongshu Content Creation | HTML/CSS + Pixso | 14 posts published |
| asset-pipeline — Game Icon Production | Lovart + Photoshop | 3 styles validated |

## Quick Start

```bash
npm install
cp -r templates/game-phaser projects/<your-project>
cd projects/<your-project>
npm install
npm run dev
```

## Documentation

Primary documentation is in **Chinese**. Start at **[docs/README.md](../README.md)** (hub).  
`docs/zh-CN/` = philosophy + engineering conventions. This English README is a minimal overview only.

| # | Document | Description |
|---|----------|-------------|
| 01 | [Project Philosophy](../zh-CN/01-project-philosophy.md) | Project-based learning philosophy |
| 02 | [Tech Stack](../zh-CN/02-tech-stack.md) | Technology choices and rationale |
| 03 | [Development Workflow](../zh-CN/03-workflow.md) | Daily dev cycle, Git, AI collaboration |
| 04 | [Project Structure](../zh-CN/04-project-structure.md) | Directory layout and design intent |
| 05 | [Coding Standards](../zh-CN/05-coding-standards.md) | TypeScript / Phaser conventions |
| 06 | [Git Conventions](../zh-CN/06-git-conventions.md) | Branch strategy and commit format |
| 07 | [Glossary](../zh-CN/07-glossary.md) | Chinese↔English terminology |

Additional docs: [Manifesto](../zh-CN/manifesto.md) · [User Manual](../zh-CN/user-manual.md) · [Operational Loop](../zh-CN/operational-loop.md)

The AI collaboration guide is in [CLAUDE.md](../../CLAUDE.md) (Chinese).

## License

MIT — Learn, share, create.
