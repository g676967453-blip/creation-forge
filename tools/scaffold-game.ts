/**
 * 游戏项目脚手架
 *
 * 交互式创建新的游戏项目，自动从模板复制并配置。
 *
 * 使用: npm run scaffold
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

const ROOT = path.resolve(import.meta.dirname!, '..');
const TEMPLATE = path.join(ROOT, 'templates', 'game-phaser');
const PROJECTS = path.join(ROOT, 'projects');

type ProjectType = 'tutorial' | 'original' | 'sandbox';

const PROJECT_TYPE_DIRS: Record<ProjectType, string> = {
  tutorial: path.join(PROJECTS, 'tutorial'),
  original: path.join(PROJECTS, 'originals'),
  sandbox: path.join(PROJECTS, 'sandbox'),
};

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

  console.log('\n🎮 星火工坊 — 游戏项目脚手架\n');

  // 选择项目类型
  console.log('项目类型:');
  console.log('  1. tutorial  — 教程项目（跟随学习路线）');
  console.log('  2. original  — 原创游戏（自由创作）');
  console.log('  3. sandbox   — 实验沙盒（快速验证想法）');

  const typeAnswer = await ask(rl, '\n选择项目类型 (1/2/3): ');
  const typeMap: Record<string, ProjectType> = { '1': 'tutorial', '2': 'original', '3': 'sandbox' };
  const projectType = typeMap[typeAnswer] ?? 'sandbox';

  // 项目名称
  const name = await ask(rl, '项目英文名称 (如 my-awesome-game): ');
  if (!name) {
    console.log('❌ 项目名称不能为空');
    rl.close();
    return;
  }

  const targetDir = path.join(PROJECT_TYPE_DIRS[projectType], name);

  // 检查是否已存在
  if (fs.existsSync(targetDir)) {
    console.log(`❌ 目录已存在: ${targetDir}`);
    rl.close();
    return;
  }

  // 复制模板
  console.log(`\n📁 创建项目: ${targetDir}`);
  copyDir(TEMPLATE, targetDir);

  // 更新 package.json
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
  pkg.name = `@spark-forge/${name}`;
  pkg.description = `星火工坊游戏项目: ${name}`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 创建项目 README
  const readmePath = path.join(targetDir, 'README.md');
  const readmeContent = `# ${name}

## 玩法概述

[一句话描述这个游戏]

## 操作方式

- 方向键: [功能]
- 空格: [功能]

## 学习目标

- [ ] 待定

## 开发笔记

[记录开发过程中的关键决策和收获]

## AI 协作记录

[记录 AI 在本项目中的贡献]
`;
  fs.writeFileSync(readmePath, readmeContent);

  console.log('\n✅ 项目创建成功!');
  console.log(`\n接下来：`);
  console.log(`  cd projects/${projectType}/${name}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);

  rl.close();
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main().catch((error: unknown) => {
  console.error('创建项目失败:', error);
  process.exit(1);
});
