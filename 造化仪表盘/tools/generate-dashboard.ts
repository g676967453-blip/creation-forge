/**
 * 造化坊仪表盘生成器
 * 生成独立 HTML 文件（侧栏导航 · 板块总览默认首页 · 暗色系）
 *
 * 使用: npx tsx 造化仪表盘/tools/generate-dashboard.ts
 * 输出: 造化仪表盘/reports/造化坊仪表盘.html
 * 本地服务（完成/取消秒级生效 + /api/activity 变动监控）: npx tsx 造化仪表盘/tools/dashboard-server.ts → http://127.0.0.1:3456
 */

import * as fs from "fs";
import * as path from "path";
import { collectData } from "./collect-data";

const ROOT = path.resolve(__dirname, "../..");  // 仓库根（本文件在 造化仪表盘/tools/）
const OUT_DIR = path.join(ROOT, "造化仪表盘", "reports");
const OUT_FILE = path.join(OUT_DIR, "造化坊仪表盘.html");

export function generateHTML() {
  const D = collectData();
  const dataJSON = JSON.stringify(D);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>造化坊 · 仪表盘</title>
<style>
/* ============================================================
   造化坊仪表盘 · 设计系统 v2
   方向：Modern Tool / Builder SaaS（Linear 式温暗色）
   字体三角色：显示 Noto Serif SC · 界面 Noto Sans SC · 数据 Cascadia Mono
   色彩：单强调色（朱砂红）+ 语义色统一 oklch 明度派生；发丝边框；圆角 6/12/16
   ============================================================ */
:root{
  --bg:#0b0c0e;--s1:#141519;--s2:#1a1b21;--s3:#23252d;
  --line:rgba(255,255,255,.07);--line-2:rgba(255,255,255,.13);
  --tx:#f5f6f8;--tx-2:#9aa1ac;--tx-3:#6b7280;--tx-4:rgba(255,255,255,.28);
  --accent:#ff6b6b;--accent-bg:rgba(255,107,107,.10);--accent-line:rgba(255,107,107,.26);
  --ok:#5fd39a;--ok-bg:rgba(95,211,154,.10);--ok-line:rgba(95,211,154,.24);
  --warn:#eec25c;--warn-bg:rgba(238,194,92,.10);--warn-line:rgba(238,194,92,.24);
  --info:#7fb0ff;--info-bg:rgba(127,176,255,.10);--info-line:rgba(127,176,255,.24);
  --plan:#b79bff;--plan-bg:rgba(183,155,255,.10);--plan-line:rgba(183,155,255,.24);
  --zcool:#e0a8c8;--zcool-bg:rgba(224,168,200,.10);--zcool-line:rgba(224,168,200,.24);
  --sans:"Noto Sans SC","Source Han Sans CN","Microsoft YaHei",sans-serif;
  --serif:"Noto Serif SC","Source Han Serif SC","Songti SC",serif;
  --mono:"Cascadia Mono",Consolas,"Noto Sans SC",ui-monospace,monospace;
  --r-s:6px;--r-m:12px;--r-l:16px;
  --ease:cubic-bezier(.22,1,.36,1);
  --shadow:0 1px 2px rgba(0,0,0,.35);
}
/* oklch 升级层：语义色统一感知明度（L≈.78 / C≈.12），旧浏览器沿用上层 hex 值 */
@supports (color:oklch(0 0 0)){
  :root{
    --bg:oklch(.15 .006 275);--s1:oklch(.19 .007 275);--s2:oklch(.225 .009 275);--s3:oklch(.27 .011 275);
    --tx-2:oklch(.72 .012 265);--tx-3:oklch(.58 .012 265);
    --ok:oklch(.79 .12 158);--warn:oklch(.82 .12 82);--info:oklch(.76 .10 252);
    --plan:oklch(.76 .11 300);--zcool:oklch(.79 .07 340);
    --ok-bg:color-mix(in oklab,var(--ok) 12%,transparent);--ok-line:color-mix(in oklab,var(--ok) 26%,transparent);
    --warn-bg:color-mix(in oklab,var(--warn) 12%,transparent);--warn-line:color-mix(in oklab,var(--warn) 26%,transparent);
    --info-bg:color-mix(in oklab,var(--info) 12%,transparent);--info-line:color-mix(in oklab,var(--info) 26%,transparent);
    --plan-bg:color-mix(in oklab,var(--plan) 12%,transparent);--plan-line:color-mix(in oklab,var(--plan) 26%,transparent);
    --zcool-bg:color-mix(in oklab,var(--zcool) 12%,transparent);--zcool-line:color-mix(in oklab,var(--zcool) 26%,transparent);
  }
  .topbar{background:color-mix(in oklab,var(--bg) 86%,transparent)}
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--tx);font-family:var(--sans);font-size:14px;line-height:1.6;min-height:100vh;-webkit-font-smoothing:antialiased;text-wrap:pretty;font-variant-numeric:tabular-nums}
a{color:var(--tx-2);text-decoration:none}
a:hover{color:var(--tx)}
::selection{background:var(--accent-bg);color:var(--tx)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--s3);border-radius:999px;border:3px solid var(--bg)}
::-webkit-scrollbar-thumb:hover{background:var(--s2)}
.app{min-height:100vh}
/* 顶部导航栏（粘性 · 毛玻璃） */
.topbar{position:sticky;top:0;z-index:40;background:rgba(11,12,14,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.topbar-inner{display:flex;align-items:center;gap:18px;flex-wrap:wrap;max-width:1320px;margin:0 auto;padding:10px 30px}
.brand{display:flex;flex-direction:column;justify-content:center;flex-shrink:0}
.brand h1{display:flex;align-items:center;font-family:var(--serif);font-size:18px;font-weight:600;color:var(--tx);line-height:1.2;letter-spacing:.04em}
.brand h1::before{content:'';width:6px;height:6px;border-radius:1px;background:var(--accent);margin-right:8px;flex-shrink:0}
.brand .brand-en{font-family:var(--mono);font-size:9px;letter-spacing:.2em;color:var(--tx-3);margin:3px 0 0 14px}
.topnav{display:flex;align-items:center;gap:2px;flex-wrap:wrap;flex:1;min-width:0}
.tab{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;font-size:13px;color:var(--tx-2);cursor:pointer;border-radius:var(--r-s);border:none;background:transparent;text-align:left;font-family:inherit;transition:color .15s ease-out,background .15s ease-out;white-space:nowrap}
.tab .ico{width:15px;height:15px;flex-shrink:0;opacity:.7;transition:opacity .15s ease-out}
.tab:hover{color:var(--tx);background:rgba(255,255,255,.04)}
.tab:hover .ico{opacity:1}
.tab.active{color:var(--tx);background:var(--s2);box-shadow:inset 0 0 0 1px var(--line)}
.tab.active .ico{opacity:1;color:var(--accent)}
.main{max-width:1320px;margin:0 auto;padding:22px 30px 48px}
.page-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-family:var(--mono);font-size:10.5px;color:var(--tx-3);padding-bottom:12px;margin-bottom:6px;border-bottom:1px solid var(--line)}
.top-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-left:auto}
.panel{display:none}
.panel.active{display:block;animation:panelIn .35s var(--ease)}
@keyframes panelIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;transition-duration:.001ms!important}}
.ico{width:15px;height:15px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.mini-stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.mini-stat{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-s);padding:9px 12px;min-width:94px}
.mini-stat .ms-label{font-family:var(--mono);font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--tx-3)}
.mini-stat .ms-value{font-size:19px;font-weight:600;color:var(--tx);margin-top:3px;font-variant-numeric:tabular-nums}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:26px}
.card{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:18px;transition:border-color .15s ease-out}
.card:hover{border-color:var(--line-2)}
.card .label{font-family:var(--mono);font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--tx-3);margin-bottom:8px}
.card .value{font-size:29px;font-weight:600;color:var(--tx);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.card .detail{font-size:11.5px;color:var(--tx-3);margin-top:5px}
/* 五板块总览卡片 */
.board-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:12px;margin-bottom:8px}
.board-card{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:16px 18px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s ease-out,background .15s ease-out}
.board-card:hover{border-color:var(--line-2);background:var(--s2)}
.board-card .bd-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.board-card .bd-emoji{width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--s2);border:1px solid var(--line);border-radius:6px;flex-shrink:0}
.board-card .bd-name{font-size:14.5px;font-weight:600;color:var(--tx)}
.board-card .bd-dir{font-family:var(--mono);font-size:10px;color:var(--tx-3)}
.board-card .bd-desc{font-size:11.5px;color:var(--tx-2);line-height:1.6}
.board-card .bd-dirty{font-size:11px;color:var(--warn)}
.board-card .bd-commits{border-top:1px solid var(--line);padding-top:9px;margin-top:2px;font-size:11px;line-height:1.85;color:var(--tx-3);min-height:20px}
.board-card .bd-commits .hash{font-family:var(--mono);font-size:10.5px;color:var(--tx-2);background:var(--s3);padding:1px 5px;border-radius:6px;margin-right:5px}
/* 表格 */
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;padding:9px 14px;background:transparent;border-bottom:1px solid var(--line-2);color:var(--tx-3);font-weight:500;font-size:11px;letter-spacing:.04em;white-space:nowrap}
.tbl td{padding:11px 14px;border-top:1px solid var(--line);color:var(--tx-2);vertical-align:top}
.tbl tbody tr{transition:background .13s ease-out}
.tbl tr:hover td{background:rgba(255,255,255,.022)}
.tbl strong{color:var(--tx);font-weight:500}
.tbl code{font-family:var(--mono);font-size:11px;background:var(--s2);padding:1px 5px;border-radius:6px;color:var(--tx-2)}
/* 徽章：仅作语义编码，低饱和发丝描边 */
.badge{padding:2px 9px;border-radius:999px;font-size:11px;font-weight:500;display:inline-block;white-space:nowrap;line-height:1.75;border:1px solid transparent}
.badge-active,.badge-done,.badge-mature{background:var(--ok-bg);color:var(--ok);border-color:var(--ok-line)}
.badge-idle,.badge-testing{background:var(--warn-bg);color:var(--warn);border-color:var(--warn-line)}
.badge-active-task{background:var(--accent-bg);color:var(--accent);border-color:var(--accent-line)}
.badge-planned{background:var(--plan-bg);color:var(--plan);border-color:var(--plan-line)}
.badge-ongoing{background:var(--info-bg);color:var(--info);border-color:var(--info-line)}
.badge-empty,.badge-cancelled{background:rgba(255,255,255,.04);color:var(--tx-3);border-color:var(--line)}
.badge-prio-high{background:var(--accent-bg);color:var(--accent);border-color:var(--accent-line)}
.badge-prio-mid{background:var(--warn-bg);color:var(--warn);border-color:var(--warn-line)}
.badge-prio-low{background:var(--ok-bg);color:var(--ok);border-color:var(--ok-line)}
/* 目标 / 项目卡片 */
.goal-card{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:18px;margin-bottom:10px;transition:border-color .15s ease-out}
.goal-card:hover{border-color:var(--line-2)}
.goal-card .goal-header{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
.goal-card .goal-name{font-size:14.5px;font-weight:600;color:var(--tx);letter-spacing:.01em}
.goal-card .goal-detail{font-size:12.5px;color:var(--tx-2);margin-bottom:13px;line-height:1.65}
.goal-card .goal-meta{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.goal-progress{flex:1;min-width:130px}
.goal-progress .bar-track{height:4px;background:var(--s3);border-radius:999px;overflow:hidden;margin-bottom:6px}
.goal-progress .bar-fill{height:100%;border-radius:999px;transition:width .45s var(--ease)}
.goal-progress .bar-label{font-family:var(--mono);font-size:10.5px;color:var(--tx-3)}
.bar-fill.bar-green{background:var(--ok)}
.bar-fill.bar-orange{background:var(--warn)}
.bar-fill.bar-blue{background:var(--info)}
.bar-fill.bar-red{background:var(--accent)}
.todo-badge{padding:2px 9px;border-radius:999px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px;border:1px solid transparent}
.todo-badge.has-todos{background:var(--info-bg);color:var(--info);border-color:var(--info-line)}
.todo-badge.no-todos{background:rgba(255,255,255,.03);color:var(--tx-3);border-color:var(--line)}
.hidden{display:none}
.section-title{display:flex;align-items:baseline;gap:10px;font-size:14px;font-weight:600;color:var(--tx);letter-spacing:.01em;margin:26px 0 12px;padding-bottom:9px;border-bottom:1px solid var(--line)}
.section-title.collapsed{opacity:.55}
/* 日志 / 提交 */
.log-item{padding:11px 0;border-bottom:1px solid var(--line);display:flex;gap:16px;align-items:baseline}
.log-item .log-date{font-family:var(--mono);font-size:11px;color:var(--tx-3);min-width:78px}
.log-item .log-file{font-size:12.5px;color:var(--tx);min-width:250px}
.log-item .log-desc{font-size:12.5px;color:var(--tx-2);flex:1}
.commit-item{padding:9px 0;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;font-size:12px;color:var(--tx-2)}
.commit-item .hash{font-family:var(--mono);font-size:11px;color:var(--tx-2);background:var(--s3);padding:1px 5px;border-radius:6px}
/* 层级标签 */
.layers{display:flex;gap:8px;margin-bottom:16px}
.layer-tag{padding:3px 11px;border-radius:999px;font-size:11px;border:1px solid transparent;display:inline-block}
.layer-sys,.layer-b1{background:var(--accent-bg);color:var(--accent);border-color:var(--accent-line)}
.layer-proj,.layer-b2{background:var(--ok-bg);color:var(--ok);border-color:var(--ok-line)}
.layer-plat{background:rgba(255,255,255,.05);color:var(--tx-2);border-color:var(--line)}
.layer-b3{background:var(--info-bg);color:var(--info);border-color:var(--info-line)}
.layer-b4{background:var(--warn-bg);color:var(--warn);border-color:var(--warn-line)}
.layer-b5{background:var(--zcool-bg);color:var(--zcool);border-color:var(--zcool-line)}
.footer{padding:28px 0 22px;text-align:center;font-size:11px;color:var(--tx-3);font-family:var(--mono);letter-spacing:.04em}
.footer a{color:var(--tx-2);border-bottom:1px solid var(--line-2)}
.footer a:hover{color:var(--tx)}
/* 宣言条：宋体引文，不用彩色侧边条 */
.credo{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:20px 22px;margin-bottom:24px}
.credo p{font-family:var(--serif);font-size:14.5px;color:var(--tx-2);line-height:1.9}
.credo strong{color:var(--accent);font-weight:600}
/* 长期目标：AI原生五维 */
.lt-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.lt-dim-card{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:16px 20px;display:flex;gap:20px;align-items:stretch;transition:border-color .15s ease-out}
.lt-dim-card:hover{border-color:var(--line-2)}
/* 无子条目时收成单行（诚实占位，不伪造数据） */
.lt-dim-card--empty{padding:11px 20px;align-items:center}
.lt-dim-card--empty .lt-left{width:auto;flex-direction:row;gap:10px;padding:0}
.lt-dim-card--empty .lt-dim-icon{width:28px;height:28px;font-size:14px;border-radius:6px}
.lt-dim-card--empty .lt-dim-item{border-bottom:none;padding:0;gap:10px;width:100%}
.lt-dim-card--empty .lt-item-name{color:var(--tx);font-weight:500}
.lt-dim-card--empty .lt-item-note{color:var(--tx-3);font-family:var(--mono);font-size:10px}
.lt-left{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;flex-shrink:0;width:78px;text-align:center;padding-top:2px}
.lt-dim-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--s2);border:1px solid var(--line);border-radius:6px}
.lt-dim-label{font-size:12.5px;font-weight:600;color:var(--tx);margin:8px 0 3px}
.lt-dim-vision{font-size:10px;color:var(--tx-3);line-height:1.5}
.lt-right{flex:1;min-width:0;display:flex;flex-direction:column;gap:0}
.lt-dim-item{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 0;border-bottom:1px dashed var(--line)}
.lt-dim-item:last-child{border-bottom:none}
.lt-item-name{color:var(--tx-2);white-space:nowrap}
.lt-item-tag{font-family:var(--mono);font-size:10px;color:var(--tx-3);background:var(--s2);border:1px solid var(--line);padding:1px 7px;border-radius:999px;white-space:nowrap}
.lt-item-note{font-size:10px;color:var(--tx-3);margin-left:auto;text-align:right}
.lt-right-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.lt-dim-status{font-family:var(--mono);font-size:10px;color:var(--tx-3);background:var(--s2);border:1px solid var(--line);padding:1px 8px;border-radius:999px}
/* 战略定位三角 */
.st-box{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:20px;margin-bottom:20px}
.st-title{font-size:13.5px;font-weight:600;color:var(--tx);margin-bottom:14px;letter-spacing:.01em}
.st-circles{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.scircle{flex:1;min-width:170px;background:var(--s2);border:1px solid var(--line);border-radius:var(--r-s);padding:14px;text-align:center}
.ic-emoji{font-size:18px;margin-bottom:6px;opacity:.9}
.ic-label{font-size:12px;font-weight:600;color:var(--tx);margin-bottom:5px}
.ic-text{font-size:11.5px;color:var(--tx-2);line-height:1.6}
.st-formula{font-family:var(--mono);font-size:11px;color:var(--tx-3);font-style:normal}
.icircle{flex:1;min-width:150px;background:var(--s2);border:1px solid var(--line);border-radius:var(--r-s);padding:13px;text-align:center}
.intersection-box{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:18px;margin-bottom:20px}
.intersection-title{font-size:13.5px;font-weight:600;color:var(--tx);margin-bottom:12px}
.intersection-circles{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.intersection-core{font-size:13.5px;color:var(--tx);margin-bottom:8px;padding:11px 13px;background:var(--accent-bg);border:1px solid var(--accent-line);border-radius:var(--r-s)}
.intersection-formula{font-family:var(--mono);font-size:11px;color:var(--tx-3);font-style:normal}
/* PNAS 折叠 */
.pnas-toggle{display:inline-flex;align-items:center;gap:6px;background:var(--s2);border:1px solid var(--line);color:var(--tx-2);padding:5px 11px;border-radius:var(--r-s);font-size:11.5px;cursor:pointer;margin-top:11px;font-family:inherit;transition:all .15s ease-out}
.pnas-toggle:hover{background:var(--s3);color:var(--tx)}
.pnas-block{margin-top:10px;border:1px solid var(--line);border-radius:var(--r-s);overflow:hidden}
.pnas-row{display:flex;font-size:12px;border-bottom:1px solid var(--line)}
.pnas-row:last-child{border-bottom:none}
.pnas-step{min-width:58px;padding:9px 11px;background:var(--s2);color:var(--tx-3);font-weight:500;font-size:10.5px;font-family:var(--mono)}
.pnas-content{padding:9px 11px;color:var(--tx-2);line-height:1.65;flex:1}
/* ABC 筛选 + 能量推荐 */
.abc-filter{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.abc-tag{padding:5px 13px;border-radius:999px;font-size:12px;cursor:pointer;border:1px solid var(--line-2);background:var(--s1);color:var(--tx-2);font-family:inherit;transition:all .15s ease-out}
.abc-tag:hover{color:var(--tx);background:var(--s2)}
.abc-tag.active-a{background:var(--accent-bg);border-color:var(--accent-line);color:var(--accent)}
.abc-tag.active-b{background:var(--warn-bg);border-color:var(--warn-line);color:var(--warn)}
.abc-tag.active-c{background:rgba(255,255,255,.05);border-color:var(--line-2);color:var(--tx)}
.recommend-box{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-m);padding:16px;margin-bottom:18px}
.recommend-header{font-size:13px;font-weight:600;color:var(--tx);margin-bottom:10px}
.recommend-item{padding:9px 12px;background:var(--s2);border:1px solid var(--line);border-radius:var(--r-s);margin-bottom:6px;font-size:12.5px;color:var(--tx-2);display:flex;align-items:center;gap:8px}
.recommend-item:last-child{margin-bottom:0}
.badge-abc{padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;display:inline-block;border:1px solid transparent}
.badge-abc-A{background:var(--accent-bg);color:var(--accent);border-color:var(--accent-line)}
.badge-abc-B{background:var(--warn-bg);color:var(--warn);border-color:var(--warn-line)}
.badge-abc-C{background:rgba(255,255,255,.04);color:var(--tx-3);border-color:var(--line)}
.badge-energy{padding:1px 7px;border-radius:999px;font-size:10px;font-weight:500;display:inline-block;border:1px solid transparent}
.badge-energy-high{background:var(--accent-bg);color:var(--accent);border-color:var(--accent-line)}
.badge-energy-mid{background:var(--warn-bg);color:var(--warn);border-color:var(--warn-line)}
.badge-energy-low{background:var(--ok-bg);color:var(--ok);border-color:var(--ok-line)}
/* 按钮 */
.btn{display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:var(--r-s);font-size:12.5px;cursor:pointer;border:1px solid var(--line-2);background:var(--s1);color:var(--tx-2);font-family:inherit;transition:all .15s ease-out;box-shadow:var(--shadow)}
.btn:hover{background:var(--s2);color:var(--tx)}
.btn .ico{width:14px;height:14px;opacity:.8}
.btn-primary{border-color:var(--accent-line);color:var(--accent);background:var(--accent-bg)}
.btn-primary:hover{background:rgba(255,107,107,.17);color:var(--accent)}
/* 提示条 / 弹窗 */
.toast{position:fixed;top:18px;right:18px;background:var(--s1);border:1px solid var(--line-2);border-radius:var(--r-m);padding:14px 18px;color:var(--tx);font-size:13px;z-index:300;opacity:0;transform:translateY(-8px);transition:all .35s var(--ease);max-width:380px;box-shadow:0 12px 32px rgba(0,0,0,.45)}
.toast.show{opacity:1;transform:none}
.toast.ok{border-color:var(--ok-line)}
.toast.err{border-color:var(--accent-line)}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(4,5,7,.72);backdrop-filter:blur(3px);z-index:200;display:none;justify-content:center;align-items:center;padding:20px}
.modal-overlay.show{display:flex;animation:fadeIn .18s ease-out}
.modal{background:var(--s1);border:1px solid var(--line-2);border-radius:var(--r-l);padding:26px;width:90%;max-width:600px;max-height:85vh;overflow-y:auto;box-shadow:0 18px 48px rgba(0,0,0,.5)}
.modal h2{color:var(--tx);font-size:17px;font-weight:600;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--line);letter-spacing:.01em;font-family:var(--serif)}
.modal label{display:block;color:var(--tx-3);font-size:11px;margin:12px 0 5px;font-family:var(--mono);letter-spacing:.04em}
.modal input,.modal textarea,.modal select{width:100%;padding:9px 11px;background:var(--bg);border:1px solid var(--line-2);border-radius:var(--r-s);color:var(--tx);font-size:13px;font-family:inherit;resize:vertical}
.modal input:focus,.modal textarea:focus,.modal select:focus{outline:none;border-color:var(--accent-line);box-shadow:0 0 0 3px var(--accent-bg)}
.modal textarea{min-height:70px}
.modal select{appearance:none}
.modal .btn-row{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
/* 页签 */
.sub-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.sub-tab{display:inline-flex;align-items:center;gap:5px;padding:5px 13px;font-size:12px;color:var(--tx-2);cursor:pointer;background:transparent;border:1px solid var(--line);border-radius:999px;transition:all .15s ease-out;font-family:inherit}
.sub-tab:hover{color:var(--tx);background:var(--s1)}
.sub-tab.active{color:var(--accent);background:var(--accent-bg);border-color:var(--accent-line)}
.sub-count{font-family:var(--mono);font-size:10px;color:var(--tx-3);margin-left:1px}
.sub-tab.active .sub-count{color:var(--accent);opacity:.75}
/* 任务操作 */
.task-actions{display:flex;gap:5px;white-space:nowrap}
.task-btn{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border-radius:var(--r-s);font-size:11px;cursor:pointer;border:1px solid var(--line);background:var(--s1);color:var(--tx-3);font-family:inherit;transition:all .15s ease-out}
.task-btn:hover{border-color:var(--line-2);color:var(--tx);background:var(--s2)}
.task-btn.done:hover{background:var(--ok-bg);border-color:var(--ok-line);color:var(--ok)}
.task-btn.cancel:hover{background:var(--accent-bg);border-color:var(--accent-line);color:var(--accent)}
.task-btn.loading{opacity:.45;pointer-events:none}
/* PAT 设置面板 */
.token-setup{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:11px 14px;background:var(--s1);border:1px dashed var(--accent-line);border-radius:var(--r-s);font-size:12px;color:var(--tx-2)}
.token-setup input{flex:1;padding:6px 10px;background:var(--bg);border:1px solid var(--line-2);border-radius:var(--r-s);color:var(--tx);font-size:12px;font-family:var(--mono)}
.token-setup button{padding:6px 12px;border-radius:var(--r-s);font-size:11.5px;cursor:pointer;border:1px solid var(--accent-line);background:var(--accent-bg);color:var(--accent);font-family:inherit;white-space:nowrap;transition:background .15s ease-out}
.token-setup button:hover{background:rgba(255,107,107,.18)}
.token-help{font-size:10.5px;color:var(--tx-3);margin-bottom:12px}
.token-help a{color:var(--tx-2);border-bottom:1px solid var(--line-2)}
/* file:// 打开时的常驻指引（仅 file 协议出现） */
.file-warn{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 18px;padding:10px 14px;background:var(--warn-bg);border:1px solid var(--warn-line);border-radius:var(--r-s);font-size:12px;color:var(--warn)}
.file-warn strong{font-weight:600}
.file-warn span{color:var(--tx-2)}
.file-warn a{color:var(--tx);border-bottom:1px solid var(--line-2)}
/* 板块独立盘入口（由 dashboard-server 注入，静态产物不含） */
.board-entry{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:28px;padding-top:16px;border-top:1px solid var(--line)}
.be-label{font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:var(--tx-3);margin-right:2px}
.be-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;font-size:12px;color:var(--tx-2);background:var(--s1);border:1px solid var(--line);border-radius:999px;transition:all .15s ease-out}
.be-chip:hover{color:var(--tx);background:var(--s2);border-color:var(--line-2)}
@media (max-width:1000px){
  .topbar-inner{padding:10px 16px;gap:10px}
  .brand{order:1}
  .top-actions{order:2;margin-left:auto}
  .topnav{order:3;width:100%;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}
  .topnav::-webkit-scrollbar{height:0}
  .main{padding:18px 16px 40px}
}
</style>
</head>
<body>
<div class="app">
<div class="topbar">
  <div class="topbar-inner">
    <div class="brand">
      <h1>造化坊</h1>
      <div class="brand-en">CREATION FORGE</div>
    </div>
    <nav class="topnav">
    <button class="tab" onclick="switchTab('boards',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>板块</button>
    <button class="tab active" onclick="switchTab('personal-tasks',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.6 1.6L8.1 4.6"/><path d="M3.5 12l1.6 1.6L8.1 10.6"/><path d="M3.5 18l1.6 1.6L8.1 16.6"/></svg>任务</button>
    <button class="tab" onclick="switchTab('goals',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>目标</button>
    <button class="tab" onclick="switchTab('projects',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l8 4.4-8 4.4-8-4.4 8-4.4z"/><path d="M4 12.2l8 4.4 8-4.4"/><path d="M4 16.5l8 4.3 8-4.3"/></svg>项目</button>
    <button class="tab" onclick="switchTab('workflows',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="12" r="2.6"/><path d="M6 8.6v6.8"/><path d="M8.6 6h4.4a2.5 2.5 0 012.5 2.5v.9"/></svg>工作流</button>
    <button class="tab" onclick="switchTab('guides',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.6A2.6 2.6 0 016.6 3H19v15.4H6.6A2.6 2.6 0 004 21V5.6z"/><path d="M4 18.4A2.6 2.6 0 016.6 15.8H19"/></svg>知识库</button>
    <button class="tab" onclick="switchTab('assets',this)"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.2-5.4 6.2-10.2A6.2 6.2 0 105.8 10.8C5.8 15.6 12 21 12 21z"/><circle cx="12" cy="10.6" r="2.3"/></svg>资产地址</button>
    </nav>
    <div class="top-actions">
    <button class="btn" onclick="openIssues()" title="系统诊断问题"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.6"/><path d="M15.8 15.8L20.5 20.5"/></svg>系统问题</button>
    <button class="btn" onclick="openAiSuggest()" title="AI 方向建议"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.5 3.5l1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8L4.9 10l4.8-1.7 1.8-4.8z"/><path d="M18 15.8l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></svg>AI 建议</button>
    <button class="btn btn-primary" onclick="openRecentLogs()" title="查看近期工作日志"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3h7.2L18 7.3V21H6.5z"/><path d="M13.6 3v4.4H18"/><path d="M9.4 12.4h5.6M9.4 16.2h5.6"/></svg>近期日志</button>
    <button class="btn" onclick="archiveTasks(this)" title="将已完成/已取消移入本周归档（本地）"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.4" y="4.2" width="17.2" height="4.2" rx="1.3"/><path d="M5.2 8.4v11.1a1.3 1.3 0 001.3 1.3h11a1.3 1.3 0 001.3-1.3V8.4"/><path d="M10.2 12.6h3.6"/></svg>周度归档<span id="archive-badge" style="margin-left:4px;color:#ffd93d;font-size:11px"></span></button>
    </div>
  </div>
