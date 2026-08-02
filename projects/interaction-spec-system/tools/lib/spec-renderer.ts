/**
 * 游戏交互规范 HTML 渲染器
 * 将 ParsedSpec 渲染为自包含 HTML 页面
 * 核心特性：网格可视化、尺寸标注、组件上下文展示
 */

import type { SpecConfig, SpecSection, Principle, ParsedSpec } from "./spec-parser";
import { getTokenCSS, type TokenOverrides, hexToRGBA } from "./shared/tokens";

// ═══════════════════════════════════════════════
// 网格计算引擎
// ═══════════════════════════════════════════════

interface GridMetrics {
  phoneW: number;        // 展示用手机框宽度
  phoneH: number;        // 展示用手机框高度
  scale: number;         // 缩放比
  contentW: number;      // 内容区宽度(px)
  colW: number;          // 单列宽度(px)
  gutterW: number;       // 沟槽宽度(px)
  marginW: number;       // 边距宽度(px)
  gridUnit: number;      // 缩放后的基础网格单位
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; xxxl: number };
  // 拇指热区 (缩放到展示尺寸)
  thumbZones: { y0: number; y1: number; y2: number; y3: number };
}

function computeGrid(config: SpecConfig): GridMetrics {
  const phoneW = 420; // 展示手机框宽度（适配竖版720/横版1334）
  const scale = phoneW / config.canvas_width;
  const phoneH = phoneW * config.canvas_height / config.canvas_width; // 不取整，保持精确宽高比

  const contentW = config.canvas_width - config.grid_margin * 2;
  const colW = Math.round((contentW - config.grid_gutter * (config.grid_columns - 1)) / config.grid_columns);
  const gutterW = config.grid_gutter;
  const marginW = config.grid_margin;
  const gridUnit = Math.round(config.grid_base * scale * 100) / 100;

  const spacing = {
    xs: Math.round(4 * scale),
    sm: Math.round(8 * scale),
    md: Math.round(16 * scale),
    lg: Math.round(24 * scale),
    xl: Math.round(32 * scale),
    xxl: Math.round(48 * scale),
    xxxl: Math.round(64 * scale),
  };

  const thumbZones = {
    y0: 0,
    y1: Math.round(phoneH * 0.39),    // 0~39% 难以触及 (对应1280画布 0~500)
    y2: Math.round(phoneH * 0.625),   // 39~63% 伸展区 (对应 500~800)
    y3: Math.round(phoneH * 0.859),   // 63~86% 自然热区 (对应 800~1100)
  };

  return { phoneW, phoneH, scale, contentW, colW, gutterW, marginW, gridUnit, spacing, thumbZones };
}

// ═══════════════════════════════════════════════
// HTML 工具函数
// ═══════════════════════════════════════════════

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const tag = (platform: string) => {
  const map: Record<string, string> = {
    "vertical-mobile": "竖版手游",
    "horizontal-mobile": "横版游戏",
    pc: "PC 游戏",
    console: "主机游戏",
  };
  return map[platform] || platform;
};

// ═══════════════════════════════════════════════
// 主渲染函数
// ═══════════════════════════════════════════════

export function renderHTML(spec: ParsedSpec): string {
  const { config, title, sections } = spec;
  const m = computeGrid(config);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} v${esc(config.version)}</title>
<style>
/* ═══════════ 自动生成的 CSS 变量 ═══════════ */
${generateCSS(config, m)}
/* ═══════════ 通用样式 ═══════════ */
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--page-bg);color:var(--text-body);font-family:'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.7;max-width:1100px;margin:0 auto;padding:40px 20px 100px}

/* Header */
.spec-header{text-align:left;padding:48px 0 36px;border-bottom:2px solid var(--border-subtle);margin-bottom:36px}
.spec-header .tags{display:flex;justify-content:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.spec-header .tags span{font-size:10px;color:var(--text-muted);background:var(--surface);padding:2px 10px;border-radius:99px;border:1px solid var(--border-subtle);letter-spacing:1px}
.spec-header h1{font-size:28px;font-weight:700;color:var(--text-head);letter-spacing:3px;margin-bottom:4px}
.spec-header .sub{font-size:14px;color:var(--accent);font-weight:500;letter-spacing:2px}
.spec-header .ref{margin-top:12px;font-size:11px;color:var(--text-muted);line-height:1.6}
.spec-header .ref b{color:var(--accent);font-weight:600}

/* 原则卡片 */
.pr-row{display:flex;gap:14px;margin:20px 0 28px;flex-wrap:wrap}
.pr-card{flex:1;min-width:160px;background:var(--surface);border:1px solid var(--border-default);border-radius:8px;padding:16px;text-align:center}
.pr-card .pc{font-size:26px;font-weight:700;color:var(--accent);margin-bottom:2px}
.pr-card .pt{font-size:12px;font-weight:600;color:var(--text-head)}
.pr-card .pd{font-size:10px;color:var(--text-muted);margin-top:3px;line-height:1.5}

/* TOC */
.toc{background:var(--surface);border:1px solid var(--border-default);border-radius:8px;padding:20px 24px;margin:24px 0}
.toc h3{font-size:14px;color:var(--text-head);margin-bottom:10px}
.toc ol{columns:2;column-gap:28px;margin-left:18px}
.toc li{margin:4px 0;font-size:12px}
.toc a{color:var(--text-body);text-decoration:none}
.toc a:hover{color:var(--accent)}

/* 章节标题 */
h2{font-size:18px;font-weight:700;color:var(--text-head);margin:44px 0 16px;padding-bottom:6px;border-bottom:2px solid var(--border-subtle);display:flex;align-items:center;gap:8px}
h2 .num{font-size:11px;color:var(--accent);background:var(--accent-bg);padding:2px 7px;border-radius:4px;font-weight:600}

/* 两栏布局：视觉展示 + 文字说明 */
.spec-row{display:flex;gap:24px;margin:14px 0;align-items:flex-start}
.spec-visual{flex:0 0 48%;min-width:0;display:flex;justify-content:center;align-items:flex-start;flex-wrap:wrap;gap:10px}
.spec-text{flex:1;min-width:0}
.spec-text h3{font-size:15px;font-weight:600;color:var(--text-head);margin:10px 0 6px}
.spec-text h3:first-child{margin-top:0}
.spec-text p{margin:4px 0;font-size:13px}
.spec-text ul,.spec-text ol{margin:6px 0 6px 18px;font-size:13px}
.spec-text li{margin:2px 0}
@media(max-width:780px){.spec-row{flex-direction:column}.spec-visual{flex:auto;width:100%}}

/* 表格 */
.tbl{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0 12px}
.tbl th,.tbl td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--border-subtle)}
.tbl th{background:var(--surface-hover);color:var(--text-head);font-weight:600;font-size:10px;letter-spacing:.5px;white-space:nowrap}
.tbl tr:hover td{background:rgba(0,0,0,.01)}

pre{background:var(--code-bg);border:1px solid var(--border-subtle);border-radius:5px;padding:10px 14px;font-size:11px;line-height:1.55;margin:8px 0;color:var(--text-muted);font-family:'SF Mono','Fira Code',monospace;overflow-x:auto}
blockquote{border-left:3px solid var(--accent);margin:10px 0;padding:6px 12px;background:var(--accent-bg);border-radius:0 4px 4px 0;font-size:12px;color:var(--text-muted)}
.note{font-size:11px;color:var(--text-muted);margin-top:4px}
.swatch{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:middle;margin-right:4px;border:1px solid rgba(0,0,0,.08)}

/* ═══════════ 手机原型框 ═══════════ */
.proto-col{display:flex;flex-direction:column;align-items:center;gap:4px}
.proto-label{font-size:10px;color:var(--text-muted);text-align:center;letter-spacing:1px}
.phone{width:${m.phoneW}px;height:${m.phoneH}px;background:var(--phone-bg);border:2.5px solid var(--phone-border);border-radius:16px;position:relative;overflow:hidden;flex-shrink:0;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.phone .notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:60px;height:14px;background:var(--phone-bg);border-radius:0 0 9px 9px;z-index:20;border:1px solid var(--phone-border);border-top:none}
.phone .mini-capsule{position:absolute;z-index:21;background:rgba(0,0,0,.15);border:1.5px dashed rgba(0,0,0,.25);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:6px;color:rgba(0,0,0,.35);pointer-events:none}
.phone .mini-capsule::after{content:'胶囊';white-space:nowrap}

/* ═══════════ 网格覆盖层 ═══════════ */
.grid-overlay{position:absolute;inset:0;pointer-events:none;z-index:10}
.grid-col{position:absolute;top:0;bottom:0;background:var(--grid-col-color)}
.grid-gutter{position:absolute;top:0;bottom:0;background:transparent}
.grid-margin{position:absolute;top:0;bottom:0;background:var(--grid-margin-color)}

/* 安全区覆盖 */
.sa-top{position:absolute;top:0;left:0;right:0;z-index:9;background:var(--sa-top-color);display:flex;align-items:flex-end;justify-content:center;font-size:7px;color:rgba(200,60,60,.7);padding-bottom:2px;pointer-events:none}
.sa-content{position:absolute;z-index:8;background:rgba(60,163,116,.05);display:flex;align-items:center;justify-content:center;font-size:7px;color:rgba(60,163,116,.5);pointer-events:none}
.sa-bottom{position:absolute;left:0;right:0;z-index:9;background:var(--sa-bottom-color);display:flex;align-items:flex-start;justify-content:center;font-size:7px;color:rgba(200,160,40,.7);padding-top:1px;pointer-events:none}

/* 热区覆盖 */
.tz-z1{position:absolute;left:0;right:0;z-index:8;background:rgba(200,60,60,.08);display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(180,40,40,.55);font-weight:600;pointer-events:none}
.tz-z2{position:absolute;left:0;right:0;z-index:8;background:rgba(200,160,40,.08);display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(170,130,30,.55);font-weight:600;pointer-events:none}
.tz-z3{position:absolute;left:0;right:0;z-index:8;background:rgba(60,163,116,.1);display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(40,140,100,.55);font-weight:600;pointer-events:none}
.tz-z4{position:absolute;left:0;right:0;z-index:8;background:rgba(60,140,220,.11);display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(40,120,200,.55);font-weight:600;pointer-events:none}

/* ═══════════ 尺寸标注 ═══════════ */
.dim-h{display:flex;align-items:center;gap:4px;font-size:9px;color:var(--accent);font-weight:600;margin:2px 0}
.dim-h .line{height:1px;background:var(--accent);flex:1;position:relative}
.dim-h .line::before,.dim-h .line::after{content:'';position:absolute;top:-3px;width:1px;height:7px;background:var(--accent)}
.dim-h .line::before{left:0}.dim-h .line::after{right:0}
.dim-v{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:9px;color:var(--accent);font-weight:600}
.dim-v .line{width:1px;background:var(--accent);flex:1;position:relative;min-height:20px}
.dim-v .line::before,.dim-v .line::after{content:'';position:absolute;left:-3px;width:7px;height:1px;background:var(--accent)}
.dim-v .line::before{top:0}.dim-v .line::after{bottom:0}

/* ═══════════ 间距阶梯 ═══════════ */
.sp-demo{display:flex;flex-direction:column;gap:0}
.sp-demo .sr{display:flex;align-items:center;gap:8px;padding:2px 0}
.sp-demo .sl{font-size:10px;color:var(--text-muted);width:55px;text-align:right;flex-shrink:0}
.sp-demo .sb{height:7px;background:var(--accent-bg-solid);border-radius:2px;flex-shrink:0}
.sp-demo .sv{font-size:9px;color:var(--text-body);flex-shrink:0}

/* ═══════════ 色板 ═══════════ */
.color-palette{display:flex;flex-wrap:wrap;gap:8px}
.color-chip{width:100px;border-radius:6px;overflow:hidden;border:1px solid var(--border-subtle)}
.color-chip .preview{height:48px}
.color-chip .info{padding:6px 8px;background:var(--surface);font-size:9px}
.color-chip .info .hex{font-weight:600;color:var(--text-head)}
.color-chip .info .label{color:var(--text-muted);margin-top:1px}

/* ═══════════ 组件展示 ═══════════ */
.comp-cell{display:flex;flex-direction:column;align-items:center;gap:4px}
.comp-cell .clbl{font-size:9px;color:var(--text-muted)}
.comp-row{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin:6px 0}
.comp-row.ctr{align-items:center}
.comp-context{border:1px dashed var(--border-default);border-radius:6px;padding:8px;background:var(--surface)}

