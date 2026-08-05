#!/usr/bin/env npx tsx
/**
 * build-prototype.ts
 * 原型配置 → 可交互多屏游戏原型 HTML
 *
 * 用法: npx tsx tools/build-prototype.ts [选项]
 *   --config <path>  原型配置 JSON 文件
 *   --demo            使用内置 demo 配置生成示例原型
 *   --out <path>     输出路径 (默认: dist/prototypes/index.html)
 *   --tokens <json>  Token 覆盖
 */

import * as path from "path";
import * as fs from "fs";
import { parseAllComponents } from "./lib/component-parser";
import { generatePrototype, type PrototypeConfig } from "./lib/prototype-generator";
import type { TokenOverrides } from "./lib/shared/tokens";

const ROOT = path.resolve(__dirname, "..");
const COMPONENTS_DIR = path.join(ROOT, "components");
const DEFAULT_OUT = path.join(ROOT, "dist", "prototypes", "index.html");

/** 内置 Demo 配置 — 展示 6 屏 RPG 手游核心循环 */
const DEMO_CONFIG: PrototypeConfig = {
  title: "RPG 手游交互原型 Demo",
  canvas: "720×1280",
  showHud: true,
  screens: [
    {
      id: "home",
      name: "主页",
      sections: [
        {
          type: "hero-card",
          html: `<div style="padding:12px;display:flex;flex-direction:column;gap:8px;">
            <div style="height:180px;background:var(--bg-4);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:24px;">🎮 主视觉区</div>
            <div class="quick-actions">
              <div class="quick-action" data-goto="heroes"><div class="qa-icon">👥</div><span class="qa-label">英雄</span></div>
              <div class="quick-action" data-goto="battle"><div class="qa-icon">⚔</div><span class="qa-label">战斗</span></div>
              <div class="quick-action" data-goto="bag"><div class="qa-icon">🎒</div><span class="qa-label">背包</span></div>
              <div class="quick-action" data-goto="shop"><div class="qa-icon">🏪</div><span class="qa-label">商店</span></div>
            </div>
            <div class="event-banner"><div class="ev-icon">🎉</div><div class="ev-info"><div class="ev-title">限时召唤 · 龙焰降临</div><div class="ev-desc">传说品质出现率 UP！</div></div><div class="ev-time">23:59:59</div></div>
            <div class="quest-card"><div class="qc-icon">📋</div><div class="qc-info"><div class="qc-title">每日登录</div><div class="qc-desc">累计登录 7 天</div><div class="qc-progress"><div class="qc-progress-fill" style="width:57%"></div></div></div><div class="qc-reward">💰 500</div></div>
          </div>`,
        },
      ],
    },
    {
      id: "heroes",
      name: "英雄列表",
      sections: [
        {
          html: `<div class="screen-header"><button class="sh-back" data-goto="home">‹</button><h2 class="sh-title">英雄列表</h2><button class="sh-action">筛选</button></div>
            <div class="sort-bar"><button class="sort-btn active">全部</button><button class="sort-btn">等级 ↑</button><button class="sort-btn">稀有度</button></div>
            <div style="padding:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
              <div class="hero-card hero-card-legend" data-goto="detail"><div class="hc-art"><div class="hc-rarity-badge badge badge-legend">传说</div><div class="hc-element">🔥</div></div><div class="hc-info"><div class="hc-name">龙骑士</div><div class="hc-stars">★★★★★</div></div></div>
              <div class="hero-card hero-card-epic"><div class="hc-art"><div class="hc-rarity-badge badge badge-epic">史诗</div><div class="hc-element">❄</div></div><div class="hc-info"><div class="hc-name">冰霜女巫</div><div class="hc-stars">★★★★☆</div></div></div>
              <div class="hero-card hero-card-rare"><div class="hc-art"><div class="hc-rarity-badge badge badge-rare">稀有</div><div class="hc-element">🌿</div></div><div class="hc-info"><div class="hc-name">森林游侠</div><div class="hc-stars">★★★☆☆</div></div></div>
              <div class="hero-card hero-card-common"><div class="hc-art"><div class="hc-rarity-badge badge badge-common">普通</div><div class="hc-element">🛡</div></div><div class="hc-info"><div class="hc-name">铁卫士</div><div class="hc-stars">★★☆☆☆</div></div></div>
              <div class="hero-card hero-card-locked"><div class="hc-art" style="display:flex;align-items:center;justify-content:center;font-size:20px;">🔒</div><div class="hc-info"><div class="hc-name">???</div></div></div>
            </div>`,
        },
      ],
    },
    {
      id: "detail",
      name: "英雄详情",
      sections: [
        {
          html: `<div style="height:200px;background:var(--bg-4);position:relative;"><button class="sh-back" data-goto="heroes" style="position:absolute;top:8px;left:8px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:2;">‹</button><div style="position:absolute;bottom:0;left:0;right:0;padding:20px 12px 10px;background:linear-gradient(transparent,rgba(0,0,0,0.9));"><div style="color:#fff;font-size:18px;font-weight:700;font-family:var(--font-heading);">龙骑士</div><div style="color:rgba(255,255,255,0.7);font-size:11px;font-family:var(--font-mono);">Lv.99 · ★★★★★</div></div></div>
            <div style="padding:10px 12px;display:flex;flex-direction:column;gap:8px;">
              <div class="progress-bar"><span class="progress-label">HP</span><div class="progress-track"><div class="progress-fill hp-high" style="width:92%"></div></div><span class="progress-value">92%</span></div>
              <div class="progress-bar"><span class="progress-label">ATK</span><div class="progress-track"><div class="progress-fill hc-atk" style="width:78%"></div></div><span class="progress-value">78%</span></div>
              <div class="progress-bar"><span class="progress-label">EXP</span><div class="progress-track progress-track-sm"><div class="progress-fill exp-fill" style="width:45%"></div></div><span class="progress-value">45%</span></div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px;">
                <div class="item-frame item-frame-legend"><div class="if-icon">🗡</div><div class="if-equipped-mark">E</div></div>
                <div class="item-frame item-frame-epic"><div class="if-icon">🛡</div></div>
                <div class="item-frame item-frame-rare"><div class="if-icon">💍</div></div>
                <div class="item-frame item-frame-common"><div class="if-icon">👢</div></div>
                <div class="item-frame item-frame-empty"></div>
                <div class="item-frame item-frame-empty"></div>
              </div>
              <div style="display:flex;gap:8px;margin-top:4px;">
                <div class="skill-frame skill-frame-legend"><div class="sf-icon">🔥</div><div class="sf-energy">50</div></div>
                <div class="skill-frame skill-frame-epic"><div class="sf-icon">❄</div><div class="sf-cooldown">12s</div></div>
                <div class="skill-frame skill-frame-rare"><div class="sf-icon">💨</div></div>
                <div class="skill-frame skill-frame-locked">🔒</div>
              </div>
            </div>`,
        },
      ],
    },
    {
      id: "battle",
      name: "战斗",
      showHud: false,
      sections: [
        {
          html: `<div style="flex:1;background:var(--bg-3);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:24px;">⚔ 战斗界面<br><span style="font-size:12px;">(点击返回)</span></div>
            <div style="display:flex;justify-content:center;gap:12px;padding:8px 12px 12px;">
              <div class="skill-frame skill-frame-legend"><div class="sf-icon">🔥</div></div>
              <div class="skill-frame skill-frame-epic"><div class="sf-icon">❄</div></div>
              <div class="skill-frame skill-frame-rare"><div class="sf-icon">💨</div></div>
            </div>`,
        },
      ],
    },
    {
      id: "bag",
      name: "背包",
      sections: [
        {
          html: `<div class="screen-header"><button class="sh-back" data-goto="home">‹</button><h2 class="sh-title">背包</h2></div>
            <div style="padding:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
              <div class="item-frame item-frame-legend"><div class="if-icon">🗡</div><div class="if-qty">x1</div></div>
              <div class="item-frame item-frame-epic"><div class="if-icon">🛡</div><div class="if-qty">x1</div></div>
              <div class="item-frame item-frame-rare"><div class="if-icon">💍</div><div class="if-qty">x3</div></div>
              <div class="item-frame item-frame-common"><div class="if-icon">🧪</div><div class="if-qty">x99</div></div>
              <div class="item-frame item-frame-common"><div class="if-icon">📜</div><div class="if-qty">x12</div></div>
              <div class="item-frame item-frame-empty"></div>
              <div class="item-frame item-frame-empty"></div>
              <div class="item-frame item-frame-locked">🔒</div>
            </div>`,
        },
      ],
    },
    {
      id: "shop",
      name: "商店",
      sections: [
        {
          html: `<div class="screen-header"><button class="sh-back" data-goto="home">‹</button><h2 class="sh-title">商店</h2></div>
            <div style="padding:10px;display:flex;flex-direction:column;gap:8px;">
              <div class="quest-card"><div class="qc-icon">💎</div><div class="qc-info"><div class="qc-title">钻石礼包</div><div class="qc-desc">300 钻石 + 附赠 60</div></div><div class="qc-reward">¥30</div></div>
              <div class="quest-card"><div class="qc-icon">🎫</div><div class="qc-info"><div class="qc-title">召唤券包</div><div class="qc-desc">10 连召唤券</div></div><div class="qc-reward">¥68</div></div>
              <div class="quest-card"><div class="qc-icon">⭐</div><div class="qc-info"><div class="qc-title">月卡</div><div class="qc-desc">每日领取 100 钻 · 30天</div></div><div class="qc-reward">¥30</div></div>
            </div>`,
        },
      ],
    },
  ],
  dock: [
    { id: "home", label: "主页", icon: "🏠" },
    { id: "heroes", label: "英雄", icon: "👥", badge: 3 },
    { id: "battle", label: "", icon: "", centerCta: true },
    { id: "bag", label: "背包", icon: "🎒" },
    { id: "shop", label: "商店", icon: "🏪" },
  ],
};