</div>
<div class="main">
<div class="page-meta"><span>${D.today} · 任务 / 目标 → 板块 → 明细 → 知识</span><span>本地服务 :3456 · 可秒完成 / 取消</span></div>

<div id="tab-boards" class="panel"><div class="section-title" style="margin:0 0 6px;padding:0;border:none">五板块总览</div><div style="font-size:11px;color:rgba(255,255,255,.3);margin-bottom:12px;line-height:1.6">板块 git 变动监控（含迁移前历史路径回溯）· 工作日志统一记录于 造化仪表盘/works/</div><div id="tbl-boards"></div><div class="section-title">近期工作日志</div><div id="tbl-recent-works"></div></div>
<div id="tab-personal-tasks" class="panel active"><div class="section-title" style="margin:0 0 16px;padding:0;border:none">个人待办</div><div class="abc-filter" id="abc-filter"><button class="abc-tag active-a" onclick="switchAbc('all',this)">全部</button><button class="abc-tag" onclick="switchAbc('A',this)">A · 要事</button><button class="abc-tag" onclick="switchAbc('B',this)">B · 紧急</button><button class="abc-tag" onclick="switchAbc('C',this)">C · 杂事</button></div><div class="sub-tabs" id="pt-sub-tabs"><button class="sub-tab active" onclick="switchPtSub('all',this)">全部<span class="sub-count" id="pt-count-all"></span></button><button class="sub-tab" style="color:#4caf50" onclick="switchPtSub('D',this)">🏢 主美<span class="sub-count" id="pt-count-D"></span></button><button class="sub-tab" style="color:#ff9800" onclick="switchPtSub('X',this)">📱 小红书<span class="sub-count" id="pt-count-X"></span></button><button class="sub-tab" style="color:#42a5f5" onclick="switchPtSub('G',this)">🎮 游戏<span class="sub-count" id="pt-count-G"></span></button><button class="sub-tab" style="color:#ce93d8" onclick="switchPtSub('F',this)">🔧 造化坊<span class="sub-count" id="pt-count-F"></span></button><button class="sub-tab" style="color:#78909c" onclick="switchPtSub('L',this)">🏠 日常<span class="sub-count" id="pt-count-L"></span></button></div><div id="tbl-personal-tasks"></div><div class="section-title" style="cursor:pointer;user-select:none" onclick="toggleArchive()">周度归档 <span style="font-size:12px;color:rgba(255,255,255,.35)" id="archive-toggle">▶ 展开</span></div><div id="archive-section" style="display:none"></div></div>
<div id="tab-projects" class="panel"><div class="section-title">活跃项目</div><div id="tbl-projects"></div></div>
<div id="tab-workflows" class="panel"><div class="layers"><span class="layer-tag layer-b3">板块3 知识库统一管理 · 过程归系统，产出归项目</span></div><div class="sub-tabs" id="wf-sub-tabs"><button class="sub-tab active" onclick="switchWfSub('all',this)">全部<span class="sub-count" id="wf-count-all"></span></button><button class="sub-tab" onclick="switchWfSub('自媒体',this)">自媒体<span class="sub-count" id="wf-count-zimeiti"></span></button><button class="sub-tab" onclick="switchWfSub('游戏开发',this)">游戏开发<span class="sub-count" id="wf-count-gamedev"></span></button><button class="sub-tab" onclick="switchWfSub('skill',this)">SKILL仓库<span class="sub-count" id="wf-count-skill"></span></button></div><div id="tbl-workflows"></div></div>
<div id="tab-goals" class="panel"><div class="section-title">长期目标 · AI 原生五维关注</div><div id="tbl-longterm"></div><div class="section-title">季度项目 · PNAS 驱动</div><div id="tbl-quarterly-goals"></div><div class="section-title" onclick="document.getElementById('goals-archived').classList.toggle('hidden');this.classList.toggle('collapsed')" style="cursor:pointer;user-select:none">已归档目标 <span style="font-size:11px;color:rgba(255,255,255,.3)">（点击展开）</span></div><div id="goals-archived" class="hidden"><div id="tbl-goals-archived"></div></div></div>
<div id="tab-guides" class="panel"><div class="section-title">工具知识库（docs/tool-guides/）</div><div class="credo"><p>每个工具覆盖三个维度：<strong>是什么</strong> · <strong>怎么用</strong> · <strong>AI 怎么配合</strong></p></div><div id="tbl-guides"></div></div>
<div id="tab-assets" class="panel"><div class="section-title">资产地图 · 平台层 / 板块 1–5</div><div id="tbl-assets"></div><div class="section-title">外部平台</div><div id="tbl-external"></div></div>