/* 按钮 */
.cbtn{display:inline-flex;align-items:center;justify-content:center;font-family:inherit;border:none;cursor:default;font-weight:600;border-radius:4px}
.cbtn-pri{width:${Math.round(280 * m.scale)}px;height:${Math.round(52 * m.scale)}px;background:var(--accent);color:#fff;font-size:11px;letter-spacing:2px}
.cbtn-pri.dis{opacity:.4;filter:grayscale(.4)}
.cbtn-sec{width:${Math.round(200 * m.scale)}px;height:${Math.round(44 * m.scale)}px;background:var(--surface);color:var(--text-body);font-size:10px;border:1.2px solid var(--border-default);letter-spacing:1px}
.cbtn-sm{width:${Math.round(120 * m.scale)}px;height:${Math.round(36 * m.scale)}px;background:var(--code-bg);color:var(--text-body);font-size:9px;border:1px solid var(--border-subtle);letter-spacing:1px}
.cbtn-ic{width:${Math.round(48 * m.scale)}px;height:${Math.round(48 * m.scale)}px;background:var(--code-bg);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:13px}
.cbtn-dg{width:${Math.round(86 * m.scale)}px;height:${Math.round(36 * m.scale)}px;background:rgba(200,72,72,.06);color:var(--danger);border:1px solid rgba(200,72,72,.18);font-size:10px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-weight:600}

/* 卡片 */
.cc{width:${Math.round(90 * m.scale)}px;padding:${Math.round(8 * m.scale)}px ${Math.round(10 * m.scale)}px;border-radius:6px;border:1.8px solid;display:flex;flex-direction:column;align-items:center;gap:4px}
.cc .cci{width:${Math.round(24 * m.scale)}px;height:${Math.round(24 * m.scale)}px;background:rgba(0,0,0,.03);border-radius:3px}
.cc .ccb{padding:1px 6px;border-radius:99px;font-size:6px;letter-spacing:.5px}
.cc .ccn{font-size:9px;font-weight:600;color:var(--text-head)}
.cc .ccd{font-size:6px;color:var(--text-muted);text-align:center;line-height:1.2}
.cc.sel{border-color:var(--accent);box-shadow:0 0 8px rgba(200,150,74,.18)}
.cc.lock{opacity:.35;border-style:dashed;filter:grayscale(.4)}

/* 稀有度 */
${rarityCardCSS(config)}
	${rarityGameComponentCSS(config)}

/* 进度条 */
.bar-r{display:flex;align-items:center;gap:6px;margin:3px 0}
.bar-r .blbl{font-size:9px;color:var(--text-muted);width:26px;text-align:right;flex-shrink:0}
.bar-r .btrack{flex:1;height:8px;background:rgba(0,0,0,.04);border-radius:4px;overflow:hidden}
.bar-r .bfill{height:100%;border-radius:4px}

/* 槽位 */
.csl{width:${Math.round(34 * m.scale)}px;height:${Math.round(34 * m.scale)}px;border-radius:4px;display:flex;align-items:center;justify-content:center;position:relative;font-size:8px}
.csl.emp{border:1.3px dashed rgba(0,0,0,.1);background:rgba(0,0,0,.005)}
.csl.lkd{border:1.3px solid rgba(0,0,0,.05);opacity:.3}
.csl .sld{position:absolute;top:2px;right:2px;width:4px;height:4px;border-radius:50%}

/* Tab */
.ctabs{display:flex;background:var(--code-bg);border-radius:4px;overflow:hidden;border:1px solid var(--border-subtle)}
.ctab{padding:4px 12px;font-size:9px;color:var(--text-muted);border-bottom:2px solid transparent;cursor:default}
.ctab.on{color:var(--accent);border-bottom-color:var(--accent);background:var(--accent-bg)}

/* Badge */
.cbadge{display:inline-flex;padding:1px 7px;border-radius:99px;font-size:8px;font-weight:600;letter-spacing:.3px}
.cbadge.dot{width:7px;height:7px;padding:0;border-radius:50%;background:var(--danger)}

/* Toggle */
.ctg{width:${Math.round(m.phoneW*51/375)}px;height:${Math.round(m.phoneW*31/375)}px;border-radius:${Math.round(m.phoneW*16/375)}px;background:rgba(0,0,0,.1);position:relative;cursor:default}
.ctg.on{background:var(--success)}
.ctg::after{content:'';position:absolute;top:${(m.phoneW*1.5/375).toFixed(1)}px;left:${(m.phoneW*1.5/375).toFixed(1)}px;width:${Math.round(m.phoneW*13/375)}px;height:${Math.round(m.phoneW*13/375)}px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.ctg.on::after{left:${(m.phoneW*15.5/375).toFixed(1)}px}

/* Input */
.cinp{width:130px;height:24px;background:var(--surface);border:1px solid var(--border-default);border-radius:3px;padding:0 6px;font-family:inherit;font-size:10px;color:var(--text-body);display:flex;align-items:center}
.cinp.ph{color:var(--text-muted)}

/* ═══════════ 游戏专用组件 ═══════════ */
.cav{position:relative;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.cav .av-img{width:100%;height:100%;background:var(--surface);display:flex;align-items:center;justify-content:center;border-radius:50%}
.cav .av-lv{position:absolute;bottom:-2px;right:-2px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;border:1.5px solid #fff}
.cav .av-dot{position:absolute;top:0;right:0;border-radius:50%;border:1.5px solid #fff}
.cav .av-dot.on{background:var(--success)}
.cav .av-dot.off{background:#aaa}
.chc{border-radius:6px;border:2px solid;display:flex;flex-direction:column;overflow:hidden;position:relative;flex-shrink:0}
.chc .hc-art{flex:0 0 55%;border-bottom:1px solid;display:flex;align-items:center;justify-content:center;color:var(--text-muted);position:relative}
.chc .hc-rarity-badge{position:absolute;top:3px;left:3px;padding:0 5px;border-radius:99px;font-size:6px;font-weight:600}
.chc .hc-elem{position:absolute;top:3px;right:3px;border-radius:50%;background:rgba(0,0,0,.04);display:flex;align-items:center;justify-content:center}
.chc .hc-info{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 5px}
.chc .hc-name{font-weight:700;color:var(--text-head)}
.chc .hc-star-row{color:var(--accent);letter-spacing:1px}
.chc .hc-stat-row{display:flex;align-items:center;gap:2px;width:100%}
.chc .hc-stat-row .slbl{color:var(--text-muted);text-align:right;flex-shrink:0}
.chc .hc-stat-row .strack{flex:1;height:4px;background:rgba(0,0,0,.05);border-radius:2px;overflow:hidden}
.chc .hc-stat-row .sfill{height:100%;border-radius:2px}
.chc.sel{box-shadow:0 0 8px rgba(200,150,74,.25)}
.chc.lock{opacity:.35;border-style:dashed;filter:grayscale(.4)}
.cif{display:flex;align-items:center;justify-content:center;position:relative;border-radius:5px;flex-shrink:0}
.cif .if-icon{background:rgba(0,0,0,.03);display:flex;align-items:center;justify-content:center;border-radius:3px}
.cif .if-qty{position:absolute;bottom:1px;right:1px;padding:0 2px;border-radius:99px;background:rgba(0,0,0,.55);color:#fff;font-weight:600;line-height:1.3}
.cif .if-equipped{position:absolute;top:1px;left:1px;border-radius:2px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.cif.emp{border-style:dashed;opacity:.4}
.csf-item{display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0}
.ctt{border-radius:5px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12);border:1px solid;flex-shrink:0}
.ctt .tt-title{padding:3px 7px;color:#fff;font-weight:600}
.ctt .tt-body{padding:5px 7px;color:var(--text-body);background:var(--surface);line-height:1.45}
.ctt .tt-row{display:flex;justify-content:space-between;padding:2px 7px;background:var(--surface)}
.ctt .tt-row .tt-k{color:var(--text-muted);flex-shrink:0}
.ctt .tt-row .tt-v{font-weight:600;color:var(--text-head)}
.ctt .tt-arrow{width:0;height:0;margin:0 auto;border-left:5px solid transparent;border-right:5px solid transparent}
.cdlg-overlay{position:absolute;inset:0;background:rgba(0,0,0,.35);z-index:25;display:flex;align-items:center;justify-content:center}
.cdlg-box{border-radius:6px;border:1px solid;overflow:hidden;background:var(--surface);box-shadow:0 2px 12px rgba(0,0,0,.08)}
.cdlg-box .dg-title{text-align:center;font-weight:600;color:var(--text-head);padding:8px 0 5px}
.cdlg-box .dg-body{padding:5px 10px;color:var(--text-body);text-align:center;min-height:22px;display:flex;align-items:center;justify-content:center}
.cdlg-box .dg-actions{display:flex;border-top:1px solid var(--border-subtle)}
.cdlg-box .dg-actions .dg-btn{flex:1;text-align:center;padding:5px 0;cursor:default}
.cdlg-bs{position:absolute;bottom:0;left:0;right:0;z-index:25;background:var(--surface);border-radius:10px 10px 0 0;border-top:1px solid var(--border-default);padding-bottom:6px}
.cdlg-bs .bs-handle{width:24px;height:3px;background:rgba(0,0,0,.1);border-radius:2px;margin:6px auto 8px}
.cdlg-bs .bs-row{padding:6px 16px;border-bottom:1px solid var(--border-subtle);text-align:center}
.cdlg-toast{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);z-index:25;padding:5px 14px;background:rgba(0,0,0,.75);color:#fff;border-radius:99px;white-space:nowrap}
/* ═══════════ 排版标注 ═══════════ */
.da-size-tag{position:absolute;pointer-events:none;z-index:30;font-weight:600;background:rgba(255,255,255,.9);border:1px solid var(--accent-bg-solid);border-radius:2px;white-space:nowrap}
.da-gap-tag{position:absolute;pointer-events:none;z-index:30;font-weight:600;background:rgba(255,255,255,.9);color:var(--info);border:1px solid rgba(74,139,200,.2);border-radius:2px;white-space:nowrap;display:flex;align-items:center}
.da-gap-tag .gap-line{height:1px;background:var(--info);flex-shrink:0}
.da-type-tag{display:inline-block;font-weight:600;background:var(--accent-bg);border-radius:2px;white-space:normal;vertical-align:middle}

/* 文字阶梯 */
.ts-d{font-size:20px;font-weight:700;color:var(--text-head)}
.ts-h1{font-size:17px;font-weight:700;color:var(--text-head)}
.ts-h2{font-size:14px;font-weight:600;color:var(--text-head)}
.ts-b{font-size:12px;color:var(--text-body);line-height:1.5}
.ts-l{font-size:11px;color:var(--text-body);font-weight:500}
.ts-c{font-size:10px;color:var(--text-muted)}
.ts-s{font-size:9px;color:var(--text-muted)}

/* 时序条 */
.tmr{display:flex;align-items:center;gap:6px;margin:2px 0}
.tmr .tl{font-size:9px;color:var(--text-body);width:75px;text-align:right;flex-shrink:0}
.tmr .tt{flex:1;height:5px;background:rgba(0,0,0,.04);border-radius:3px;position:relative}
.tmr .tf{height:100%;border-radius:3px;position:absolute;left:0;top:0}
.tmr .tv{font-size:8px;color:var(--text-muted);width:60px;flex-shrink:0}

/* 手势图标 */
.gest-row{display:flex;gap:14px;flex-wrap:wrap;margin:4px 0}
.gest-it{display:flex;flex-direction:column;align-items:center;gap:3px;width:56px;text-align:center}
.gest-it .gico{width:32px;height:32px;border-radius:50%;background:var(--surface);border:1.3px solid var(--border-default);display:flex;align-items:center;justify-content:center;font-size:14px}
.gest-it .gn{font-size:8px;color:var(--text-body);font-weight:500}
.gest-it .gc{font-size:6px;color:var(--text-muted)}

/* 检查清单 */
.chk{list-style:none;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}
.chk li{font-size:12px;padding:1px 0}
.chk li::before{content:'☐ ';color:var(--text-muted);margin-right:4px}
.chk.single{grid-template-columns:1fr}

/* Footer */
.spec-footer{margin-top:56px;padding-top:20px;border-top:2px solid var(--border-subtle);text-align:center;color:var(--text-muted);font-size:11px}

/* 页签导航 */
.page-tabs{display:flex;gap:0;border-bottom:2px solid var(--border-subtle);margin:32px 0 0;position:sticky;top:0;background:var(--page-bg);z-index:100;padding:0;overflow-x:auto;-webkit-overflow-scrolling:touch}
.page-tab{flex:1;text-align:center;padding:14px 8px;font-size:13px;color:var(--text-muted);border-bottom:3px solid transparent;margin-bottom:-2px;cursor:pointer;transition:all 0.2s;white-space:nowrap;user-select:none;min-width:fit-content}
.page-tab:hover{color:var(--text-head);background:var(--surface)}
.page-tab.on{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
.page-tab .tab-icon{display:block;font-size:18px;margin-bottom:2px}
/* 页签面板 */
.tab-panel{display:none}
.tab-panel.on{display:block}

@media print{body{background:#fff;max-width:100%}.phone{box-shadow:none;border-color:#ccc}.spec-row{flex-direction:row}}
</style>
</head>
<body>

${renderHeader(config, title)}
${renderTOC(sections)}

<nav class="page-tabs">
  <div class="page-tab on" data-tab="foundation"><span class="tab-icon">📐</span>基础信息</div>
  <div class="page-tab" data-tab="visual"><span class="tab-icon">🎨</span>视觉规范</div>
  <div class="page-tab" data-tab="layout"><span class="tab-icon">🧩</span>布局组件</div>
  <div class="page-tab" data-tab="feedback"><span class="tab-icon">💫</span>交互反馈</div>
  <div class="page-tab" data-tab="delivery"><span class="tab-icon">✅</span>交付标准</div>
</nav>

<div class="tab-panel on" id="tab-foundation">
${renderCanvasDemo(config, m)}
${renderThumbZoneDemo(config, m)}
${renderGestureDemo(config)}
${renderTouchSpec(config, m)}
${renderOrientationSpec(config)}
</div>

<div class="tab-panel" id="tab-visual">
${renderGridDemo(config, m)}
${renderColorPalette(config)}
${renderTypeScale()}
${renderSpacingScale(config, m)}
</div>

<div class="tab-panel" id="tab-layout">
${renderLayoutTemplates(config, m)}
${renderNavSystem(config)}
${renderDialogSystem(config)}
${renderComponentShowcase(config, m)}
${renderGameComponents(config, m)}
</div>

<div class="tab-panel" id="tab-feedback">
${renderStateFeedback()}
${renderAnimTiming()}
${renderSoundSpec(config)}
</div>

<div class="tab-panel" id="tab-delivery">
${renderChecklists(sections, config)}
${renderAppendix(config)}
</div>

<div class="spec-footer">
  <p>${esc(title)} v${esc(config.version)} · 生产线标准</p>
  <p style="margin-top:4px;">方法论：${esc(config.methodology)} · 标杆：${esc(config.benchmarks)}</p>
  <p style="margin-top:8px;font-size:10px;">此文档由 <code>projects/interaction-spec-system/tools/build-interaction-spec.ts</code> 自动生成 · 数据源：对应 .md 规范文件 · Design Token：<code>tokens/base.css</code></p>
  <p style="margin-top:4px;font-size:10px;">📦 完整组件代码库：<code>components/*.md</code>（规格+代码）→ 运行 <code>npx tsx tools/build-component-lib.ts</code> 生成组件展示页</p>
  <p style="margin-top:4px;font-size:10px;">📱 可交互原型生成器：<code>npx tsx tools/build-prototype.ts --demo</code></p>
</div>

<script>
(function(){
  const tabs=document.querySelectorAll('.page-tab');
  const panels=document.querySelectorAll('.tab-panel');
  function switchTab(id){
    tabs.forEach(t=>t.classList.toggle('on',t.dataset.tab===id));
    panels.forEach(p=>p.classList.toggle('on',p.id==='tab-'+id));
    if(window.location.hash!=='#'+id) history.replaceState(null,'','#'+id);
  }
  tabs.forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));
  var hash=window.location.hash.replace('#','');
  if(hash&&document.getElementById('tab-'+hash)) switchTab(hash);
})();
</script>

</body>
</html>`;
}

// ═══════════════════════════════════════════════
// CSS 生成
// ═══════════════════════════════════════════════

function generateCSS(config: SpecConfig, m: GridMetrics): string {
  const gu = m.gridUnit;

  // 从 tokens/base.css 加载基础 CSS
  const tokenOverrides: TokenOverrides = {
    color_primary: config.color_primary,
    color_success: config.color_success,
    color_warning: config.color_warning,
    color_danger: config.color_danger,
    color_info: config.color_info,
    rarity_colors: config.rarity_colors as Record<string, string>,
  };
  const baseTokens = getTokenCSS(tokenOverrides);

  return `
/* ═══════ 基础 Design Token (from tokens/base.css) ═══════ */
${baseTokens}

/* ═══════ 文档页专用变量 (spec 渲染器) ═══════ */
:root {
  --page-bg: #fafafc;
  --surface: #fff;
  --surface-hover: #f5f6f8;
  --border-default: #e4e6eb;
  --border-subtle: #eeeef2;
  --text-head: #1a1d28;
  --text-body: #3a3d48;
  --text-muted: #8b8f9a;
  --code-bg: #f4f5f7;
  --accent-bg-solid: ${hexToRGBA(config.color_primary, 0.22)};

  /* 手机框 */
  --phone-bg: #e8e8ec;
  --phone-border: #bbb;

  /* 网格覆盖色 */
  --grid-col-color: rgba(74,139,200,0.06);
  --grid-margin-color: rgba(200,150,74,0.04);
  --sa-top-color: rgba(200,60,60,0.16);
  --sa-bottom-color: rgba(200,160,40,0.16);

  /* 间距 (渲染器专用 — 缩放到展示尺寸) */
  --sp-xs: ${m.spacing.xs}px;
  --sp-sm: ${m.spacing.sm}px;
  --sp-md: ${m.spacing.md}px;
  --sp-lg: ${m.spacing.lg}px;
  --sp-xl: ${m.spacing.xl}px;
  --sp-2xl: ${m.spacing.xxl}px;
  --sp-3xl: ${m.spacing.xxxl}px;

  /* 安全区 (缩放) */
  --sa-top-h: ${Math.round(config.safe_area_top * m.scale)}px;
  --sa-bottom-h: ${Math.round(config.safe_area_bottom * m.scale)}px;

  /* 网格单位 */
  --gu: ${gu}px;

  /* 手机框尺寸 */
  --phone-w: ${m.phoneW}px;
  --phone-h: ${m.phoneH}px;
}
`;
}

// ═══════════════════════════════════════════════
// 分区渲染函数
// ═══════════════════════════════════════════════

function renderHeader(config: SpecConfig, title: string): string {
  const icon = config.platform === "vertical-mobile" ? "📱" :
    config.platform === "horizontal-mobile" ? "📱" :
    config.platform === "pc" ? "🖥" : "🎮";
  return `
<div class="spec-header">
  <div class="tags"><span>${icon} ${config.canvas_width}×${config.canvas_height}</span><span>📐 ${tag(config.platform)}</span><span>🏭 生产线标准</span><span>v${esc(config.version)}</span></div>
  <h1>${esc(title)}</h1>
  <p class="sub">Game Interaction Specification · ${tag(config.platform)}</p>
</div>`;
}

function renderPrinciples(config: SpecConfig): string {
  if (!config.principles.length) return "";
  const cards = config.principles.map(p =>
    `<div class="pr-card"><div class="pc">${esc(p.char)}</div><div class="pt">${esc(p.title)}</div><div class="pd">${esc(p.desc)}</div></div>`
  ).join("");
  return `<div class="pr-row">${cards}</div>`;
}

function renderTOC(sections: SpecSection[]): string {
  const items = sections
    .filter(s => s.level === 2)
    .map((s, i) => {
      const num = String(i + 1).padStart(2, "0");
      return `<li><a href="#${s.anchor}">${num}. ${esc(s.title)}</a></li>`;
    }).join("");
  return `<div class="toc"><h3>目录</h3><ol>${items}</ol></div>`;
}

// ═══════════ 画布与安全区 ═══════════

function renderCanvasDemo(config: SpecConfig, m: GridMetrics): string {
  const saTop = Math.round(config.safe_area_top * m.scale);
  const saBottom = Math.round(config.safe_area_bottom * m.scale);
  const contentTop = saTop;
  const contentBottom = m.phoneH - saBottom;
  const contentH = contentBottom - contentTop;

  return `
<h2 id="画布与安全区"><span class="num">01</span> 画布与安全区</h2>
<div class="spec-row">
  <div class="spec-visual">
    <div class="proto-col">
      <div class="phone">
        <div class="notch"></div>
        <div class="mini-capsule" style="top:${Math.round(saTop*0.5)}px;right:${Math.round(config.canvas_width*0.019*m.scale)}px;width:${Math.round(config.canvas_width*0.232*m.scale)}px;height:${Math.round(config.canvas_width*0.085*m.scale)}px;" title="微信小程序胶囊 · 约占屏宽23%"></div>
        <div class="sa-top" style="height:${saTop}px;">状态栏 ≥${config.safe_area_top}px</div>
        <div class="sa-content" style="top:${contentTop}px;bottom:${m.phoneH - contentBottom}px;">内容安全区 · 核心 UI 元素在此区域内</div>
        <div class="sa-bottom" style="bottom:0;height:${saBottom}px;">Home Indicator ≥${config.safe_area_bottom}px</div>
        <!-- 网格覆盖 -->
        ${renderGridOverlay(config, m)}
      </div>
      <span class="proto-label">▲ 安全区 + ${config.grid_columns}列网格 · ${config.grid_base}px 基础单位</span>
    </div>
  </div>
  <div class="spec-text">
    <h3>基准分辨率</h3>
    <table class="tbl"><tr><th>版本</th><th>分辨率</th><th>宽高比</th><th>用途</th></tr>
    <tr><td>基准版</td><td>${config.canvas_width}×${config.canvas_height}</td><td>${(config.canvas_width/config.canvas_height).toFixed(2)}:1</td><td>主设计稿</td></tr>
    <tr><td>适配版</td><td>${config.canvas_width}×${Math.round(config.canvas_height*1.22)}</td><td>全面屏</td><td>中心锚点拓展</td></tr></table>
    <h3 style="margin-top:10px;">平台安全区</h3>
    <table class="tbl"><tr><th>平台</th><th>顶部</th><th>底部</th><th>左右</th></tr>
    <tr><td>iOS 刘海/灵动岛</td><td>≥44px</td><td>≥34px</td><td>≥16px</td></tr>
    <tr><td>Android 全面屏</td><td>≥24px</td><td>导航栏</td><td>≥16px</td></tr>
    <tr><td>微信小程序</td><td>≥88px (避让右上胶囊)</td><td>≥34px</td><td>≥16px</td></tr></table>
    <p style="margin-top:6px;font-size:11px;color:var(--text-muted);">💊 微信小程序右上角胶囊约占屏宽 23%（720 画布约 167×61px），距右约 2%，导航栏内容需在胶囊左侧留 ≥10px 安全距离。</p>
  </div>
</div>`;
}

// ═══════════ 拇指热区 ═══════════

function renderThumbZoneDemo(config: SpecConfig, m: GridMetrics): string {
  const t44 = Math.round(config.canvas_width * 44 / 375);
  const { thumbZones } = m;
  return `
<h2 id="拇指热区"><span class="num">02</span> 拇指热区与操作布局</h2>
<div class="spec-row">
  <div class="spec-visual">
    <div class="proto-col">
      <div class="phone">
        <div class="notch"></div>
        <div class="tz-z1" style="top:${thumbZones.y0}px;height:${thumbZones.y1}px;">❌ 难以触及 y:0~500</div>
        <div class="tz-z2" style="top:${thumbZones.y1}px;height:${thumbZones.y2 - thumbZones.y1}px;">⚡ 伸展区 y:500~800</div>
        <div class="tz-z3" style="top:${thumbZones.y2}px;height:${thumbZones.y3 - thumbZones.y2}px;">✅ 自然热区 y:800~1100</div>
        <div class="tz-z4" style="top:${thumbZones.y3}px;bottom:0;">🔥 极易触达 y:1100~${config.canvas_height}</div>
        <!-- Y轴标尺 -->
        <div style="position:absolute;right:4px;top:0;bottom:0;width:20px;z-index:15;display:flex;flex-direction:column;justify-content:space-between;font-size:6px;color:var(--text-muted);pointer-events:none;padding:4px 0;">
          <span>0</span><span>${config.canvas_height}</span>
        </div>
      </div>
      <span class="proto-label">▲ 四区热力分布 (右手持机)</span>
    </div>
  </div>
  <div class="spec-text">
    <h3>分区策略</h3>
    <table class="tbl"><tr><th>区域</th><th>Y范围</th><th>放置内容</th></tr>
    <tr><td>顶部信息栏</td><td>0~120</td><td>HUD数值/标题/返回</td></tr>
    <tr><td>中部展示区</td><td>120~800</td><td>角色/场景/列表</td></tr>
    <tr><td>下部操作区</td><td>800~1100</td><td>高频按钮/Tab切换</td></tr>
    <tr><td>底部固定区</td><td>1100~${config.canvas_height}</td><td>主CTA/底部导航</td></tr></table>
    <h3 style="margin-top:10px;">按钮位置铁律</h3>
    <ul>
      <li><strong>主CTA：</strong>y&gt;1100，宽≥280px，高≥52px</li>
      <li><strong>次要操作：</strong>y:900~1100</li>
      <li><strong>返回/关闭：</strong>左上/右上，热区≥${t44}×${t44}px</li>
      <li><strong>危险操作：</strong>非热区+二次确认</li>
    </ul>
  </div>
</div>`;
}

// ═══════════ 手势 ═══════════

function renderGestureDemo(config: SpecConfig): string {
  const gestures = [
    { ico: "👆", n: "单击 Tap", c: "<200ms" },
    { ico: "✊", n: "长按 Press", c: "≥500ms" },
    { ico: "↕", n: "上下滑动", c: "≥10px" },
    { ico: "↔", n: "左右滑动", c: "≥10px" },
    { ico: "🤏", n: "双指缩放", c: "Pinch" },
    { ico: "✋", n: "拖拽 Drag", c: "长按+移动" },
  ];
  return `
<h2 id="手势系统"><span class="num">03</span> 手势系统</h2>
<div class="spec-row">
  <div class="spec-visual">
    <div class="gest-row">${gestures.map(g =>
      `<div class="gest-it"><div class="gico">${g.ico}</div><div class="gn">${g.n}</div><div class="gc">${g.c}</div></div>`
    ).join("")}</div>
  </div>
  <div class="spec-text">
    <table class="tbl"><tr><th>手势</th><th>触发</th><th>标准用途</th></tr>
    <tr><td><strong>单击</strong></td><td>&lt;200ms</td><td>确认/选择/触发</td></tr>
    <tr><td><strong>长按</strong></td><td>≥500ms</td><td>详情Tooltip/快捷菜单</td></tr>
    <tr><td><strong>上下滑动</strong></td><td>≥10px</td><td>列表滚动/页面浏览</td></tr>
    <tr><td><strong>左右滑动</strong></td><td>≥10px</td><td>Tab切换/卡片翻页</td></tr>
    <tr><td><strong>双指缩放</strong></td><td>双指</td><td>地图/图片查看</td></tr>
    <tr><td><strong>拖拽</strong></td><td>长按+移动</td><td>物品拖放/排序</td></tr></table>
    <p><strong>冲突规则：</strong>弹窗层 &gt; 滚动层 &gt; 可点击元素 &gt; 背景层。面板打开时下层穿透禁用。</p>
  </div>
</div>`;
}

// ═══════════ 触控规格 ═══════════

function renderTouchSpec(config: SpecConfig, m: GridMetrics): string {
  const minTouch = Math.round(m.phoneW * 44 / 375);     // 44pt 1x → 画布比例
  const iconBtn = Math.round(m.phoneW * 48 / 375);      // 48pt 1x
  const canvas44 = Math.round(config.canvas_width * 44 / 375);
  const canvas48 = Math.round(config.canvas_width * 48 / 375);
  return `
<h2 id="触控规格"><span class="num">04</span> 触控规格</h2>
<div class="spec-row">
  <div class="spec-visual">
    <div style="display:flex;align-items:center;gap:20px;">
      <div style="background:var(--surface);border:2px dashed var(--danger);border-radius:50%;width:${minTouch}px;height:${minTouch}px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--danger);font-weight:600;">${canvas44}×${canvas44}</div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:center;">
        <div style="background:var(--surface);border:2px solid var(--border-default);border-radius:6px;width:${iconBtn}px;height:${iconBtn}px;display:flex;align-items:center;justify-content:center;font-size:16px;">⚙</div>
        <span class="proto-label">${canvas48}×${canvas48} 图标按钮</span>
      </div>
    </div>
  </div>
  <div class="spec-text">
    <table class="tbl"><tr><th>元素</th><th>最小</th><th>建议</th></tr>
    <tr><td>按钮</td><td>${canvas44}×${canvas44}</td><td>52~56高，200~300宽</td></tr>
    <tr><td>图标按钮</td><td>${canvas44}×${canvas44}</td><td>${canvas48}×${canvas48}</td></tr>
    <tr><td>列表项</td><td>44高</td><td>56~72高</td></tr>
    <tr><td>卡片</td><td>${canvas44}×${canvas44}</td><td>≥120×160</td></tr></table>
    <blockquote>触控容差：命中区域=视觉边界<strong>+4px</strong> | 相邻间距≥8px</blockquote>
    <p><strong>防误触：</strong>弹窗遮罩阻断下层 | 按钮300ms冷却 | 滑动中禁用点击 | 加载中全屏遮罩</p>
  </div>
</div>`;
}

// ═══════════ 网格系统 ═══════════

function renderGridDemo(config: SpecConfig, m: GridMetrics): string {
  const colW = Math.round(m.colW * m.scale);
  const gutterW = Math.round(m.gutterW * m.scale);
  const marginW = Math.round(m.marginW * m.scale);
  const spacingLevels = [
    { label: "xs 4px", w: m.spacing.xs, desc: "图标间距" },
    { label: "sm 8px", w: m.spacing.sm, desc: "元素间距" },
    { label: "md 16px", w: m.spacing.md, desc: "标准间距" },
    { label: "lg 24px", w: m.spacing.lg, desc: "区块内边距" },
    { label: "xl 32px", w: m.spacing.xl, desc: "大区间距" },
  ];

  return `
<h2 id="网格系统"><span class="num">05</span> 网格系统</h2>
<div class="spec-row">
  <div class="spec-visual" style="flex-direction:column;align-items:center;">
    <div class="proto-col">
      <div class="phone">
        ${renderGridOverlay(config, m)}
        <div style="position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <div style="background:rgba(200,150,74,0.15);border:1px solid rgba(200,150,74,0.3);border-radius:2px;width:${Math.round(m.colW*m.scale*2+m.gutterW*m.scale)}px;height:60%;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--accent);font-weight:600;">2列宽<br>= ${Math.round(config.grid_base*2)}gu</div>
        </div>
      </div>
      <span class="proto-label">▲ ${config.grid_columns}列栅格 · ${config.grid_base}px 基础单位 · 沟槽${config.grid_gutter}px · 边距${config.grid_margin}px</span>
    </div>
    <!-- 间距阶梯 -->
    <div class="sp-demo" style="margin-top:12px;width:100%;max-width:300px;">
      ${spacingLevels.map(s => `
      <div class="sr"><span class="sl">${s.label}</span><div class="sb" style="width:${s.w}px;"></div><span class="sv">${s.desc}</span></div>
      `).join("")}
    </div>
  </div>
  <div class="spec-text">
    <h3>${config.grid_base}px 基础网格</h3>
    <p>所有尺寸、间距必须为<strong>${config.grid_base}的倍数</strong>。</p>
    <h3 style="margin-top:8px;">${config.grid_columns}列栅格</h3>
    <table class="tbl"><tr><th>参数</th><th>值</th></tr>
    <tr><td>画布宽</td><td>${config.canvas_width}px</td></tr>
    <tr><td>左右边距</td><td>${config.grid_margin}px×2</td></tr>
    <tr><td>列数/沟槽</td><td>${config.grid_columns}列 / ${config.grid_gutter}px×${config.grid_columns - 1}</td></tr>
    <tr><td>单列宽</td><td>${Math.round(m.colW)}px</td></tr>
    <tr><td>网格单位</td><td>${config.grid_base}px = 1gu</td></tr></table>
    <p style="margin-top:8px;"><strong>铁律：</strong>尺寸为${config.grid_base}的倍数 | 左右边距${config.grid_margin}px | 优先${config.grid_columns}列栅格 | 中心锚点适配</p>
  </div>
</div>`;
}

// ═══════════ 网格覆盖层 (共用) ═══════════

function renderGridOverlay(config: SpecConfig, m: GridMetrics): string {
  const marginW = Math.round(m.marginW * m.scale);
  const colW = Math.round(m.colW * m.scale);
  const gutterW = Math.round(m.gutterW * m.scale);

  let html = `<div class="grid-overlay">`;
  // 左边距
  html += `<div class="grid-margin" style="left:0;width:${marginW}px;"></div>`;
  // 右边距
  html += `<div class="grid-margin" style="right:0;width:${marginW}px;"></div>`;
  // 列 + 沟槽
  for (let i = 0; i < config.grid_columns; i++) {
    const left = marginW + i * (colW + gutterW);
    html += `<div class="grid-col" style="left:${left}px;width:${colW}px;"></div>`;
  }
  html += `</div>`;
  return html;
}

// ═══════════ 色彩 ═══════════

function renderColorPalette(config: SpecConfig): string {
  const funcColors = [
    { name: "主色 Primary", hex: config.color_primary },
    { name: "成功 Success", hex: config.color_success },
    { name: "警告 Warning", hex: config.color_warning },
    { name: "危险 Danger", hex: config.color_danger },
    { name: "信息 Info", hex: config.color_info },
  ];
  const rarityColors = Object.entries(config.rarity_colors).map(([k, v]) => ({ name: k, hex: v }));

  return `
<h2 id="色彩系统"><span class="num">06</span> 色彩系统</h2>
<div class="spec-row">
  <div class="spec-visual" style="flex-direction:column;align-items:flex-start;">
    <h3 style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">功能色</h3>
    <div class="color-palette">
      ${funcColors.map(c => `
      <div class="color-chip">
        <div class="preview" style="background:${c.hex};"></div>
        <div class="info"><div class="hex">${c.hex}</div><div class="label">${c.name}</div></div>
      </div>`).join("")}
    </div>
    ${rarityColors.length > 0 ? `
    <h3 style="font-size:12px;color:var(--text-muted);margin:16px 0 8px;">品质色 (RPG)</h3>
    <div class="color-palette">
      ${rarityColors.map(c => `
      <div class="color-chip">
        <div class="preview" style="background:${c.hex};"></div>
        <div class="info"><div class="hex">${c.hex}</div><div class="label">${c.name}</div></div>
      </div>`).join("")}
    </div>` : ""}
  </div>
  <div class="spec-text">
    <p><strong>功能色：</strong>品牌色(项目定制) | 成功 ${config.color_success} | 警告 ${config.color_warning} | 危险 ${config.color_danger} | 信息 ${config.color_info}</p>
    <p><strong>品质色：</strong>区分=颜色+文字+边框，保障色觉障碍用户可辨识。</p>
    <p><strong>对比度：</strong>正文&lt;18px ≥4.5:1 | 大文字≥18px ≥3:1 (WCAG AA)</p>
  </div>
</div>`;
}

// ═══════════ 字体 ═══════════

function renderTypeScale(): string {
  return `
<h2 id="字体与排版"><span class="num">07</span> 字体与排版</h2>
<div class="spec-row">
  <div class="spec-visual" style="flex-direction:column;gap:4px;display:flex;">
    <span class="ts-d">Display 28~32 Bold</span>
    <span class="ts-h1">H1 22~26 Bold</span>
    <span class="ts-h2">H2 18~20 SemiBold</span>
    <span class="ts-b">Body 13~14 Regular 行高1.5~1.6</span>
    <span class="ts-l">Label 12 Medium</span>
    <span class="ts-c">Caption 11 Regular</span>
    <span class="ts-s">Small 10 Regular</span>
  </div>
  <div class="spec-text">
    <p>中文优先 Noto Sans SC / 阿里巴巴普惠体，数字使用等宽字体(tabular-nums)。最小字号≥10px，正文行宽≤屏幕80%(~600px)。中英文混排加1/4空格。</p>
  </div>
</div>`;
}

// ═══════════ 间距 ═══════════

function renderSpacingScale(config: SpecConfig, m: GridMetrics): string {
  const levels = [
    { label: "xs 4px", w: m.spacing.xs, gu: "0.5gu", desc: "极小间距" },
    { label: "sm 8px", w: m.spacing.sm, gu: "1gu", desc: "组件内紧凑间距" },
    { label: "md 16px", w: m.spacing.md, gu: "2gu", desc: "标准组件间距" },
    { label: "lg 24px", w: m.spacing.lg, gu: "3gu", desc: "区块间距" },
    { label: "xl 32px", w: m.spacing.xl, gu: "4gu", desc: "大区块间距" },
    { label: "2xl 48px", w: m.spacing.xxl, gu: "6gu", desc: "页面级留白" },
    { label: "3xl 64px", w: m.spacing.xxxl, gu: "8gu", desc: "页眉/页脚留白" },
  ];
  return `
<h2 id="间距系统"><span class="num">08</span> 间距系统</h2>
<div class="spec-row">
  <div class="spec-visual">
    <div class="sp-demo" style="width:100%;max-width:350px;">
      ${levels.map(s => `
      <div class="sr"><span class="sl">${s.label}</span><div class="sb" style="width:${Math.max(s.w, 4)}px;"></div><span class="sv">${s.gu} — ${s.desc}</span></div>
      `).join("")}
    </div>
  </div>
  <div class="spec-text">
    <p>基于 <strong>${config.grid_base}px 基础网格</strong>，所有间距为网格单位的整数倍。</p>
    <p>铁律：所有尺寸、间距、圆角必须以 ${config.grid_base}px 为最小单位对齐。</p>
  </div>
</div>`;
}

// ═══════════ 导航 ═══════════

function renderNavSystem(config: SpecConfig): string {
  const t44 = Math.round(config.canvas_width * 44 / 375);
  return `
<h2 id="导航系统"><span class="num">09</span> 导航系统</h2>
<div class="spec-row">
  <div class="spec-visual"><pre>层级深度 ≤ 4 层：
首页(L0)→一级(L1)→二级(L2)→详情(L3)
L3以上不新开页面，用弹窗/BottomSheet
每层必须有返回路径。</pre></div>
  <div class="spec-text">
    <table class="tbl"><tr><th>模式</th><th>场景</th><th>位置</th><th>规格</th></tr>
    <tr><td><strong>底部Tab</strong></td><td>3~5顶级入口</td><td>屏幕底部</td><td>H:80~100, 图标24~28px</td></tr>
    <tr><td><strong>顶部Tab</strong></td><td>二级筛选</td><td>导航栏下</td><td>H:44, 支持左右滑</td></tr>
    <tr><td><strong>返回按钮</strong></td><td>层级返回</td><td>左上角‹</td><td>热区≥${t44}×${t44}px</td></tr>
    <tr><td><strong>浮动按钮</strong></td><td>全局主操作</td><td>右下悬浮</td><td>距边16~24px</td></tr></table>
  </div>
</div>`;
}

// ═══════════ 弹窗 ═══════════

function renderDialogSystem(config: SpecConfig): string {
  return `
<h2 id="弹窗体系"><span class="num">10</span> 弹窗体系</h2>
<div class="spec-row">
  <div class="spec-visual"><pre>弹出规则：
• 不嵌套弹窗（多步骤=分步表单）
• 遮罩45~60%黑
• BottomSheet下拉30%关闭
• 居中弹窗 scale 0.9→1.0 + fade 0.2~0.3s
• Android返回键关弹窗（非退出页面）</pre></div>
  <div class="spec-text">
    <table class="tbl"><tr><th>类型</th><th>尺寸</th><th>用途</th></tr>
    <tr><td><strong>对话框Alert</strong></td><td>W560~600 H:auto</td><td>确认/二选一</td></tr>
    <tr><td><strong>BottomSheet</strong></td><td>W${config.canvas_width} H≤600</td><td>选项/分享</td></tr>
    <tr><td><strong>居中面板Modal</strong></td><td>W600~680 H≤800</td><td>表单/多操作</td></tr>
    <tr><td><strong>全屏弹窗</strong></td><td>${config.canvas_width}×${config.canvas_height}</td><td>编辑器</td></tr>
    <tr><td><strong>Toast</strong></td><td>auto×40~48</td><td>轻量提示</td></tr>
    <tr><td><strong>Tooltip</strong></td><td>W≤300 auto</td><td>名词解释</td></tr></table>
  </div>
</div>`;
}

// ═══════════ 组件展示 ═══════════

function renderComponentShowcase(config: SpecConfig, m: GridMetrics): string {
  const c44 = Math.round(config.canvas_width * 44 / 375);
  const c48 = Math.round(config.canvas_width * 48 / 375);
  return `
<h2 id="基础组件规范"><span class="num">11</span> 基础组件规范</h2>

<!-- 11.1 按钮 -->
<h3 id="按钮">11.1 按钮 (Button)</h3>
<div class="spec-row">
  <div class="spec-visual">
    <div class="comp-cell"><span class="cbtn cbtn-pri">主 按 钮</span><span class="clbl">Primary</span></div>
    <div class="comp-cell"><span class="cbtn cbtn-pri dis">主 按 钮</span><span class="clbl">Disabled</span></div>
    <div class="comp-cell"><span class="cbtn cbtn-sec">次按钮</span><span class="clbl">Secondary</span></div>
    <div class="comp-cell"><span class="cbtn cbtn-sm">小按钮</span><span class="clbl">Small</span></div>
    <div class="comp-cell"><span class="cbtn cbtn-ic">⚙</span><span class="clbl">Icon</span></div>
    <div class="comp-cell"><span class="cbtn-dg">危险</span><span class="clbl">Danger</span></div>
  </div>
  <div class="spec-text">
    <table class="tbl"><tr><th>类型</th><th>推荐</th><th>最小</th><th>颜色</th></tr>
    <tr><td>主按钮</td><td>280×52</td><td>200×44</td><td>品牌色+白字</td></tr>
    <tr><td>次按钮</td><td>200×44</td><td>160×40</td><td>白底+边框</td></tr>
    <tr><td>小按钮</td><td>120×36</td><td>88×36</td><td>灰底+深字</td></tr>
    <tr><td>图标按钮</td><td>${c48}×${c48}</td><td>${c44}×${c44}</td><td>透明+图标</td></tr>
    <tr><td>危险按钮</td><td>同次按钮</td><td>—</td><td>浅红底+红字</td></tr></table>
    <p class="note">所有按钮覆盖4态：默认/按下/禁用/加载</p>
  </div>
</div>

<!-- 11.2 卡片 -->
<h3 id="卡片">11.2 卡片 (Card)</h3>
<div class="spec-row">
  <div class="spec-visual">
    ${renderRarityCards(config)}
    <div class="comp-cell"><div class="cc sel"><div class="ccb">普通</div><div class="cci"></div><div class="ccn">选中</div><div class="ccd">金边+glow</div></div><span class="clbl">选中</span></div>
    <div class="comp-cell"><div class="cc lock"><div class="ccb">🔒</div><div class="cci"></div><div class="ccn">锁定</div><div class="ccd">未解锁</div></div><span class="clbl">锁定</span></div>
  </div>
  <div class="spec-text">
    <table class="tbl"><tr><th>属性</th><th>值</th></tr>
    <tr><td>宽度</td><td>200~240px (竖版单卡)</td></tr>
    <tr><td>边框</td><td>2px实线，按品质着色</td></tr>
    <tr><td>选中态</td><td>金色边框+glow</td></tr>
    <tr><td>锁定态</td><td>虚线+40%透明度</td></tr></table>
  </div>
</div>

<!-- 11.3 进度条 -->
<h3 id="进度条">11.3 进度条 (Progress Bar)</h3>
<div class="spec-row">
  <div class="spec-visual"><div style="display:flex;flex-direction:column;gap:5px;width:100%;max-width:260px;">
    <div class="bar-r"><span class="blbl">HP</span><div class="btrack"><div class="bfill" style="width:85%;background:var(--success);"></div></div><span style="font-size:9px;color:var(--success);">85%</span></div>
    <div class="bar-r"><span class="blbl">HP</span><div class="btrack"><div class="bfill" style="width:45%;background:var(--warning);"></div></div><span style="font-size:9px;color:var(--warning);">45%</span></div>
    <div class="bar-r"><span class="blbl">HP</span><div class="btrack"><div class="bfill" style="width:18%;background:var(--danger);"></div></div><span style="font-size:9px;color:var(--danger);">18%</span></div>
    <div class="bar-r"><span class="blbl">EXP</span><div class="btrack"><div class="bfill" style="width:60%;background:var(--info);"></div></div><span style="font-size:9px;color:var(--info);">60%</span></div>
  </div></div>
  <div class="spec-text">
    <table class="tbl"><tr><th>类型</th><th>高度</th><th>颜色</th></tr>
    <tr><td>HP血条</td><td>10~12px</td><td>绿→黄→红</td></tr>
    <tr><td>EXP经验</td><td>6~8px</td><td>${config.color_info}</td></tr>
    <tr><td>能量/大招</td><td>8~10px</td><td>渐变绿→金</td></tr></table>
  </div>
</div>

<!-- 11.4 槽位 -->
<h3 id="槽位">11.4 槽位 (Slot)</h3>
<div class="spec-row">
  <div class="spec-visual"><div class="comp-row ctr">
    ${renderSlotDemos(config)}
    <div class="comp-cell"><div class="csl emp"></div><span class="clbl">空</span></div>
    <div class="comp-cell"><div class="csl lkd">🔒</div><span class="clbl">锁定</span></div>
  </div></div>
  <div class="spec-text">
    <table class="tbl"><tr><th>规格</th><th>尺寸</th><th>特征</th></tr>
    <tr><td>标准槽</td><td>72×72</td><td>2px品质边框+品质圆点</td></tr>
    <tr><td>小槽</td><td>48×48</td><td>挂件/快捷栏</td></tr>
    <tr><td>空槽位</td><td>—</td><td>虚线+50%透明度</td></tr>
    <tr><td>锁定</td><td>—</td><td>灰边+40%透明度+🔒</td></tr></table>
  </div>
</div>

<!-- 11.5 Tab + 11.6 Badge + 11.7 Toggle + 11.8 Input -->
<h3 id="tab-badge-toggle-input">11.5~11.8 其他控件</h3>
<div class="spec-row">
  <div class="spec-visual" style="flex-direction:column;gap:12px;display:flex;align-items:center;">
    <div class="ctabs"><div class="ctab on">全部</div><div class="ctab">武器</div><div class="ctab">防具</div><div class="ctab">道具</div></div>
    <div class="comp-row ctr">${renderBadgeDemos(config)}</div>
    <div class="comp-row ctr"><div class="comp-cell"><div class="ctg on"></div></div><div class="comp-cell"><div class="ctg"></div></div><div class="comp-cell"><div class="cinp">输入框</div></div></div>
  </div>
  <div class="spec-text">
    <h3>Tab / 页签</h3><p>顶部Tab: H44 + 底部2px指示线 | 底部Tab: H80~100 + 图标24~28px</p>
    <h3>Badge / 标签</h3><p>品质标签(2×10px padding, 9~10px字号) | 状态标签 | 红点通知(8×8px)</p>
    <h3>Toggle / 开关</h3><p>${Math.round(m.phoneW*51/375)}×${Math.round(m.phoneW*31/375)}px | 关闭=灰底白滑块 | 开启=绿色底</p>
    <h3>Input / 输入框</h3><p>H28~36 | 默认白底+1px边框 | 聚焦品牌色边框</p>
  </div>
</div>`;
}

// ═══════════ 布局模板 ═══════════

function renderLayoutTemplates(config: SpecConfig, m: GridMetrics): string {
  // phoneW/320 ≈ 1.31x 缩放，确保文字在 420px 手机框内可读
  const fs = (v: number) => Math.round(v * m.phoneW / 320);
  const sp = (v: number) => Math.round(v * m.phoneW / 375);
  const templates = [
    {
      id: "A", name: "大厅/主界面",
      html: `<div style="position:absolute;top:0;left:0;right:0;height:${Math.round(m.phoneH*0.13)}px;z-index:15;background:#fff;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;padding:${Math.round(5*m.scale)}px ${Math.round(8*m.scale)}px;">
        <span style="font-size:${fs(7)}px;color:var(--text-muted);">⚜️ 资源栏</span>
        <div style="display:flex;gap:${sp(4)}px;"><span style="width:${sp(6)}px;height:${sp(6)}px;border-radius:50%;background:var(--accent);"></span><span style="width:${sp(6)}px;height:${sp(6)}px;border-radius:50%;background:var(--success);"></span></div></div>
        <div style="position:absolute;top:${Math.round(m.phoneH*0.13)}px;left:0;right:0;height:${Math.round(m.phoneH*0.38)}px;background:var(--surface-hover);display:flex;align-items:center;justify-content:center;z-index:11;font-size:${fs(9)}px;color:var(--text-muted);">主视觉展示区</div>
        <div style="position:absolute;top:${Math.round(m.phoneH*0.51)}px;left:0;right:0;height:${Math.round(m.phoneH*0.30)}px;z-index:12;display:flex;flex-wrap:wrap;padding:${Math.round(5*m.scale)}px ${Math.round(12*m.scale)}px;gap:${Math.round(4*m.scale)}px;align-content:center;justify-content:center;">
          ${Array.from({length:8}, () => `<div style="width:${Math.round(m.phoneW*22/375)}px;height:${Math.round(m.phoneW*22/375)}px;background:rgba(0,0,0,.04);border-radius:${sp(4)}px;border:1px solid var(--border-subtle);"></div>`).join("")}</div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(m.phoneH*0.11)}px;z-index:15;background:#fff;display:flex;align-items:center;justify-content:space-around;padding-bottom:${Math.round(7*m.scale)}px;border-top:1px solid var(--border-subtle);font-size:${fs(7)}px;color:var(--text-muted);">
          <span style="display:flex;flex-direction:column;align-items:center;color:var(--accent);">● 首页</span><span>○ 英雄</span><span>○ 背包</span><span>○ 设置</span></div>`,
    },
    {
      id: "B", name: "战斗界面",
      html: `<div style="position:absolute;top:0;left:0;right:0;height:${Math.round(m.phoneH*0.09)}px;z-index:15;background:#f5f5f8;display:flex;align-items:center;justify-content:space-between;padding:${Math.round(3*m.scale)}px ${Math.round(7*m.scale)}px;font-size:${fs(7)}px;color:var(--text-body);"><span>W3/15</span><span>敌×5</span><span>⏱ 02:15</span></div>
        <div style="position:absolute;top:${Math.round(m.phoneH*0.09)}px;left:0;right:0;bottom:${Math.round(m.phoneH*0.16)}px;background:var(--surface-hover);display:flex;align-items:center;justify-content:center;z-index:11;font-size:${fs(9)}px;color:var(--text-muted);">战 场 区 域</div>
        <div style="position:absolute;bottom:${Math.round(m.phoneH*0.05)}px;left:0;right:0;height:${Math.round(m.phoneH*0.11)}px;z-index:15;display:flex;align-items:center;justify-content:center;gap:${Math.round(6*m.scale)}px;">
          ${Array.from({length:3}, () => `<div style="width:${Math.round(m.phoneW*22/375)}px;height:${Math.round(m.phoneW*22/375)}px;background:rgba(0,0,0,.04);border-radius:${sp(6)}px;border:1px solid var(--border-subtle);"></div>`).join("")}</div>`,
    },
    {
      id: "C", name: "列表/背包",
      html: `<div style="position:absolute;top:0;left:0;right:0;height:${Math.round(m.phoneH*0.11)}px;z-index:15;background:#fff;display:flex;align-items:flex-end;padding:${Math.round(3*m.scale)}px ${Math.round(7*m.scale)}px;font-size:${fs(8)}px;color:var(--text-head);font-weight:600;"><span style="font-size:${fs(10)}px;color:var(--text-muted);margin-right:${sp(6)}px;">‹</span>背 包</div>
        <div style="position:absolute;top:${Math.round(m.phoneH*0.11)}px;left:0;right:0;height:${Math.round(m.phoneH*0.06)}px;z-index:14;display:flex;align-items:center;font-size:${fs(7)}px;color:var(--text-muted);background:#f0f0f4;">
          <span style="flex:1;text-align:center;color:var(--accent);border-bottom:2px solid var(--accent);padding:${sp(2)}px 0;">全部</span><span style="flex:1;text-align:center;">武器</span><span style="flex:1;text-align:center;">防具</span><span style="flex:1;text-align:center;">道具</span></div>
        <div style="position:absolute;top:${Math.round(m.phoneH*0.17)}px;left:0;right:0;bottom:${Math.round(m.phoneH*0.11)}px;z-index:11;display:flex;flex-direction:column;gap:${Math.round(2*m.scale)}px;padding:${Math.round(4*m.scale)}px;"><span style="font-size:${fs(8)}px;color:var(--text-muted);text-align:center;margin-top:${sp(20)}px;">列表内容区 (可滚动)</span></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(m.phoneH*0.11)}px;z-index:15;background:#fff;display:flex;align-items:center;justify-content:space-around;font-size:${fs(7)}px;color:var(--text-body);"><span>排序</span><span>筛选</span><span>分解</span></div>`,
    },
    {
      id: "D", name: "弹窗/对话框",
      html: `<div style="position:absolute;inset:0;background:rgba(0,0,0,.35);z-index:20;display:flex;align-items:center;justify-content:center;">
        <div style="width:70%;background:#fff;border-radius:${sp(8)}px;border:1px solid var(--border-default);overflow:hidden;box-shadow:0 ${sp(2)}px ${sp(12)}px rgba(0,0,0,.1);">
          <div style="text-align:center;font-size:${fs(9)}px;font-weight:600;color:var(--text-head);padding:${sp(10)}px 0 ${sp(5)}px;">确认删除</div>
          <div style="padding:${sp(8)}px ${sp(12)}px;font-size:${fs(7)}px;color:var(--text-body);text-align:center;min-height:${sp(28)}px;display:flex;align-items:center;justify-content:center;">确定删除此项？此操作不可撤销。</div>
          <div style="display:flex;border-top:1px solid var(--border-subtle);"><div style="flex:1;text-align:center;padding:${sp(7)}px 0;font-size:${fs(8)}px;color:var(--text-muted);border-right:1px solid var(--border-subtle);">取消</div><div style="flex:1;text-align:center;padding:${sp(7)}px 0;font-size:${fs(8)}px;color:var(--accent);font-weight:600;">确认</div></div>
        </div></div>`,
    },
    {
      id: "E", name: "卡片选择",
      html: `<div style="position:absolute;inset:0;background:rgba(0,0,0,.35);z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(4*m.scale)}px;padding:${Math.round(14*m.scale)}px 0;">
        <div style="font-size:${fs(9)}px;font-weight:700;color:var(--accent);">选择一张卡牌</div>
        <div style="display:flex;flex-direction:column;gap:${Math.round(4*m.scale)}px;">
          ${Array.from({length:3}, (_, i) => `
          <div style="width:${Math.round(115*m.scale)}px;padding:${Math.round(7*m.scale)}px ${Math.round(9*m.scale)}px;background:#fff;border:1.3px solid var(--border-default);border-radius:${sp(6)}px;display:flex;flex-direction:column;align-items:center;gap:${Math.round(3*m.scale)}px;">
            <div style="font-size:${fs(6)}px;padding:0 ${sp(6)}px;border-radius:99px;background:rgba(0,0,0,.04);color:var(--text-muted);">品质</div>
            <div style="width:${sp(20)}px;height:${sp(20)}px;background:rgba(0,0,0,.03);border-radius:${sp(3)}px;"></div>
            <div style="font-size:${fs(8)}px;color:var(--text-head);">卡片 ${i+1}</div>
            <div style="font-size:${fs(6)}px;padding:${sp(1)}px ${sp(12)}px;border-radius:99px;background:rgba(0,0,0,.04);color:var(--text-muted);">选择此卡</div>
          </div>`).join("")}
        </div>
      </div>`,
    },
  ];

  return `
<h2 id="屏幕布局模板"><span class="num">12</span> 屏幕布局模板</h2>
<div class="spec-row">
  <div class="spec-visual" style="flex-wrap:wrap;gap:10px;display:flex;justify-content:center;">
    ${templates.map(t => `
    <div class="proto-col">
      <div class="phone">
        ${renderGridOverlay(config, m)}
        ${t.html}
      </div>
      <span class="proto-label">${t.id}：${t.name}</span>
    </div>`).join("")}
  </div>
  <div class="spec-text">
    <h3>五套标准竖版模板</h3>
    <p>所有模板均叠加 <strong>${config.grid_columns}列网格</strong> (${config.grid_base}px 基础单位)。组件位置、尺寸全部对齐网格。</p>
    <p><strong>A 大厅：</strong>场景化主界面，功能入口散布在场景中。<br>
    <strong>B 战斗：</strong>极简HUD + 技能栏，战斗时隐藏大部分UI。<br>
    <strong>C 列表：</strong>标准窗口界面，Tab筛选 + 可滚动列表 + 底部操作。<br>
    <strong>D 弹窗：</strong>居中对话框，遮罩阻断背景操作。<br>
    <strong>E 卡片选择：</strong>伪窗口，半透明遮罩不完全打断场景。</p>
  </div>
</div>`;
}

// ═══════════ 状态与反馈 ═══════════

function renderStateFeedback(): string {
  return `
<h2 id="状态与反馈"><span class="num">13</span> 状态与反馈</h2>
<div class="spec-row">
  <div class="spec-visual">
    <div class="tmb" style="width:100%;max-width:280px;">
      <div class="tmr"><span class="tl">按钮点击</span><div class="tt"><div class="tf" style="width:4%;background:var(--info);"></div></div><span class="tv">&lt;50ms</span></div>
      <div class="tmr"><span class="tl">Toast</span><div class="tt"><div class="tf" style="width:27%;background:var(--success);"></div></div><span class="tv">2~3s</span></div>
      <div class="tmr"><span class="tl">成功动画</span><div class="tt"><div class="tf" style="width:15%;background:var(--success);"></div></div><span class="tv">1~2s</span></div>
      <div class="tmr"><span class="tl">错误抖动</span><div class="tt"><div class="tf" style="width:4%;background:var(--danger);"></div></div><span class="tv">0.3~0.5s</span></div>
    </div>
  </div>
  <div class="spec-text">
    <p><strong>组件六态：</strong>默认 | 按下(darken+scale0.97) | 禁用(40~50%透明度) | 加载(旋转+) | 选中(高亮边框)</p>
    <p><strong>空状态：</strong>图标+"暂无数据"+操作引导（空状态是引导页，不是空白页）</p>
    <p><strong>加载：</strong>全屏(Logo+进度条) | 局部(骨架屏) | 按钮(内置转圈) | 后台(顶部微进度)</p>
  </div>
</div>`;
}

// ═══════════ 动效 ═══════════

function renderAnimTiming(): string {
  return `
<h2 id="动效规范"><span class="num">14</span> 动效规范</h2>
<div class="spec-row">
  <div class="spec-visual"><pre>转场方向：
Push   ← 右→左 进入子页面
Pop    → 左→右 返回父页面
Present ↑ 下→上 模态弹出
Dismiss ↓ 上→下 模态关闭</pre></div>
  <div class="spec-text">
    <table class="tbl"><tr><th>动画</th><th>时长</th><th>缓动</th></tr>
    <tr><td>Push</td><td>0.3s</td><td>ease-out</td></tr>
    <tr><td>Pop</td><td>0.25s</td><td>ease-in</td></tr>
    <tr><td>弹窗弹出</td><td>0.25s</td><td>ease-out+spring</td></tr>
    <tr><td>列表入场</td><td>0.3~0.4s</td><td>stagger 0.05s</td></tr>
    <tr><td>数值变化</td><td>0.4s</td><td>ease-out</td></tr></table>
    <p><strong>原则：</strong>①时长≤400ms ②反馈&lt;100ms ③统一缓动 ④可关闭动效 ⑤首屏不延迟</p>
  </div>
</div>`;
}

// ═══════════ 检查清单 ═══════════

function renderChecklists(sections: SpecSection[], config: SpecConfig): string {
  const t44 = Math.round(config.canvas_width * 44 / 375);
  const checklistSection = sections.find(s => s.title === "交付检查清单");
  const a11ySection = sections.find(s => s.title === "可访问性清单");

  const a11yItems = a11ySection?.lists.flatMap(l => l.items) || [];
  const checkItems = checklistSection?.lists.flatMap(l => l.items) || [];

  return `
<h2 id="可访问性清单"><span class="num">15</span> 可访问性清单</h2>
<div class="spec-row">
  <div class="spec-visual">
    <ul class="chk single">${a11yItems.length > 0 ? a11yItems.map(i => `<li>${esc(i.replace(/^\[.\] /, ""))}</li>`).join("") : "<li>最小触控热区 ≥${t44}×${t44}px</li><li>文字最小字号 ≥10px</li><li>正文对比度 ≥4.5:1</li><li>重要信息不只靠颜色区分</li><li>动效可关闭</li><li>音效独立开关</li><li>剧情字幕</li><li>操作可撤销</li>"}</ul>
  </div>
  <div class="spec-text">
    <p>支持系统字体缩放(≥120%)、色觉障碍辅助(品质=颜色+文字+边框)、合理Tab键导航顺序。</p>
  </div>
</div>

<h2 id="交付检查清单"><span class="num">16</span> 交付检查清单</h2>
<div class="spec-row">
  <div class="spec-visual">
    <ul class="chk single">${checkItems.length > 0 ? checkItems.map(i => `<li>${esc(i.replace(/^\[.\] /, ""))}</li>`).join("") : "<li>内容在安全区内</li><li>主CTA在底部 y&gt;1100</li><li>尺寸为网格基础单位整数倍</li><li>列栅格对齐</li><li>热区≥${t44}×${t44}px</li><li>按钮4态完整</li><li>卡片3态完整</li><li>品质=颜色+文字+边框</li><li>空/加载/错误态完整</li><li>转场≤300ms</li><li>对比度≥4.5:1</li>"}</ul>
  </div>
  <div class="spec-text">
    <h3>布局</h3><ul class="chk"><li>内容在安全区内</li><li>主CTA在底部</li></ul>
    <h3>网格</h3><ul class="chk"><li>尺寸为网格单位整数倍</li><li>列栅格对齐</li></ul>
    <h3>组件</h3><ul class="chk"><li>热区≥${t44}px</li><li>按钮4态</li><li>卡片3态</li></ul>
    <h3>状态</h3><ul class="chk"><li>空/加载/错误态</li><li>数据为空不崩溃</li></ul>
  </div>
</div>`;
}

// ═══════════ 附录 ═══════════

function renderAppendix(config: SpecConfig): string {
  const c44 = Math.round(config.canvas_width * 44 / 375);
  const c48 = Math.round(config.canvas_width * 48 / 375);
  const tW = Math.round(config.canvas_width * 51 / 375);
  const tH = Math.round(config.canvas_width * 31 / 375);
  return `
<h2>附录 A：组件尺寸速查表</h2>
<div class="spec-row"><div class="spec-visual"></div><div class="spec-text">
<table class="tbl"><tr><th>组件</th><th>推荐</th><th>最小</th></tr>
<tr><td>主按钮</td><td>280×52</td><td>200×44</td></tr>
<tr><td>次按钮</td><td>200×44</td><td>160×40</td></tr>
<tr><td>小按钮</td><td>120×36</td><td>88×36</td></tr>
<tr><td>图标按钮</td><td>${c48}×${c48}</td><td>${c44}×${c44}</td></tr>
<tr><td>选择卡片</td><td>200~240×220~260</td><td>160×180</td></tr>
<tr><td>列表行</td><td>全宽×56~72</td><td>全宽×44</td></tr>
<tr><td>居中弹窗</td><td>600~680×auto</td><td>560×auto</td></tr>
<tr><td>槽位</td><td>72×72</td><td>48×48</td></tr>
<tr><td>开关</td><td>${tW}×${tH}</td><td>—</td></tr>
</table>
</div></div>

<h2>附录 B：生成信息</h2>
<div class="spec-row"><div class="spec-visual"></div><div class="spec-text">
<table class="tbl"><tr><th>参数</th><th>值</th></tr>
<tr><td>平台</td><td>${tag(config.platform)} (${config.canvas_width}×${config.canvas_height})</td></tr>
<tr><td>网格</td><td>${config.grid_base}px 基础 · ${config.grid_columns}列 · 沟槽${config.grid_gutter}px · 边距${config.grid_margin}px</td></tr>
<tr><td>安全区</td><td>顶部${config.safe_area_top}px · 底部${config.safe_area_bottom}px</td></tr>
<tr><td>版本</td><td>v${config.version} · 生产线标准</td></tr>
</table>
</div></div>`;
}

// ═══════════════════════════════════════════════
// 辅助渲染函数
// ═══════════════════════════════════════════════

// hexToRGBA 从 shared/tokens.ts 导入，见文件顶部 import

function rarityCardCSS(config: SpecConfig): string {
  const colors = config.rarity_colors;
  let css = "";
  for (const [name, hex] of Object.entries(colors)) {
    const cls = name === "common" ? "co" : name === "rare" ? "ra" : name === "epic" ? "ep" : name === "legendary" ? "le" : name.substring(0, 2);
    css += `
.cc.q-${cls}{border-color:${hex};background:${hexToRGBA(hex, 0.03)}}
.cc.q-${cls} .ccb{background:${hexToRGBA(hex, 0.10)};color:${hex}}
`;
  }
  return css;
}

function renderRarityCards(config: SpecConfig): string {
  const labels: Record<string, string> = { common: "普通", rare: "稀有", epic: "史诗", legendary: "传说" };
  const cls: Record<string, string> = { common: "co", rare: "ra", epic: "ep", legendary: "le" };
  return Object.entries(config.rarity_colors).map(([name]) => {
    const c = cls[name] || name.substring(0, 2);
    return `<div class="comp-cell"><div class="cc q-${c}"><div class="ccb">${labels[name] || name}</div><div class="cci"></div><div class="ccn">${labels[name] || name}</div><div class="ccd">品质卡片</div></div><span class="clbl">${labels[name] || name}</span></div>`;
  }).join("");
}

function renderSlotDemos(config: SpecConfig): string {
  const cls: Record<string, string> = { common: "co", rare: "ra", epic: "ep", legendary: "le" };
  const emoji: Record<string, string> = { common: "🛡", rare: "🗡", epic: "⚡", legendary: "🔮" };
  return Object.entries(config.rarity_colors).map(([name]) => {
    const c = cls[name] || name.substring(0, 2);
    const hex = config.rarity_colors[name]!;
    return `<div class="comp-cell"><div class="csl" style="border:1.8px solid ${hex};background:${hexToRGBA(hex, 0.04)};"><div class="sld" style="background:${hex};"></div>${emoji[name] || "◆"}</div><span class="clbl">${name}</span></div>`;
  }).join("");
}

function renderBadgeDemos(config: SpecConfig): string {
  const cls: Record<string, string> = { common: "co", rare: "ra", epic: "ep", legendary: "le" };
  const labels: Record<string, string> = { common: "普通", rare: "稀有", epic: "史诗", legendary: "传说" };
  const hexes = config.rarity_colors;
  return Object.entries(hexes).map(([name, hex]) => {
    const c = cls[name] || name.substring(0, 2);
    return `<span class="cbadge" style="background:${hexToRGBA(hex, 0.08)};color:${hex};">${labels[name] || name}</span>`;
  }).join("") + `<span class="cbadge" style="background:rgba(200,72,72,0.08);color:var(--danger);">新</span><span class="cbadge dot"></span>`;
}

// ═══════════════════════════════════════════════
const RARITY_LABELS: Record<string, string> = { common: "普通", rare: "稀有", epic: "史诗", legendary: "传说" };
const RARITY_CLS: Record<string, string> = { common: "co", rare: "ra", epic: "ep", legendary: "le" };

function rarityGameComponentCSS(config: SpecConfig): string {
  let css = "";
  for (const [name, hex] of Object.entries(config.rarity_colors)) {
    const c = RARITY_CLS[name] || name.substring(0, 2);
    css += `
.chc.q-${c}{border-color:${hex};background:${hexToRGBA(hex,0.03)}}
.chc.q-${c} .hc-rarity-badge{background:${hexToRGBA(hex,0.12)};color:${hex}}
.chc.q-${c} .hc-art{border-bottom-color:${hexToRGBA(hex,0.15)}}
.chc.q-${c} .hc-stat-row .sfill{background:${hex}}
.cif.q-${c}{border-color:${hex};background:${hexToRGBA(hex,0.04)}}
.ctt.q-${c}{border-color:${hex}}
.ctt.q-${c} .tt-title{background:${hex}}
.ctt.q-${c} .tt-arrow{border-top-color:${hex}}
`;
  }
  return css;
}

function fs2(v: number, m: { phoneW: number }) { return Math.round(v * m.phoneW / 320); }
function daSize(x: number, y: number, label: string, m: GridMetrics): string {
  return `<div class="da-size-tag" style="left:${x}px;top:${y}px;font-size:${fs2(7,m)}px;color:var(--accent);padding:1px 3px;">${label}</div>`;
}
function daGap(x: number, y: number, w: number, token: string, m: GridMetrics): string {
  return `<div class="da-gap-tag" style="left:${x}px;top:${y}px;font-size:${fs2(6,m)}px;padding:0 2px;gap:2px;"><span style="font-size:${fs2(7,m)}px;">↔</span><span class="gap-line" style="width:${w}px;"></span><span>${token}</span></div>`;
}
function daType(x: number, y: number, level: string, m: GridMetrics): string {
  return `<span class="da-type-tag" style="position:absolute;left:${x}px;top:${y}px;font-size:${fs2(6,m)}px;color:var(--text-muted);padding:0 3px;z-index:30;">${level}</span>`;
}

// ── 12.1 玩家头像 ──
function renderPlayerAvatarShowcase(config: SpecConfig, m: GridMetrics): string {
  const entries = Object.entries(config.rarity_colors);
  const hexes = entries.map(([,h])=>h);
  const topH = Math.round(m.phoneH*0.13);
  const listTop = Math.round(m.phoneH*0.35);
  const rowGap = Math.round(5*m.scale);
  const cav = (cw: number, hex?: string) => {
    const w = Math.round(cw*m.scale), bw = Math.round(cw*0.03*m.scale)||1;
    return `<div class="cav" style="width:${w}px;height:${w}px;border:${bw}px solid ${hex||'var(--border-default)'};"><div class="av-img" style="font-size:${fs2(cw*0.17,m)}px;">A</div></div>`;
  };
  const items = [[96,"会长",99,true,hexes[0]],[72,"副会长",78,true,hexes[1]],[48,"成员",42,false,""]] as const;
  return `
<h3 id="玩家头像">12.1 玩家头像 (Player Avatar)</h3>
<div class="spec-row"><div class="spec-visual"><div class="proto-col"><div class="phone">
${renderGridOverlay(config, m)}
<div style="position:absolute;top:0;left:0;right:0;height:${topH}px;z-index:15;background:var(--surface);display:flex;align-items:flex-end;padding:${Math.round(3*m.scale)}px ${Math.round(5*m.scale)}px;border-bottom:1px solid var(--border-subtle);">
<div style="display:flex;align-items:center;gap:${Math.round(3*m.scale)}px;">${cav(72,hexes[1])}<div style="display:flex;flex-direction:column;gap:1px;"><span style="font-size:${fs2(13,m)}px;font-weight:600;color:var(--text-head);">玩家名称</span><span style="font-size:${fs2(9,m)}px;color:var(--text-muted);">Lv.42</span></div></div>
${daType(Math.round(m.phoneW*0.35), Math.round(topH*0.3), "H2 / Caption", m)}
</div>
<div style="position:absolute;top:${listTop}px;left:0;right:0;bottom:0;padding:${Math.round(4*m.scale)}px;display:flex;flex-direction:column;gap:${rowGap}px;">
${items.map(([cw,label,lv,on,h],i)=>`
<div style="display:flex;align-items:center;gap:${Math.round(3*m.scale)}px;position:relative;">
<div style="position:relative;display:inline-flex;">${cav(Number(cw),String(h)||undefined)}
<div class="av-lv" style="position:absolute;bottom:-2px;right:-2px;width:${Math.round(Number(cw)*0.22*m.scale)}px;height:${Math.round(Number(cw)*0.22*m.scale)}px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fs2(Number(cw)*0.09,m)}px;border:1.5px solid #fff;">${lv}</div>
<div class="av-dot ${on?'on':'off'}" style="position:absolute;top:0;right:0;width:${Math.round(Number(cw)*0.13*m.scale)}px;height:${Math.round(Number(cw)*0.13*m.scale)}px;border-radius:50%;border:1.5px solid #fff;"></div>
${i===0?daSize(Math.round(Number(cw)*m.scale)+8, 0, cw+'×'+cw, m):''}
</div><span style="font-size:${fs2(12,m)}px;color:var(--text-body);">${label}</span></div>
${i<items.length-1?daGap(Math.round(80*m.scale), Math.round(listTop+(i+0.5)*(Number(cw)*m.scale+rowGap)), rowGap, 'md '+Math.round(16*m.scale)+'px', m):''}
`).join("")}
</div></div><span class="proto-label">▲ 玩家头像 (大96 中72 小48 | 边框3px品质色 | 等级角标20px | 在线点10px | 行距md)</span></div></div>
<div class="spec-text"><table class="tbl"><tr><th>尺寸</th><th>画布</th><th>展示</th><th>边框</th></tr>
<tr><td>大</td><td>96×96</td><td>${Math.round(96*m.scale)}×${Math.round(96*m.scale)}</td><td>3px 品质色</td></tr>
<tr><td>标准</td><td>72×72</td><td>${Math.round(72*m.scale)}×${Math.round(72*m.scale)}</td><td>2px 品质色</td></tr>
<tr><td>小</td><td>48×48</td><td>${Math.round(48*m.scale)}×${Math.round(48*m.scale)}</td><td>2px</td></tr></table>
<p class="note">头像框品质色与卡片/槽位品质系统一致。等级角标品牌色底白字，在线状态右上角圆点。</p></div></div>`;
}

// ── 12.2 英雄卡牌 ──
function renderHeroCardShowcase(config: SpecConfig, m: GridMetrics): string {
  const cw=160,ch=220,w=Math.round(cw*m.scale),h=Math.round(ch*m.scale),gap=Math.round(4*m.scale);
  const entries=Object.entries(config.rarity_colors);
  const card=(name:string,rk:string,hp:number,atk:number,stars:number,sel?:boolean)=>{
    const c=RARITY_CLS[rk]||rk.substring(0,2);
    return `<div class="chc q-${c}${sel?' sel':''}" style="width:${w}px;height:${h}px;"><div class="hc-art" style="font-size:${fs2(24,m)}px;">⚔</div><div class="hc-rarity-badge" style="font-size:${fs2(9,m)}px;">${RARITY_LABELS[rk]||rk}</div><div class="hc-elem" style="width:${Math.round(22*m.scale)}px;height:${Math.round(22*m.scale)}px;font-size:${fs2(10,m)}px;">🔥</div><div class="hc-info"><div class="hc-name" style="font-size:${fs2(14,m)}px;">${name}</div><div class="hc-star-row" style="font-size:${fs2(9,m)}px;">${'★'.repeat(stars)}${'☆'.repeat(Math.max(0,5-stars))}</div><div class="hc-stat-row"><span class="slbl" style="width:${Math.round(24*m.scale)}px;font-size:${fs2(9,m)}px;">HP</span><div class="strack"><div class="sfill" style="width:${hp}%;"></div></div><span style="font-size:${fs2(8,m)}px;color:var(--text-muted);">${hp}%</span></div><div class="hc-stat-row"><span class="slbl" style="width:${Math.round(24*m.scale)}px;font-size:${fs2(9,m)}px;">ATK</span><div class="strack"><div class="sfill" style="width:${atk}%;background:var(--danger);"></div></div><span style="font-size:${fs2(8,m)}px;color:var(--text-muted);">${atk}%</span></div></div></div>`;
  };
  const ns=["铁卫","游侠","术士","龙骑"];
  return `
<h3 id="英雄卡牌">12.2 英雄卡牌 (Hero Card)</h3>
<div class="spec-row"><div class="spec-visual"><div class="proto-col"><div class="phone" style="display:flex;align-items:center;justify-content:center;gap:${gap}px;position:relative;">
${renderGridOverlay(config, m)}
<div style="position:absolute;inset:0;background:rgba(0,0,0,.3);z-index:20;"></div>
<div style="position:relative;z-index:21;display:flex;align-items:center;justify-content:center;gap:${gap}px;flex-wrap:wrap;">${entries.map(([k],i)=>card(ns[i]||k,k,[90,75,60,95][i],[80,95,65,70][i],[5,4,3,5][i])).join("")}${card("英雄",entries[0]?.[0]||"common",90,80,5,true)}</div>
${daSize(Math.round(m.phoneW*0.05), Math.round(m.phoneH*0.25), cw+'×'+ch, m)}
${daGap(Math.round(m.phoneW*0.22), Math.round(m.phoneH*0.55), gap, 'md '+Math.round(16*m.scale)+'px', m)}
${daType(Math.round(m.phoneW*0.08), Math.round(m.phoneH*0.78), 'H2 / Label / Caption', m)}
</div><span class="proto-label">▲ 英雄卡牌 (160×220 品质边框+立绘55%+HP/ATK条 | 星级+元素 | 选中金边glow | 间距md)</span></div></div>
<div class="spec-text"><table class="tbl"><tr><th>属性</th><th>值</th></tr>
<tr><td>卡牌尺寸</td><td>160×220 (展示 ${w}×${h})</td></tr>
<tr><td>品质标签</td><td>左上角, 按品质着色</td></tr>
<tr><td>选中态</td><td>金色边框+外发光</td></tr>
<tr><td>锁定态</td><td>虚线+40%透明度</td></tr></table></div></div>`;
}

// ── 12.3 道具框 ──
function renderItemFrameShowcase(config: SpecConfig, m: GridMetrics): string {
  const entries=Object.entries(config.rarity_colors);
  const cw=72,tabH=Math.round(m.phoneH*0.06),gridTop=Math.round(m.phoneH*0.21),gap=Math.round(3*m.scale);
  const frame=(rk:string,qty:number|null,equipped?:boolean,empty?:boolean)=>{
    const c=RARITY_CLS[rk]||rk.substring(0,2),w=Math.round(cw*m.scale),iconS=Math.round(cw*0.67*m.scale),bw=Math.round(cw*0.03*m.scale)||1;
    return `<div class="cif q-${c}${empty?' emp':''}" style="width:${w}px;height:${w}px;border-width:${bw}px;position:relative;"><div class="if-icon" style="width:${iconS}px;height:${iconS}px;font-size:${fs2(cw*0.2,m)}px;">${empty?'':'◆'}</div>${qty!==null?`<div class="if-qty" style="font-size:${fs2(cw*0.1,m)}px;">x${qty}</div>`:''}${equipped?`<div class="if-equipped" style="width:${Math.round(cw*0.2*m.scale)}px;height:${Math.round(cw*0.2*m.scale)}px;font-size:${fs2(cw*0.1,m)}px;">E</div>`:''}</div>`;
  };
  const items=entries.map(([k],i)=>({key:k,qty:[99,1,null,5][i] as number|null,eq:i===0}));
  return `
<h3 id="道具框">12.3 道具框 (Item Frame)</h3>
<div class="spec-row"><div class="spec-visual"><div class="proto-col"><div class="phone">
${renderGridOverlay(config, m)}
<div style="position:absolute;top:0;left:0;right:0;height:${Math.round(m.phoneH*0.13)}px;z-index:15;background:var(--surface);display:flex;align-items:flex-end;padding:${Math.round(4*m.scale)}px;font-size:${fs2(13,m)}px;font-weight:600;color:var(--text-head);border-bottom:1px solid var(--border-subtle);">背 包</div>
<div style="position:absolute;top:${Math.round(m.phoneH*0.13)}px;left:0;right:0;height:${tabH}px;z-index:14;display:flex;align-items:center;font-size:${fs2(10,m)}px;color:var(--text-muted);background:var(--surface-hover);">${["全部","武器","防具","道具"].map((t,i)=>`<span style="flex:1;text-align:center;${i===0?'color:var(--accent);border-bottom:2px solid var(--accent);':''}padding:${Math.round(2*m.scale)}px 0;">${t}</span>`).join("")}</div>
<div style="position:absolute;top:${gridTop}px;left:0;right:0;bottom:${Math.round(m.phoneH*0.1)}px;display:flex;flex-wrap:wrap;gap:${gap}px;padding:${Math.round(4*m.scale)}px;align-content:flex-start;">${[...items,...items].slice(0,10).map((it,i)=>frame(it.key,it.qty,it.eq&&i===0,false)).join("")}${frame("common",null,false,true)}${frame("common",null,false,true)}</div>
${daSize(Math.round(10*m.scale), gridTop+Math.round(5*m.scale), cw+'×'+cw, m)}
${daGap(Math.round(80*m.scale), gridTop+Math.round(5*m.scale), gap, 'sm '+Math.round(8*m.scale)+'px', m)}
${daType(Math.round(m.phoneW*0.3), Math.round(m.phoneH*0.14), 'H2 / Body', m)}
<div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(m.phoneH*0.1)}px;z-index:15;background:var(--surface);display:flex;align-items:center;justify-content:space-around;font-size:${fs2(10,m)}px;color:var(--text-body);border-top:1px solid var(--border-subtle);">${["排序","筛选","分解"].map(s=>`<span>${s}</span>`).join("")}</div>
</div><span class="proto-label">▲ 道具框 (72×72 品质边框2px+图标70%+数量角标 | E标 | 空槽虚线50% | 间距sm 8px)</span></div></div>
<div class="spec-text"><table class="tbl"><tr><th>规格</th><th>尺寸</th><th>特征</th></tr>
<tr><td>大框</td><td>96×96</td><td>3px 品质边框, 数量角标</td></tr>
<tr><td>标准框</td><td>72×72</td><td>2px 品质边框, 数量角标</td></tr>
<tr><td>小框</td><td>48×48</td><td>2px 品质边框, 无角标</td></tr>
<tr><td>空槽位</td><td>—</td><td>虚线+50%透明度</td></tr></table></div></div>`;
}

// ── 12.4 技能框 ──
function renderSkillFrameShowcase(config: SpecConfig, m: GridMetrics): string {
  const ci=72,iconW=Math.round(ci*m.scale),iconInner=Math.round(ci*0.67*m.scale),gap=Math.round(4*m.scale);
  const entries=Object.entries(config.rarity_colors);
  const skill=(name:string,rk:string,energy:number,cdSec:number|null,locked?:boolean,empty?:boolean)=>{
    const hex=config.rarity_colors[rk]||"#888";
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:${Math.round(2*m.scale)}px;"><div style="width:${iconW}px;height:${iconW}px;border-radius:6px;border:1.8px solid ${hex};position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;${locked||empty?'opacity:.35;border-style:dashed;':''}background:${empty?'transparent':hexToRGBA(hex,0.04)};"><div style="width:${iconInner}px;height:${iconInner}px;background:rgba(0,0,0,.03);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:${fs2(16,m)}px;">${locked?'🔒':empty?'':'◆'}</div>${cdSec!==null?`<div style="position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:${fs2(16,m)}px;">${cdSec}s</div>`:''}${!locked&&!empty?`<div style="position:absolute;top:1px;left:1px;padding:0 3px;border-radius:99px;background:var(--info);color:#fff;font-weight:600;font-size:${fs2(9,m)}px;">${energy}</div>`:''}</div><span style="font-size:${fs2(10,m)}px;color:var(--text-body);text-align:center;">${locked?'未解锁':empty?'空':name}</span></div>`;
  };
  const skills=[{n:"烈焰斩",k:entries[3]?.[0]||"legendary",e:50,c:null},{n:"冰霜箭",k:entries[2]?.[0]||"epic",e:30,c:12},{n:"技能",k:entries[1]?.[0]||"rare",e:20,c:null},{n:"技能",k:entries[0]?.[0]||"common",e:0,c:null,l:true}] as const;
  return `
<h3 id="技能框">12.4 技能框 (Skill Frame)</h3>
<div class="spec-row"><div class="spec-visual"><div class="proto-col"><div class="phone">
${renderGridOverlay(config, m)}
<div style="position:absolute;top:0;left:0;right:0;height:${Math.round(m.phoneH*0.09)}px;z-index:15;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:space-between;padding:${Math.round(3*m.scale)}px ${Math.round(5*m.scale)}px;font-size:${fs2(10,m)}px;color:#fff;"><span>W3/15</span><span>敌×5</span><span>⏱ 02:15</span></div>
<div style="position:absolute;top:${Math.round(m.phoneH*0.09)}px;left:0;right:0;bottom:${Math.round(m.phoneH*0.18)}px;background:var(--surface-hover);display:flex;align-items:center;justify-content:center;font-size:${fs2(14,m)}px;color:var(--text-muted);">战 场 区 域</div>
<div style="position:absolute;bottom:${Math.round(m.phoneH*0.05)}px;left:0;right:0;height:${Math.round(m.phoneH*0.13)}px;z-index:15;display:flex;align-items:center;justify-content:center;gap:${gap}px;padding:0 ${Math.round(5*m.scale)}px;">${skills.map(s=>skill(s.n,s.k,s.e,s.c??null,(s as any).l)).join("")}</div>
${daSize(Math.round(5*m.scale), Math.round(m.phoneH*0.83), ci+'×'+ci, m)}
${daGap(Math.round(m.phoneW*0.22), Math.round(m.phoneH*0.87), gap, 'lg '+Math.round(24*m.scale)+'px', m)}
${daType(Math.round(m.phoneW*0.18), Math.round(m.phoneH*0.91), 'Caption', m)}
</div><span class="proto-label">▲ 技能框 (72×72 品质边框+能量角标 | 冷却遮罩50%+倒计时 | 锁定40%透明 | 间距lg)</span></div></div>
<div class="spec-text"><table class="tbl"><tr><th>状态</th><th>特征</th></tr>
<tr><td>可用</td><td>品质边框+图标, 左上角蓝底白字能量消耗</td></tr>
<tr><td>冷却中</td><td>半透明黑遮罩+中央白色倒计时数字</td></tr>
<tr><td>锁定</td><td>灰色+40%透明度+🔒</td></tr>
<tr><td>空槽位</td><td>虚线+50%透明度</td></tr></table></div></div>`;
}

// ── 12.5 TIPS ──
function renderTooltipShowcase(config: SpecConfig, m: GridMetrics): string {
  const w=Math.round(180*m.scale),entries=Object.entries(config.rarity_colors);
  const tt=(rk:string,title:string,desc:string,stats:[string,string][])=>{
    const c=RARITY_CLS[rk]||rk.substring(0,2),hex=config.rarity_colors[rk]||"#888";
    return `<div class="ctt q-${c}" style="width:${w}px;border-color:${hex};"><div class="tt-title" style="font-size:${fs2(11,m)}px;background:${hex};">${title}</div><div class="tt-body" style="font-size:${fs2(10,m)}px;">${desc}</div>${stats.map(([k,v])=>`<div class="tt-row" style="font-size:${fs2(10,m)}px;"><span class="tt-k">${k}</span><span class="tt-v">${v}</span></div>`).join("")}<div class="tt-arrow" style="border-top-color:${hex};"></div></div>`;
  };
  const titles:Record<string,string>={common:"铁剑",rare:"秘银弓",epic:"暗影法杖",legendary:"龙焰之刃"};
  const descs:Record<string,string>={common:"一把普通的铁剑。",rare:"精灵工匠打造的银弓。",epic:"蕴含暗影之力的法杖。",legendary:"传说中龙骑士的佩剑。"};
  const ttTop=Math.round(m.phoneH*0.35);
  return `
<h3 id="tips浮窗">12.5 TIPS 浮窗 (Tooltip)</h3>
<div class="spec-row"><div class="spec-visual"><div class="proto-col"><div class="phone">
${renderGridOverlay(config, m)}
<div style="position:absolute;top:0;left:0;right:0;height:${Math.round(m.phoneH*0.13)}px;z-index:5;background:var(--surface);display:flex;align-items:flex-end;padding:${Math.round(4*m.scale)}px;font-size:${fs2(13,m)}px;font-weight:600;color:var(--text-head);border-bottom:1px solid var(--border-subtle);">装 备</div>
<div style="position:absolute;top:${Math.round(m.phoneH*0.15)}px;left:0;right:0;padding:${Math.round(5*m.scale)}px;display:flex;flex-direction:column;gap:${Math.round(4*m.scale)}px;">${entries.map(([k])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:${Math.round(3*m.scale)}px 0;border-bottom:1px solid var(--border-subtle);"><span style="font-size:${fs2(11,m)}px;color:var(--text-body);">${titles[k]||k}</span><span style="font-size:${fs2(10,m)}px;color:var(--text-muted);">长按查看 ›</span></div>`).join("")}</div>
<div style="position:absolute;top:${ttTop}px;left:50%;transform:translateX(-50%);z-index:25;">${tt(entries[3]?.[0]||"legendary",titles[entries[3]?.[0]||"legendary"]||"",descs[entries[3]?.[0]||"legendary"]||"",[["ATK","+32~78"],["暴击率","+15%"],["特效","龙焰灼烧"]])}</div>
${daSize(Math.round(m.phoneW*0.35), ttTop-12, '180w', m)}
${daType(Math.round(m.phoneW*0.45), ttTop+Math.round(10*m.scale), 'H2 / Body / Caption', m)}
</div><span class="proto-label">▲ TIPS 浮窗 (宽180px 品质标题栏+正文+属性行 | 三角箭头 | 长按>=500ms)</span></div></div>
<div class="spec-text"><table class="tbl"><tr><th>属性</th><th>值</th></tr>
<tr><td>最大宽度</td><td>240~300px (展示 ${w}px)</td></tr>
<tr><td>标题栏</td><td>品质色底+白字</td></tr>
<tr><td>属性行</td><td>标签-数值 两端对齐</td></tr>
<tr><td>触发</td><td>长按>=500ms触发, 松手消失</td></tr></table></div></div>`;
}

// ── 12.6 弹窗可视化 ──
function renderDialogVisualShowcase(config: SpecConfig, m: GridMetrics): string {
  return `
<h3 id="弹窗可视化">12.6 弹窗可视化 (Dialog Visual)</h3>
<div class="spec-row"><div class="spec-visual" style="flex-wrap:wrap;gap:10px;display:flex;justify-content:center;">
<div class="proto-col"><div class="phone"><div class="cdlg-overlay"><div class="cdlg-box" style="width:${Math.round(m.phoneW*0.7)}px;"><div class="dg-title" style="font-size:${fs2(14,m)}px;">确认删除</div><div class="dg-body" style="font-size:${fs2(11,m)}px;">确定删除此项？<br>此操作不可撤销。</div><div class="dg-actions"><div class="dg-btn" style="font-size:${fs2(11,m)}px;color:var(--text-muted);border-right:1px solid var(--border-subtle);">取消</div><div class="dg-btn" style="font-size:${fs2(11,m)}px;color:var(--accent);">确认</div></div></div></div>${daSize(Math.round(m.phoneW*0.15), Math.round(m.phoneH*0.3), 'W70%', m)}</div><span class="proto-label">Alert 对话框</span></div>
<div class="proto-col"><div class="phone"><div class="cdlg-overlay"><div class="cdlg-bs"><div class="bs-handle"></div><div class="bs-row" style="font-size:${fs2(12,m)}px;color:var(--text-head);">分享到</div><div class="bs-row" style="font-size:${fs2(11,m)}px;">微信好友</div><div class="bs-row" style="font-size:${fs2(11,m)}px;">朋友圈</div><div class="bs-row" style="font-size:${fs2(11,m)}px;color:var(--text-muted);border-bottom:none;">取消</div></div></div>${daSize(Math.round(m.phoneW*0.2), Math.round(m.phoneH*0.7), 'W100% H≤45%', m)}</div><span class="proto-label">BottomSheet</span></div>
<div class="proto-col"><div class="phone"><div class="cdlg-overlay"><div class="cdlg-box" style="width:${Math.round(m.phoneW*0.82)}px;"><div class="dg-title" style="font-size:${fs2(14,m)}px;display:flex;justify-content:space-between;padding-left:${Math.round(5*m.scale)}px;padding-right:${Math.round(5*m.scale)}px;">设置<span style="color:var(--text-muted);">✕</span></div><div style="padding:${Math.round(4*m.scale)}px ${Math.round(6*m.scale)}px;font-size:${fs2(11,m)}px;color:var(--text-body);display:flex;flex-direction:column;gap:${Math.round(3*m.scale)}px;"><div style="display:flex;justify-content:space-between;padding:${Math.round(2*m.scale)}px 0;border-bottom:1px solid var(--border-subtle);"><span>音效音量</span><span style="color:var(--text-muted);">80%</span></div><div style="display:flex;justify-content:space-between;padding:${Math.round(2*m.scale)}px 0;border-bottom:1px solid var(--border-subtle);"><span>音乐音量</span><span style="color:var(--text-muted);">60%</span></div><div style="display:flex;justify-content:space-between;padding:${Math.round(2*m.scale)}px 0;"><span>画质</span><span style="color:var(--text-muted);">高</span></div></div></div></div>${daSize(Math.round(m.phoneW*0.1), Math.round(m.phoneH*0.35), 'W80% H≤60%', m)}</div><span class="proto-label">Modal 面板</span></div>
<div class="proto-col"><div class="phone"><div class="cdlg-toast" style="font-size:${fs2(10,m)}px;bottom:${Math.round(m.phoneH*0.12)}px;">操作成功</div>${daSize(Math.round(m.phoneW*0.35), Math.round(m.phoneH*0.82), 'auto×26px', m)}</div><span class="proto-label">Toast 提示</span></div>
</div><div class="spec-text"><table class="tbl"><tr><th>类型</th><th>尺寸</th><th>用途</th></tr>
<tr><td>Alert</td><td>W70% H:auto</td><td>确认/二选一</td></tr>
<tr><td>BottomSheet</td><td>W100% H<=45%</td><td>选项/分享</td></tr>
<tr><td>Modal</td><td>W80% H<=60%</td><td>表单/多操作</td></tr>
<tr><td>Toast</td><td>auto×24~28</td><td>轻量提示</td></tr></table><p class="note">遮罩透明度 45~60%, 弹窗 scale 0.9→1.0 + fade 0.2~0.3s。</p></div></div>`;
}

// ── 总入口 ──
function renderGameComponents(config: SpecConfig, m: GridMetrics): string {
  return `
<h2 id="游戏专用组件"><span class="num">12</span> 游戏专用组件</h2>
${renderPlayerAvatarShowcase(config, m)}
${renderHeroCardShowcase(config, m)}
${renderItemFrameShowcase(config, m)}
${renderSkillFrameShowcase(config, m)}
${renderTooltipShowcase(config, m)}
${renderDialogVisualShowcase(config, m)}`;
}

// ── 音效规范 ──
function renderSoundSpec(config: SpecConfig): string {
  return `
<h2 id="音效规范"><span class="num">15</span> 音效规范</h2>
<div class="spec-row"><div class="spec-visual"><div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:280px;">
<div class="tmr"><span class="tl">按钮点击</span><div class="tt"><div class="tf" style="width:18%;background:var(--info);"></div></div><span class="tv">&lt;200ms 清脆</span></div>
<div class="tmr"><span class="tl">切换选择</span><div class="tt"><div class="tf" style="width:20%;background:var(--info);"></div></div><span class="tv">&lt;200ms 轻短</span></div>
<div class="tmr"><span class="tl">操作成功</span><div class="tt"><div class="tf" style="width:25%;background:var(--success);"></div></div><span class="tv">&lt;300ms 上扬</span></div>
<div class="tmr"><span class="tl">操作失败</span><div class="tt"><div class="tf" style="width:22%;background:var(--danger);"></div></div><span class="tv">&lt;300ms 低沉</span></div>
<div class="tmr"><span class="tl">获得物品</span><div class="tt"><div class="tf" style="width:35%;background:var(--accent);"></div></div><span class="tv">&lt;400ms 叮咚</span></div>
</div></div><div class="spec-text"><table class="tbl"><tr><th>类别</th><th>时长</th><th>特点</th></tr>
<tr><td>按钮点击</td><td>&lt;200ms</td><td>短促清脆</td></tr>
<tr><td>切换/选择</td><td>&lt;200ms</td><td>轻短确认感</td></tr>
<tr><td>操作成功</td><td>&lt;300ms</td><td>明亮上扬</td></tr>
<tr><td>操作失败</td><td>&lt;300ms</td><td>低沉短促</td></tr>
<tr><td>获得物品</td><td>&lt;400ms</td><td>悦耳叮咚感</td></tr></table>
<p><strong>规范：</strong>UI 音效 <=500ms。提供"关闭音效"和"关闭 UI 音效"两个独立开关。</p></div></div>`;
}

// ── 横竖屏切换 ──
function renderOrientationSpec(config: SpecConfig): string {
  return `
<h2 id="横竖屏切换"><span class="num">16</span> 横竖屏切换</h2>
<div class="spec-row"><div class="spec-visual"><pre>方向策略：
• 不强制锁定方向（核心玩法依赖除外）
• 需要锁定则在设计文档中声明
• 切换过渡 <=0.5s
• 布局以中心锚点自适应</pre></div>
<div class="spec-text"><p><strong>锁定场景：</strong>竖版跑酷/横版格斗等方向强依赖玩法可锁定。</p>
<p><strong>适配策略：</strong>宽度统一 ${config.canvas_width}，保证横向布局不变；纵向以中心锚点拓展。</p></div></div>`;
}
