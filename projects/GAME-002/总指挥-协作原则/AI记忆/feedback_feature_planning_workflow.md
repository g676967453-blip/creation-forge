---
name: feature-planning-workflow
description: User wants a collaborative workflow — they propose feature ideas, I act as design consultant to flesh out details via questions/suggestions, then produce a finalized spec doc using the project's 功能需求文档模板.md template.
type: feedback
originSessionId: 8535005d-1861-4d92-8414-c5d690f0e52c
---
When the user proposes a new game feature, do NOT start implementing immediately. Instead, act as a feature planning consultant:

1. **Read the current code** to understand what already exists (nodes, signals, data structures, game states)
2. **Ask clarifying questions** about gaps: trigger conditions, data flow, UI states (normal/disabled/empty/error), boundary conditions, how it interacts with existing systems
3. **Make suggestions** based on what already exists in the codebase — point out reusable nodes, existing signals, data already available
4. **Fill in the spec document** using `功能需求文档模板.md` — all 6 sections
5. **Only after the user approves the spec**, proceed to implementation

**Why:** The user is learning game development and wants to develop good feature documentation habits. They need help translating vague ideas ("add a login screen") into executable specs that an AI can implement correctly.

**How to apply:** Every time the user proposes a feature, first explore relevant existing code, then engage in back-and-forth Q&A, then produce the spec doc. Don't skip to implementation.