<footer class="footer">造化坊 (Creation Forge) · 生成于 ${D.today} · <a href="https://github.com/g676967453-blip/creation-forge" target="_blank">GitHub</a></footer>
</div><!-- .main -->
</div><!-- .app -->

<div id="toast" class="toast"></div>

<div id="issues-overlay" class="modal-overlay" onclick="if(event.target===this)closeIssues()">
<div class="modal" style="max-width:700px">
  <h2>系统问题 · AI 诊断</h2>
  <div id="issues-body" style="max-height:60vh;overflow-y:auto"></div>
  <p style="color:rgba(255,255,255,.3);font-size:12px;margin-top:12px">💡 在对话中说「检查系统问题」触发诊断 · 由 <code>/goals</code> → 进展追踪自动更新</p>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeIssues()">关闭</button>
  </div>
</div>
</div>

<div id="ai-suggest-overlay" class="modal-overlay" onclick="if(event.target===this)closeAiSuggest()">
<div class="modal" style="max-width:700px">
  <h2>AI 大方向建议</h2>
  <div id="ai-suggest-body" style="max-height:60vh;overflow-y:auto"></div>
  <p style="color:rgba(255,255,255,.3);font-size:12px;margin-top:12px">💡 在对话中说「给建议」或「AI 你觉得下一步该做什么」触发 AI 建议</p>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeAiSuggest()">关闭</button>
  </div>