function main(): void {
  const args = process.argv.slice(2);
  let configPath: string | null = null;
  let outPath = DEFAULT_OUT;
  let tokenOverrides: TokenOverrides | undefined;
  let useDemo = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && args[i + 1]) {
      configPath = path.resolve(args[++i]);
    } else if (args[i] === "--demo") {
      useDemo = true;
    } else if (args[i] === "--out" && args[i + 1]) {
      outPath = path.resolve(args[++i]);
    } else if (args[i] === "--tokens" && args[i + 1]) {
      try {
        tokenOverrides = JSON.parse(args[++i]);
      } catch {
        console.error("❌ --tokens 参数不是有效的 JSON");
        process.exit(1);
      }
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
📱 build-prototype — 原型配置 → 可交互多屏原型 HTML

用法: npx tsx tools/build-prototype.ts [选项]

选项:
  --config <path>  原型配置 JSON 文件路径
  --demo           使用内置 Demo 配置
  --out <path>     输出路径 (默认: dist/prototypes/index.html)
  --tokens <json>  Token 颜色覆盖
  --help, -h       显示帮助

示例:
  npx tsx tools/build-prototype.ts --demo
  npx tsx tools/build-prototype.ts --config my-prototype.json
`);
      process.exit(0);
    }
  }

  let config: PrototypeConfig;

  if (configPath) {
    console.log(`📖 读取配置: ${configPath}`);
    const raw = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(raw);
  } else if (useDemo) {
    console.log("🎮 使用内置 Demo 配置");
    config = DEMO_CONFIG;
  } else {
    console.error("❌ 请指定 --config <path> 或 --demo");
    console.log("   使用 --help 查看帮助");
    process.exit(1);
  }

  console.log("🏭 解析组件库...");
  const components = parseAllComponents(COMPONENTS_DIR);
  console.log(`📦 ${components.length} 个组件已加载`);

  console.log(`📱 生成原型 (${config.screens.length} 屏)...`);
  const html = generatePrototype(config, components, tokenOverrides);

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`\n✅ 原型已生成: ${outPath}`);
  console.log(`   大小: ${(html.length / 1024).toFixed(1)} KB`);
  console.log(`   屏幕: ${config.screens.map((s) => s.id).join(" → ")}`);
  console.log(`   在浏览器中打开: file:///${outPath.replace(/\\/g, "/")}`);
}

main();
