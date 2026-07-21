/**
 * 学习日志生成器
 *
 * 创建一个新的学习日志文件，自动填入日期和模板。
 *
 * 使用: npm run journal
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

const ROOT = path.resolve(import.meta.dirname!, '..');
const JOURNALS = path.join(ROOT, 'journals');
const TEMPLATE = path.join(JOURNALS, 'template.md');

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n📝 造化坊 — 学习日志生成器\n');

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const topic = await ask(rl, '日志主题 (如 phaser-physics-learning): ');
  const title = await ask(rl, '日志标题 (如 学习Phaser物理引擎): ');

  const fileName = topic ? `${dateStr}-${topic}.md` : `${dateStr}-journal.md`;
  const filePath = path.join(JOURNALS, year, month, fileName);

  // 确保目录存在
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // 检查是否已存在
  if (fs.existsSync(filePath)) {
    console.log(`❌ 日志文件已存在: ${filePath}`);
    rl.close();
    return;
  }

  const content = `# [${dateStr}] ${title || '学习日志'}

## 今天学了什么 (What I Learned)

- [记录今天学到的新知识、新技术]

## 遇到了什么问题 (Problems Encountered)

### 问题 1: [简述]

- **尝试的方案:**
  - [方案A] — [结果]
  - [方案B] — [结果]
- **最终解决:** [怎么解决的]

## AI 如何协助了 (How AI Helped)

- [AI 在哪些环节提供了帮助]
- 效果: ⭐⭐⭐⭐⭐

## 下一步 (Next Steps)

- [ ] [计划做的事情]

## 心情指数 (Mood)

⭐⭐⭐⭐⭐

---

*[可选的随想或补充]*
`;

  fs.writeFileSync(filePath, content);

  console.log(`\n✅ 日志创建成功!`);
  console.log(`📄 ${filePath}`);
  console.log(`\n用编辑器打开即可开始写作。`);

  rl.close();
}

main().catch((error: unknown) => {
  console.error('创建日志失败:', error);
  process.exit(1);
});