</div>
</div>

<div id="recent-logs-overlay" class="modal-overlay" onclick="if(event.target===this)closeRecentLogs()">
<div class="modal" style="max-width:700px">
  <h2>近期工作日志 · works/</h2>
  <div id="recent-logs-body" style="max-height:60vh;overflow-y:auto"></div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeRecentLogs()">关闭</button>
  </div>
</div>
</div>

<div id="guide-overlay" class="modal-overlay" onclick="if(event.target===this)closeGuideModal()">
<div class="modal">
  <h2>个人待办 · 操作说明</h2>
  <div style="color:rgba(255,255,255,.7);font-size:13px;line-height:2">
    <p>在 Claude Code 对话中，用自然语言管理待办：</p>
    <table class="tbl" style="margin:12px 0"><thead><tr><th>操作</th><th>示例</th></tr></thead><tbody>
      <tr><td><strong>手动添加</strong></td><td style="color:#ff6b6b">「添加任务：外包审核，周五前完成，高优先级」</td></tr>
      <tr><td><strong>查看待办</strong></td><td style="color:#ff6b6b">「我的待办」或「今天做什么」</td></tr>
      <tr><td><strong>完成任务</strong></td><td style="color:#ff6b6b">「完成 F-001」或「F-001做完了」</td></tr>
      <tr><td><strong>取消任务</strong></td><td style="color:#ff6b6b">「取消 F-001」</td></tr>
      <tr><td><strong>扫描提取</strong></td><td style="color:#ff6b6b">「扫描待办」或「提取任务」</td></tr>
      <tr><td><strong>确认导入</strong></td><td style="color:#ff6b6b">「导入 1,3,5」或「全部导入」</td></tr>
      <tr><td><strong>周度归档</strong></td><td style="color:#ff6b6b">「归档」</td></tr>
      <tr><td><strong>刷新仪表盘</strong></td><td style="color:#ff6b6b">/update-dashboard</td></tr>
    </tbody></table>
    <p style="margin-top:12px;color:rgba(255,255,255,.4);font-size:12px">💡 分类前缀：<span style="color:#4caf50">D</span>=主美 · <span style="color:#ff9800">X</span>=小红书 · <span style="color:#42a5f5">G</span>=游戏 · <span style="color:#ce93d8">F</span>=造化坊 · <span style="color:#78909c">L</span>=日常</p>
    <p style="margin-top:4px;color:rgba(255,255,255,.4);font-size:12px">⚠️ 扫描提取流程：AI 绝不主动提取，需你发起 → AI 列候选 → 你确认 → 导入</p>
    <p style="margin-top:4px;color:rgba(255,255,255,.4);font-size:12px">📄 完整文档：<code style="color:rgba(255,255,255,.5)">docs/workflows/个人待办管理.md</code></p>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeGuideModal()">知道了</button>
  </div>
</div>
</div>

<div id="wf-detail-overlay" class="modal-overlay" onclick="if(event.target===this)closeWfDetail()">
<div class="modal">
  <h2 id="wf-detail-name"></h2>
  <div style="color:rgba(255,255,255,.7);font-size:13px;line-height:2.2" id="wf-detail-body"></div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeWfDetail()">关闭</button>
  </div>
</div>
</div>

<div id="ops-overlay" class="modal-overlay" onclick="if(event.target===this)closeOpsGuide()">
<div class="modal" style="max-width:700px">
  <h2>造化坊 · 操作说明</h2>
  <div style="color:rgba(255,255,255,.7);font-size:13px;line-height:2">
    <p style="margin-bottom:12px">在 Claude Code 对话中，用自然语言触发以下工作流。说关键词即可，无需记命令。</p>
    <div id="ops-body"></div>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeOpsGuide()">关闭</button>
  </div>
</div>
</div>

<script>
const D = ${dataJSON};

// 剥离数据中作为图标使用的前导 emoji（状态/优先级已由颜色编码，无需重复）
function stripLead(s) {
  s = String(s == null ? "" : s);
  var i = 0;
  while (i < s.length) {
    var c = s.codePointAt(i);
    var word = (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || (c >= 0x4e00 && c <= 0x9fff);
    if (word) break;
    i += (c > 0xffff) ? 2 : 1;
  }
  return s.slice(i);
}

// 本地服务提示：file:// 直接打开时相对 URL 无法解析，需指向 http 入口
function svcHint(e) {
  if (location.protocol === 'file:') {
    return '当前以 file:// 直接打开 —— 该操作需要本地服务，请访问 http://127.0.0.1:3456/';
  }
  return '请启动本地服务: npx tsx 造化仪表盘/tools/dashboard-server.ts  （' + (e && e.message ? e.message : e) + '）';
}

// file:// 打开时在内容区顶部给出常驻指引（服务模式下不出现）
(function () {
  if (location.protocol !== 'file:') return;
  var bar = document.createElement('div');
  bar.className = 'file-warn';
  bar.innerHTML = '<strong>当前以 file:// 直接打开</strong>' +
    '<span>数据是静态快照；「任务完成 / 取消」「周度归档」需经本地服务。正确入口：' +
    '<a href="http://127.0.0.1:3456/">http://127.0.0.1:3456/</a></span>';
  var main = document.querySelector('.main');
  if (main) main.insertBefore(bar, main.firstChild);
})();

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type||'');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function doRefresh() {
  try {
    const r = await fetch('/api/data');
    if (!r.ok) throw new Error(r.statusText);
    const nd = await r.json();
    toast('✅ 数据已刷新，重新渲染页面...', 'ok');
    setTimeout(() => location.reload(), 500);
  } catch(e) {
    toast(svcHint(), 'err');
  }
}

function openRecentLogs() {
  var html = '';
  D.worksData.forEach(function(w) {
    html += '<div class="log-item"><span class="log-date">'+w.date+'</span><span class="log-file">'+w.file+'</span><span class="log-desc">'+w.desc+'</span></div>';
  });
  if (!html) html = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.25)">暂无工作日志</div>';
  document.getElementById('recent-logs-body').innerHTML = html;
  document.getElementById('recent-logs-overlay').classList.add('show');
}
function closeRecentLogs() { document.getElementById('recent-logs-overlay').classList.remove('show'); }

function openIssues() {
  var sevBadge = function(s) {
    if (s.indexOf('🔴')>=0) return 'badge-active-task';
    if (s.indexOf('🟡')>=0) return 'badge-idle';
    if (s.indexOf('🟢')>=0) return 'badge-empty';
    return 'badge-empty';
  };
  document.getElementById('issues-body').innerHTML = D.goalsIssues.length
    ? '<table class="tbl"><thead><tr><th>#</th><th>问题</th><th>来源</th><th>严重度</th></tr></thead><tbody>'+
      D.goalsIssues.map(function(g){return '<tr><td>'+g.id+'</td><td>'+g.issue+'</td><td style="font-size:12px;color:rgba(255,255,255,.5)">'+g.source+'</td><td><span class="badge '+sevBadge(g.severity)+'">'+g.severity+'</span></td></tr>';}).join('')+'</tbody></table>'
    : '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.25)">✅ 暂无系统问题</div>';
  document.getElementById('issues-overlay').classList.add('show');
}
function closeIssues() { document.getElementById('issues-overlay').classList.remove('show'); }

function openAiSuggest() {
  var priBadge = function(p) {
    if (p.indexOf('🔴')>=0) return 'badge-active-task';
    if (p.indexOf('🟡')>=0) return 'badge-idle';
    if (p.indexOf('🟢')>=0) return 'badge-empty';
    return 'badge-empty';
  };
  document.getElementById('ai-suggest-body').innerHTML = D.goalsAI.length
    ? '<table class="tbl"><thead><tr><th>#</th><th>建议</th><th>详情</th><th>优先级</th></tr></thead><tbody>'+
      D.goalsAI.map(function(g){return '<tr><td>'+g.id+'</td><td><strong>'+g.suggestion+'</strong></td><td style="font-size:12px;color:rgba(255,255,255,.5)">'+g.detail+'</td><td><span class="badge '+priBadge(g.priority)+'">'+g.priority+'</span></td></tr>';}).join('')+'</tbody></table>'
    : '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.25)">🤔 暂无 AI 建议</div>';
  document.getElementById('ai-suggest-overlay').classList.add('show');
}
function closeAiSuggest() { document.getElementById('ai-suggest-overlay').classList.remove('show'); }

function openGuideModal() { document.getElementById('guide-overlay').classList.add('show'); }
function closeGuideModal() { document.getElementById('guide-overlay').classList.remove('show'); }

function openOpsGuide() {
  var wfs = D.workflows.filter(function(w) { return w.category === '造化坊'; });
  var html = '<table class="tbl"><thead><tr><th>工作流</th><th>触发方式</th><th>说明</th></tr></thead><tbody>';
  wfs.forEach(function(w) {
    html += '<tr><td><strong>'+w.name+'</strong> <span class="badge '+(w.status==='mature'?'badge-mature':'badge-active')+'">'+w.status+'</span></td><td style="color:#ff6b6b">'+w.trigger+'</td><td style="color:rgba(255,255,255,.55);font-size:12px">'+w.desc+'</td></tr>';
  });
  html += '</tbody></table>';
  document.getElementById('ops-body').innerHTML = html;
  document.getElementById('ops-overlay').classList.add('show');
}
function closeOpsGuide() { document.getElementById('ops-overlay').classList.remove('show'); }

function openWfDetail(idx) {
  var w = D.workflows[idx];
  if (!w) return;
  document.getElementById('wf-detail-name').textContent = w.name;
  var body = '';
  body += '<p><strong>版本：</strong><span class="badge badge-mature">'+w.version+'</span></p>';
  body += '<p><strong>产出简介：</strong>'+w.desc+'</p>';
  body += '<p><strong>流程环节：</strong>'+w.steps+'</p>';
  body += '<p><strong>激活规则：</strong><span style="color:#ff6b6b">'+w.trigger+'</span></p>';
  body += '<p><strong>SKILL：</strong>'+w.skill+'</p>';
  body += '<p><strong>关联项目：</strong>'+w.project+'</p>';
  document.getElementById('wf-detail-body').innerHTML = body;
  document.getElementById('wf-detail-overlay').classList.add('show');
}
function closeWfDetail() { document.getElementById('wf-detail-overlay').classList.remove('show'); }

function switchTab(name, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.topnav .tab').forEach(t => t.classList.remove('active'));
  var panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('active');
  if (el) el.classList.add('active');
}
// 全局：优先级徽章映射
const pm={"🔴 紧急":"badge-active-task","🔴 阻塞":"badge-active-task","🔴 优先":"badge-active-task","🔴 P0":"badge-active-task","🟡 本周":"badge-idle","🟡 持续":"badge-idle","🟡 累积":"badge-idle","🟡 便利性":"badge-idle","🟡 建议":"badge-idle","🟢 远期":"badge-empty","🔴 本周":"badge-active-task","✅ 已完成":"badge-done"};

// 长期目标渲染：AI原生五维关注 + 战略定位三角
function renderLongTermGoals(ltg) {
  var dims = ltg.dimensions.map(function(d) {
    // 右栏：虚线分割的条目列表
    var itemsHtml = '';
    if (d.items && d.items.length) {
      itemsHtml = d.items.map(function(it) {
        var tagHtml = it.tag ? '<span class="lt-item-tag">'+it.tag+'</span>' : '';
        var noteHtml = it.note ? '<span class="lt-item-note">'+it.note+'</span>' : '';
        return '<div class="lt-dim-item">'+
          '<span class="lt-item-name">'+it.name+'</span>'+tagHtml+noteHtml+
        '</div>';
      }).join('');
    }
    if (!itemsHtml) {
      return '<div class="lt-dim-card lt-dim-card--empty">'+
        '<div class="lt-left"><div class="lt-dim-icon">'+d.dim.substring(0,2)+'</div></div>'+
        '<div class="lt-right"><div class="lt-dim-item">'+
          '<span class="lt-item-name">'+d.dim.substring(2)+'</span>'+
          '<span class="lt-item-tag">'+d.vision+'</span>'+
          '<span class="lt-item-note">暂无条目 · 待从 目标规划.md 提取</span>'+
        '</div></div>'+
      '</div>';
    }
    return '<div class="lt-dim-card">'+
      // 左栏：图标 + 名称 + 说明（上中下）
      '<div class="lt-left">'+
        '<div class="lt-dim-icon">'+d.dim.substring(0,2)+'</div>'+
        '<div class="lt-dim-label">'+d.dim.substring(2)+'</div>'+
        '<div class="lt-dim-vision">'+d.vision+'</div>'+
      '</div>'+
      // 右栏：状态头 + 虚线列表
      '<div class="lt-right">'+
        '<div class="lt-right-header"><div></div><div class="lt-dim-status">'+d.status+'</div></div>'+
        itemsHtml +
      '</div>'+
    '</div>';
  }).join('');
  var st = ltg.strategicTriangle;
  var strategy =
    '<div class="st-box">'+
      '<div class="st-title">战略定位三角</div>'+
      '<div class="st-circles">'+
        '<div class="scircle"><div class="ic-emoji">🎯</div><div class="ic-label">价值主张</div><div class="ic-text">'+st.valueProposition+'</div></div>'+
        '<div class="scircle"><div class="ic-emoji">⚡</div><div class="ic-label">核心差异</div><div class="ic-text">'+st.differentiation+'</div></div>'+
        '<div class="scircle"><div class="ic-emoji">📈</div><div class="ic-label">增长引擎</div><div class="ic-text">'+st.growthEngine+'</div></div>'+
      '</div>'+
      '<div class="st-formula">'+ltg.formula+'</div>'+
    '</div>';
  return '<div class="lt-grid">'+dims+'</div>'+strategy;
}

// 目标卡片渲染：进度条 + 待办数 + PNAS 折叠
function renderGoalCards(goals) {
  return goals.map(function(g, i) {
    var p = g.progress || 0;
    var t = g.todos || 0;
    var barClass = p >= 80 ? 'bar-green' : p >= 50 ? 'bar-orange' : p >= 20 ? 'bar-blue' : 'bar-red';
    var hasPnas = g.pnas && g.pnas.picture;
    var todoHtml = t > 0
      ? '<span class="todo-badge has-todos">'+t+' 条待办</span>'
      : '<span class="todo-badge no-todos">—</span>';
    var pnasHtml = hasPnas
      ? '<button class="pnas-toggle" onclick="togglePnas('+i+',this)">🖼️ 展开 PNAS</button>'+
        '<div id="pnas-'+i+'" class="pnas-block hidden">'+
          '<div class="pnas-row"><span class="pnas-step">P 画面</span><span class="pnas-content">'+g.pnas.picture+'</span></div>'+
          '<div class="pnas-row"><span class="pnas-step">N 要素</span><span class="pnas-content">'+g.pnas.noun+'</span></div>'+
          '<div class="pnas-row"><span class="pnas-step">A 行动</span><span class="pnas-content">'+g.pnas.activities+'</span></div>'+
          '<div class="pnas-row"><span class="pnas-step">S 序列</span><span class="pnas-content">'+g.pnas.sequence+'</span></div>'+
        '</div>'
      : '';
    return '<div class="goal-card">'+
      '<div class="goal-header">'+
        '<span class="goal-name">'+g.task+'</span>'+
        '<span class="badge '+(pm[g.priority]||'')+'">'+stripLead(g.priority)+'</span>'+
      '</div>'+
      '<div class="goal-detail">'+g.detail+'</div>'+
      '<div class="goal-meta">'+
        '<div class="goal-progress">'+
          '<div class="bar-track"><div class="bar-fill '+barClass+'" style="width:'+p+'%"></div></div>'+
          '<div class="bar-label">进度 '+p+'%</div>'+
        '</div>'+
        todoHtml+
      '</div>'+
      pnasHtml+
    '</div>';
  }).join('');
}

// 项目卡片渲染：引擎 + 状态 + 进度 + 产出 + 阻塞
function renderProjectCards(projects) {
  var ps = {active:'badge-active',idle:'badge-idle',done:'badge-done'};
  var pst = {active:'活跃',idle:'暂停',done:'完成'};
  return projects.map(function(p) {
    return '<div class="goal-card">'+
      '<div class="goal-header">'+
        '<span class="goal-name">'+p.name+'</span>'+
        '<span class="badge '+(ps[p.status]||'badge-empty')+'">'+(pst[p.status]||p.statusText)+'</span>'+
      '</div>'+
      '<div class="goal-detail">'+p.engine+' · '+p.progress+'</div>'+
      '<div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:8px;line-height:1.5">'+
        '<div><strong>产出：</strong>'+p.output+'</div>'+
        (p.blocker !== '—' ? '<div style="margin-top:4px;color:var(--warn)"><strong>阻塞：</strong>'+p.blocker+'</div>' : '')+
      '</div>'+
    '</div>';
  }).join('');
}
(function(){
  document.getElementById('tbl-projects').innerHTML=renderProjectCards(D.projects);
})();
(function(){
  const sm={mature:'badge-mature',testing:'badge-testing',ongoing:'badge-ongoing'};
  const st={mature:'成熟',testing:'待验证',ongoing:'持续'};
  const sk = (s) => s === '—' ? '<span style="color:rgba(255,255,255,.2)">—</span>' : (s === '待建' ? '<span class="badge badge-idle">待建</span>' : '<span class="badge badge-active">'+s+'</span>');
  const catBadge = {'造化坊':'badge-ongoing','自媒体':'badge-mature','游戏开发':'badge-active-task'};

  function renderWfTable(data, mode) {
    if (mode === 'skill') {
      const stype = function(t){return t==='标准'?'<span class="badge badge-mature">标准</span>':'<span class="badge badge-active">扁平</span>';};
      const sdiff = function(d){
        if (d === 'beginner') return '<span class="badge badge-mature">入门</span>';
        if (d === 'intermediate') return '<span class="badge badge-idle">进阶</span>';
        if (d === 'advanced') return '<span class="badge badge-active-task">高级</span>';
        return '<span style="color:rgba(255,255,255,.15)">—</span>';
      };
      const swf = function(w){return w?'<span style="font-size:12px;color:rgba(255,255,255,.45)">'+w+'</span>':'<span style="color:rgba(255,255,255,.15)">—</span>';};
      const sdesc = function(d){return d?'<span style="font-size:12px;color:rgba(255,255,255,.55)" title="'+d.replace(/"/g,'&quot;')+'">'+d+'</span>':'<span style="color:rgba(255,255,255,.15)">—</span>';};
      return '<table class="tbl"><thead><tr><th>SKILL 名称</th><th>类型</th><th>难度</th><th>用途</th><th>路径</th><th>关联工作流</th></tr></thead><tbody>'+
        data.map(function(s){return '<tr><td><strong>'+s.name+'</strong></td><td>'+stype(s.type)+'</td><td>'+sdiff(s.difficulty)+'</td><td>'+sdesc(s.description)+'</td><td><code style="font-size:11px">'+s.path+'</code></td><td>'+swf(s.linkedWorkflow)+'</td></tr>';}).join('')+'</tbody></table>';
    }
    // 工作流模式：点击行弹出详情弹窗
    return '<table class="tbl"><thead><tr><th>工作流</th><th>版本</th><th>SKILL</th><th>关联项目</th><th>成熟度</th><th>分类</th></tr></thead><tbody>'+
      data.map(function(w){
        var idx = D.workflows.indexOf(w);
        return '<tr onclick="openWfDetail('+idx+')" style="cursor:pointer" title="点击查看详情"><td><strong>'+w.name+'</strong></td><td>'+w.version+'</td><td>'+sk(w.skill)+'</td><td>'+w.project+'</td><td><span class="badge '+sm[w.status]+'">'+st[w.status]+'</span></td><td><span class="badge '+(catBadge[w.category]||'')+'">'+w.category+'</span></td></tr>';
      }).join('')+'</tbody></table>';
  }

  // 排除造化坊的工作流（已迁移至「操作说明」弹窗）
  var nonSystemWf = D.workflows.filter(function(w){return w.category !== '造化坊';});

  window.switchWfSub = function(cat, el) {
    document.querySelectorAll('#wf-sub-tabs .sub-tab').forEach(function(t){t.classList.remove('active');});
    el.classList.add('active');
    var data;
    if (cat === 'all') data = nonSystemWf;
    else if (cat === 'skill') data = D.skills;
    else data = D.workflows.filter(function(w){return w.category === cat;});
    document.getElementById('tbl-workflows').innerHTML = renderWfTable(data, cat);
  };

  // 初始渲染全部（排除造化坊）+ 设置计数
  document.getElementById('tbl-workflows').innerHTML = renderWfTable(nonSystemWf, 'all');
  document.getElementById('wf-count-all').textContent = '('+nonSystemWf.length+')';
  document.getElementById('wf-count-zimeiti').textContent = '('+D.workflows.filter(function(w){return w.category==='自媒体';}).length+')';
  document.getElementById('wf-count-gamedev').textContent = '('+D.workflows.filter(function(w){return w.category==='游戏开发';}).length+')';
  document.getElementById('wf-count-skill').textContent = '('+D.skills.length+')';
})();
// 个人待办面板
(function(){
  // --- 本地任务操作（不经 GitHub；请用 dashboard-server）---
  async function updateTaskStatus(taskId, newStatus, newStatusText) {
    var endpoint = newStatus === 'done' ? '/api/tasks/complete' : (newStatus === 'cancelled' ? '/api/tasks/cancel' : null);
    if (!endpoint) { toast('不支持的状态', 'err'); return false; }
    try {
      var localRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId })
      });
      if (!localRes.ok) {
        var errBody = await localRes.json().catch(function(){ return {}; });
        throw new Error(errBody.error || ('HTTP ' + localRes.status));
      }
      var body = await localRes.json();
      if (body && body.ok) {
        if (body.personalTasks) D.personalTasks = body.personalTasks;
        return true;
      }
      throw new Error((body && body.error) || '未知错误');
    } catch (e) {
      toast(svcHint(e), 'err');
      return false;
    }
  }

  async function reloadPersonalTasksFromServer() {
    try {
      const r = await fetch('/api/data');
      if (!r.ok) return false;
      const nd = await r.json();
      if (nd && nd.personalTasks) {
        D.personalTasks = nd.personalTasks;
        return true;
      }
    } catch (e) {}
    return false;
  }

  window.completeTask = async function(taskId, catKey, btn) {
    if (btn) { btn.classList.add('loading'); btn.textContent = '...'; }
    const ok = await updateTaskStatus(taskId, 'done', '✅ 已完成');
    if (btn) { btn.classList.remove('loading'); btn.textContent = '✓'; }
    if (ok) {
      toast('✅ ' + taskId + ' 已完成', 'ok');
      await reloadPersonalTasksFromServer();
      // 就地更新内存状态后重绘
      try {
        var cats = D.personalTasks && D.personalTasks.categories || [];
        cats.forEach(function(c){
          c.tasks.forEach(function(t){
            if (t.id === taskId) { t.status = 'done'; t.statusText = '✅ 已完成'; }
          });
        });
      } catch(e){}
      refreshTaskCards();
    }
  };

  window.cancelTask = async function(taskId, catKey, btn) {
    if (!confirm('确认取消 ' + taskId + '？')) return;
    if (btn) { btn.classList.add('loading'); btn.textContent = '...'; }
    const ok = await updateTaskStatus(taskId, 'cancelled', '❌ 已取消');
    if (btn) { btn.classList.remove('loading'); btn.textContent = '✗'; }
    if (ok) {
      toast('❌ ' + taskId + ' 已取消', 'ok');
      await reloadPersonalTasksFromServer();
      try {
        var cats = D.personalTasks && D.personalTasks.categories || [];
        cats.forEach(function(c){
          c.tasks.forEach(function(t){
            if (t.id === taskId) { t.status = 'cancelled'; t.statusText = '❌ 已取消'; }
          });
        });
      } catch(e){}
      refreshTaskCards();
    }
  };

  // --- 周度归档（本地 API，不经 GitHub）---
  window.archiveTasks = async function(btn) {
    if (!confirm('将当前所有 ✅ 完成 / ❌ 已取消 的任务移至本周归档？')) return;
    if (btn) { btn.disabled = true; btn.textContent = '归档中...'; }
    try {
      var res = await fetch('/api/tasks/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) {
        var err = await res.json().catch(function(){ return {}; });
        throw new Error(err.error || ('HTTP ' + res.status));
      }
      var body = await res.json();
      if (!body.ok) throw new Error(body.error || '归档失败');
      if (body.count === 0) toast('没有需要归档的任务', '');
      else toast('✅ 已归档 ' + body.count + ' 条任务', 'ok');
      if (btn) { btn.disabled = false; btn.textContent = '📦 周度归档'; }
      setTimeout(function(){ location.reload(); }, 400);
    } catch (e) {
      toast(svcHint(e), 'err');
      if (btn) { btn.disabled = false; btn.textContent = '📦 周度归档'; }
    }
  };

  function refreshTaskCards() {
    setTimeout(function(){ location.reload(); }, 400);
  }

  // --- 个人待办面板渲染 ---
  const PT = D.personalTasks;
  const sm = {pending:'badge-planned',active:'badge-active-task',done:'badge-done',cancelled:'badge-cancelled'};
  const cats = PT.categories;

  // 待归档徽标：活跃区里已完成/已取消的任务数（提醒用户执行周度归档）
  (function(){
    var stranded = 0;
    cats.forEach(function(c){ c.tasks.forEach(function(t){ if (t.status === 'done' || t.status === 'cancelled') stranded++; }); });
    var badge = document.getElementById('archive-badge');
    if (badge && stranded > 0) badge.textContent = '(' + stranded + ' 条待归档)';
  })();

  // 全局筛选状态
  var currentAbcFilter = 'all';
  var currentPtFilter = 'all';

  // 筛选渲染（含 ABC 筛选）
  function renderPtTable(filterKey) {
    var allRows = [];
    cats.forEach(function(c){
      var tasks = filterKey === 'all' ? c.tasks : (c.key === filterKey ? c.tasks : []);
      tasks.forEach(function(t){
        // ABC 筛选
        if (currentAbcFilter !== 'all' && t.abc !== currentAbcFilter) return;
        allRows.push({cat:c, task:t});
      });
    });
    if (allRows.length === 0) {
      return '<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25);font-size:14px">暂无任务。说「添加任务」开始记录，或「扫描待办」从项目提取。</div>';
    }
    var abcBadge = function(a) {
      if (!a || a === '—') return '<span style="color:rgba(255,255,255,.15)">—</span>';
      var cls = a === 'A' ? 'badge-abc-A' : a === 'B' ? 'badge-abc-B' : 'badge-abc-C';
      return '<span class="badge-abc '+cls+'">'+a+'</span>';
    };
    return '<table class="tbl"><thead><tr><th>ID</th><th>任务</th><th>状态</th><th>ABC</th><th>截止日</th><th>备注</th><th>操作</th></tr></thead><tbody>'+
      allRows.map(function(r){
        var t = r.task;
        var dline = t.deadline === '—' ? '<span style="color:rgba(255,255,255,.2)">—</span>' : '<span style="color:#ff6b6b">'+t.deadline+'</span>';
        // 操作按钮：仅待办/进行中状态显示
        var actions = '';
        if (t.status === 'pending' || t.status === 'active') {
          actions = '<div class="task-actions">'+
            '<button class="task-btn done" onclick="completeTask(&quot;'+t.id+'&quot;,&quot;'+r.cat.key+'&quot;,this)" title="完成">✓</button>'+
            '<button class="task-btn cancel" onclick="cancelTask(&quot;'+t.id+'&quot;,&quot;'+r.cat.key+'&quot;,this)" title="取消">✗</button>'+
          '</div>';
        } else {
          actions = '<span style="color:rgba(255,255,255,.15);font-size:11px">—</span>';
        }
        return '<tr><td style="color:rgba(255,255,255,.4);font-size:12px">'+t.id+'</td><td>'+t.task+'</td><td><span class="badge '+sm[t.status]+'">'+stripLead(t.statusText)+'</span></td><td>'+abcBadge(t.abc)+'</td><td>'+dline+'</td><td style="color:rgba(255,255,255,.35);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+t.note.replace(/"/g,'&quot;')+'">'+t.note+'</td><td>'+actions+'</td></tr>';
      }).join('')+'</tbody></table>';
  }

  // 初始渲染
  document.getElementById('tbl-personal-tasks').innerHTML = renderPtTable('all');

  // 更新子页签计数
  var ptu = function(k){return (PT.stats.byCategory[k]||{pending:0,active:0,done:0});};
  var allPend = 0; cats.forEach(function(c){var s=PT.stats.byCategory[c.key];allPend+=s.pending+s.active;});
  document.getElementById('pt-count-all').textContent = '('+allPend+')';
  document.getElementById('pt-count-D').textContent = '('+(ptu('D').pending+ptu('D').active)+')';
  document.getElementById('pt-count-X').textContent = '('+(ptu('X').pending+ptu('X').active)+')';
  document.getElementById('pt-count-G').textContent = '('+(ptu('G').pending+ptu('G').active)+')';
  document.getElementById('pt-count-F').textContent = '('+(ptu('F').pending+ptu('F').active)+')';
  document.getElementById('pt-count-L').textContent = '('+(ptu('L').pending+ptu('L').active)+')';

  window.switchAbc = function(key, el) {
    document.querySelectorAll('#abc-filter .abc-tag').forEach(function(t){t.className = 'abc-tag';});
    var clsMap = {A:'active-a',B:'active-b',C:'active-c',all:'active-a'};
    el.className = 'abc-tag '+(clsMap[key]||'');
    currentAbcFilter = key;
    document.getElementById('tbl-personal-tasks').innerHTML = renderPtTable(currentPtFilter);
  };

  window.switchPtSub = function(key, el) {
    document.querySelectorAll('#pt-sub-tabs .sub-tab').forEach(function(t){t.classList.remove('active');});
    el.classList.add('active');
    currentPtFilter = key;
    document.getElementById('tbl-personal-tasks').innerHTML = renderPtTable(key);
  };

  // PNAS 折叠
  window.togglePnas = function(i, btn) {
    var el = document.getElementById('pnas-'+i);
    if (el) {
      el.classList.toggle('hidden');
      btn.textContent = el.classList.contains('hidden') ? '展开 PNAS' : '收起 PNAS';
    }
  };

  // 归档折叠
  window.toggleArchive = function() {
    var sec = document.getElementById('archive-section');
    var tog = document.getElementById('archive-toggle');
    if (sec.style.display === 'none') {
      // 首次展开时渲染
      if (!sec.dataset.rendered) {
        var html = '';
        PT.archives.forEach(function(a){
          html += '<div class="section-title" style="margin-bottom:4px">'+a.week+'</div>';
          if (a.entries.length === 0) {
            html += '<div style="padding:12px 14px;color:rgba(255,255,255,.2);font-size:13px">暂无归档</div>';
          } else {
            html += '<table class="tbl"><thead><tr><th>来源</th><th>ID</th><th>任务</th><th>完成日</th><th>耗时</th></tr></thead><tbody>'+
              a.entries.map(function(e){return '<tr><td>'+e.source+'</td><td style="color:rgba(255,255,255,.4);font-size:12px">'+e.id+'</td><td>'+e.task+'</td><td>'+e.completedDate+'</td><td>'+stripLead(e.hours)+'</td></tr>';}).join('')+'</tbody></table>';
          }
        });
        sec.innerHTML = html;
        sec.dataset.rendered = '1';
      }
      sec.style.display = 'block';
      tog.textContent = '▼ 收起';
    } else {
      sec.style.display = 'none';
      tog.textContent = '▶ 展开';
    }
  };
})();
// B4: 五板块总览渲染
(function(){
  const stCls = {活跃:'badge-active',平静:'badge-idle'};
  const stTxt = {活跃:'● 活跃',平静:'○ 平静'};
  const esc = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  const cards = D.boards.map(function(b){
    var commits = (b.recentCommits||[]).map(function(c){
      return '<div><span class="hash">'+esc(c.hash)+'</span>'+esc(c.date)+' · '+esc(c.msg)+'</div>';
    }).join('');
    if (!commits) commits = '<div style="color:rgba(255,255,255,.15)">暂无提交记录</div>';
    var dirTxt = b.dir + '/ · 共 ' + (b.commitTotal||0) + ' 提交 · 最近工作 ' + (b.lastWorkDate||'—');
    var dirtyHtml = (b.uncommitted > 0) ? '<div class="bd-dirty">' + b.uncommitted + ' 条未提交变动</div>' : '';
    return '<div class="board-card">'+
      '<div class="bd-head"><span class="bd-emoji">'+b.emoji+'</span><span class="bd-name">'+esc(b.name)+'</span><span class="badge '+(stCls[b.status]||'badge-empty')+'">'+(stTxt[b.status]||b.status)+'</span></div>'+
      '<div class="bd-dir">'+esc(dirTxt)+'</div>'+
      '<div class="bd-desc">'+esc(b.desc)+'</div>'+
      dirtyHtml+
      '<div class="bd-commits">'+commits+'</div>'+
    '</div>';
  }).join('');
  document.getElementById('tbl-boards').innerHTML = '<div class="board-grid">'+cards+'</div>';

  // 近期工作日志（最新 8 条）
  var logs = (D.worksData||[]).slice(0,8).map(function(w){
    return '<div class="log-item"><span class="log-date">'+esc(w.date)+'</span><span class="log-file">'+esc(w.file)+'</span><span class="log-desc">'+esc(w.desc)+'</span></div>';
  }).join('');
  document.getElementById('tbl-recent-works').innerHTML = logs || '<div style="padding:14px;color:rgba(255,255,255,.25)">暂无工作日志</div>';
})();
(function(){
  const rt=(d,c)=>'<table class="tbl"><thead><tr>'+c.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+d.map(r=>'<tr>'+r.map((v,i)=>i===c.length-1?'<td><span class="badge '+(pm[v]||'')+'">'+stripLead(v)+'</span></td>':'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  document.getElementById('tbl-longterm').innerHTML=renderLongTermGoals(D.longTermGoals);
  document.getElementById('tbl-quarterly-goals').innerHTML=renderGoalCards(D.goalsUser);
  document.getElementById('tbl-goals-archived').innerHTML=D.goalsArchived.map(g=>
    '<div class="goal-card" style="opacity:.6">'+
      '<div class="goal-header">'+
        '<span class="goal-name" style="text-decoration:line-through;text-decoration-color:rgba(76,175,80,.3)">'+g.task+'</span>'+
        '<span class="badge badge-done">✅ '+g.completedDate+'</span>'+
      '</div>'+
      '<div class="goal-detail">'+g.detail+'</div>'+
    '</div>'
  ).join('');
})();
(function(){
  document.getElementById('tbl-guides').innerHTML='<table class="tbl"><thead><tr><th>工具</th><th>说明</th><th>介绍</th><th>操作</th><th>人机协作</th><th>文档数</th></tr></thead><tbody>'+
    D.toolGuides.map(g=>'<tr><td><strong>'+g.tool+'</strong></td><td>'+g.desc+'</td><td>'+g.intro+'</td><td>'+g.ops+'</td><td>'+g.collab+'</td><td>'+g.docs+'</td></tr>').join('')+'</tbody></table>';
})();
(function(){
  const lm={平台层:'layer-plat',板块1:'layer-b1',板块2:'layer-b2',板块3:'layer-b3',板块4:'layer-b4',板块5:'layer-b5',系统层:'layer-sys',项目层:'layer-proj'};
  document.getElementById('tbl-assets').innerHTML='<table class="tbl"><thead><tr><th>层级</th><th>名称</th><th>路径</th><th>说明</th></tr></thead><tbody>'+
    D.assets.map(a=>'<tr><td><span class="layer-tag '+(lm[a.layer]||'')+'">'+a.layer+'</span></td><td><strong>'+a.name+'</strong></td><td><code>'+a.path+'</code></td><td>'+a.desc+'</td></tr>').join('')+'</tbody></table>';
  document.getElementById('tbl-external').innerHTML='<table class="tbl"><thead><tr><th>类别</th><th>名称</th><th>地址</th><th>说明</th></tr></thead><tbody>'+
    D.external.map(e=>'<tr><td>'+e.cat+'</td><td>'+e.name+'</td><td><code>'+e.addr+'</code></td><td>'+e.desc+'</td></tr>').join('')+'</tbody></table>';
})();

</script>
</body>
</html>`;
}

// CLI 模式：直接生成静态文件
if (require.main === module) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, generateHTML(), "utf-8");
  console.log(`✅ 仪表盘已生成: ${OUT_FILE}`);
}
