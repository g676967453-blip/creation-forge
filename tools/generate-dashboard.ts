/**
 * 造化坊仪表盘生成器
 * 生成独立 HTML 文件（7 Tab 切页，暗色系）
 *
 * 使用: npx tsx tools/generate-dashboard.ts
 * 输出: reports/造化坊仪表盘.html
 */

import * as fs from "fs";
import * as path from "path";
import { collectData } from "./collect-data";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "reports");
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
*{margin:0;padding:0;box-sizing:border-box}
body{background:#141414;color:#e0e0e0;font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh}
.container{max-width:1200px;margin:0 auto;padding:24px}
header{padding:32px 0 20px}
header h1{font-size:28px;font-weight:700;color:#fff}
header .sub{font-size:14px;color:rgba(255,255,255,.4);margin-top:4px}
.tabs{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:24px;flex-wrap:wrap}
.tab{padding:12px 20px;font-size:13px;color:rgba(255,255,255,.45);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit}
.tab:hover{color:rgba(255,255,255,.7)}
.tab.active{color:#ff6b6b;border-bottom-color:#ff6b6b}
.panel{display:none}
.panel.active{display:block}

.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:24px}
.card{background:#1a1a1a;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:18px}
.card .label{font-size:12px;color:rgba(255,255,255,.4);margin-bottom:6px}
.card .value{font-size:28px;font-weight:700;color:#ff6b6b}
.card .detail{font-size:11px;color:rgba(255,255,255,.3);margin-top:4px}

.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;padding:10px 14px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.5);font-weight:500;font-size:12px}
.tbl td{padding:10px 14px;border-top:1px solid rgba(255,255,255,.05)}
.tbl tr:hover td{background:rgba(255,255,255,.02)}
.badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:500;display:inline-block;white-space:nowrap}
.badge-active{background:rgba(76,175,80,.15);color:#4caf50}
.badge-idle{background:rgba(255,193,7,.15);color:#ffc107}
.badge-empty{background:rgba(255,255,255,.06);color:rgba(255,255,255,.3)}
.badge-done{background:rgba(76,175,80,.15);color:#4caf50}
.badge-active-task{background:rgba(255,152,0,.15);color:#ff9800}
.badge-planned{background:rgba(156,39,176,.15);color:#ce93d8}
.badge-mature{background:rgba(76,175,80,.15);color:#4caf50}
.badge-testing{background:rgba(255,193,7,.15);color:#ffc107}
.badge-ongoing{background:rgba(33,150,243,.15);color:#42a5f5}
.badge-cancelled{background:rgba(255,255,255,.06);color:rgba(255,255,255,.35)}
.badge-prio-high{background:rgba(244,67,54,.15);color:#ef5350}
.badge-prio-mid{background:rgba(255,193,7,.15);color:#ffc107}
.badge-prio-low{background:rgba(76,175,80,.15);color:#4caf50}

.goal-card{background:#1a1a1a;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:18px;margin-bottom:12px}
.goal-card .goal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.goal-card .goal-name{font-size:15px;font-weight:600;color:#fff}
.goal-card .goal-detail{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:12px;line-height:1.5}
.goal-card .goal-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.goal-progress{flex:1;min-width:120px}
.goal-progress .bar-track{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;margin-bottom:4px}
.goal-progress .bar-fill{height:100%;border-radius:3px;transition:width .3s}
.goal-progress .bar-label{font-size:11px;color:rgba(255,255,255,.35)}
.bar-fill.bar-green{background:#4caf50}
.bar-fill.bar-orange{background:#ff9800}
.bar-fill.bar-blue{background:#42a5f5}
.bar-fill.bar-red{background:#ef5350}
.todo-badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px}
.todo-badge.has-todos{background:rgba(33,150,243,.12);color:#42a5f5}
.todo-badge.no-todos{background:rgba(255,255,255,.04);color:rgba(255,255,255,.25)}
.hidden{display:none}
.section-title.collapsed{opacity:.5}

.log-item{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:14px;align-items:flex-start}
.log-item .log-date{font-size:12px;color:rgba(255,255,255,.35);min-width:80px}
.log-item .log-file{font-size:13px;color:#fff;min-width:260px}
.log-item .log-desc{font-size:13px;color:rgba(255,255,255,.55);flex:1}
.commit-item{padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:12px;align-items:center;font-size:12px}
.commit-item .hash{font-family:monospace;color:#ff6b6b}

.section-title{font-size:16px;color:#fff;margin:20px 0 12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
.layers{display:flex;gap:8px;margin-bottom:16px}
.layer-tag{padding:4px 12px;border-radius:4px;font-size:11px}
.layer-sys{background:rgba(255,107,107,.1);color:#ff6b6b}
.layer-proj{background:rgba(76,175,80,.1);color:#4caf50}
.footer{padding:40px 0 20px;text-align:center;font-size:12px;color:rgba(255,255,255,.2)}
.footer a{color:rgba(255,255,255,.3)}

.credo{background:linear-gradient(135deg,rgba(255,107,107,.08),rgba(255,107,107,.02));border:1px solid rgba(255,107,107,.12);border-radius:10px;padding:18px;margin-bottom:24px}
.credo p{font-size:14px;color:rgba(255,255,255,.7);line-height:1.8}
.credo strong{color:#ff6b6b}

/* 长期目标：AI原生五维 — 横板全宽 · 左右构图 */
.lt-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.lt-dim-card{background:#1a1a1a;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:16px 20px;display:flex;gap:20px;align-items:stretch}
/* 左栏：图标 + 名称 + 说明（上中下） */
.lt-left{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;flex-shrink:0;width:72px;text-align:center;padding-top:2px}
.lt-dim-icon{font-size:24px;line-height:1}
.lt-dim-label{font-size:13px;font-weight:600;color:#fff;margin:4px 0}
.lt-dim-vision{font-size:10px;color:rgba(255,255,255,.35);line-height:1.4}
/* 右栏：虚线分割列表 */
.lt-right{flex:1;min-width:0;display:flex;flex-direction:column;gap:0}
.lt-dim-item{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.06)}
.lt-dim-item:last-child{border-bottom:none}
.lt-item-name{color:rgba(255,255,255,.7);white-space:nowrap}
.lt-item-tag{font-size:10px;color:rgba(255,255,255,.4);background:rgba(255,255,255,.05);padding:1px 7px;border-radius:8px;white-space:nowrap}
.lt-item-note{font-size:10px;color:rgba(255,255,255,.25);margin-left:auto;text-align:right}
/* 右栏顶部状态行 */
.lt-right-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.lt-dim-status{font-size:10px;color:rgba(255,255,255,.3);background:rgba(255,255,255,.04);padding:1px 8px;border-radius:10px}

/* 战略定位三角 */
.st-box{background:linear-gradient(135deg,rgba(66,165,245,.08),rgba(66,165,245,.02));border:1px solid rgba(66,165,245,.12);border-radius:10px;padding:20px;margin-bottom:20px}
.st-title{font-size:15px;font-weight:600;color:#42a5f5;margin-bottom:14px}
.st-circles{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.scircle{flex:1;min-width:160px;background:rgba(0,0,0,.2);border-radius:8px;padding:14px;text-align:center}
.ic-emoji{font-size:24px;margin-bottom:4px}
.ic-label{font-size:12px;font-weight:600;color:#fff;margin-bottom:4px}
.ic-text{font-size:12px;color:rgba(255,255,255,.5);line-height:1.4}
.st-formula{font-size:12px;color:rgba(255,255,255,.35);font-style:italic}
/* 保留 icircle 用于向后兼容 */
.icircle{flex:1;min-width:140px;background:rgba(0,0,0,.2);border-radius:8px;padding:12px;text-align:center}
.intersection-box{background:linear-gradient(135deg,rgba(255,107,107,.08),rgba(255,107,107,.02));border:1px solid rgba(255,107,107,.12);border-radius:10px;padding:18px;margin-bottom:20px}
.intersection-title{font-size:15px;font-weight:600;color:#ff6b6b;margin-bottom:12px}
.intersection-circles{display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.intersection-core{font-size:14px;color:#fff;margin-bottom:8px;padding:10px;background:rgba(255,107,107,.1);border-radius:6px}
.intersection-formula{font-size:12px;color:rgba(255,255,255,.35);font-style:italic}

/* PNAS 折叠 */
.pnas-toggle{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5);padding:4px 12px;border-radius:6px;font-size:12px;cursor:pointer;margin-top:10px;font-family:inherit;transition:all .2s}
.pnas-toggle:hover{background:rgba(255,255,255,.08);color:#fff}
.pnas-block{margin-top:10px;border:1px solid rgba(255,255,255,.06);border-radius:8px;overflow:hidden}
.pnas-row{display:flex;font-size:12px;border-bottom:1px solid rgba(255,255,255,.04)}
.pnas-row:last-child{border-bottom:none}
.pnas-step{min-width:55px;padding:8px 10px;background:rgba(255,255,255,.03);color:rgba(255,255,255,.45);font-weight:600;font-size:11px}
.pnas-content{padding:8px 10px;color:rgba(255,255,255,.6);line-height:1.5;flex:1}

/* ABC 筛选 + 能量推荐 */
.abc-filter{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.abc-tag{padding:6px 14px;border-radius:16px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(255,255,255,.5);font-family:inherit;transition:all .2s}
.abc-tag:hover{background:rgba(255,255,255,.08)}
.abc-tag.active-a{background:rgba(244,67,54,.15);border-color:rgba(244,67,54,.3);color:#ef5350}
.abc-tag.active-b{background:rgba(255,152,0,.15);border-color:rgba(255,152,0,.3);color:#ff9800}
.abc-tag.active-c{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.15);color:rgba(255,255,255,.6)}
.recommend-box{background:linear-gradient(135deg,rgba(76,175,80,.06),rgba(76,175,80,.02));border:1px solid rgba(76,175,80,.12);border-radius:10px;padding:16px;margin-bottom:18px}
.recommend-header{font-size:14px;font-weight:600;color:#4caf50;margin-bottom:10px}
.recommend-item{padding:8px 12px;background:rgba(0,0,0,.2);border-radius:6px;margin-bottom:6px;font-size:13px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:8px}
.recommend-item:last-child{margin-bottom:0}
.badge-abc{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;display:inline-block}
.badge-abc-A{background:rgba(244,67,54,.15);color:#ef5350}
.badge-abc-B{background:rgba(255,152,0,.15);color:#ff9800}
.badge-abc-C{background:rgba(255,255,255,.06);color:rgba(255,255,255,.4)}
.badge-energy{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:500;display:inline-block}
.badge-energy-high{background:rgba(244,67,54,.12);color:#ef5350}
.badge-energy-mid{background:rgba(255,152,0,.12);color:#ff9800}
.badge-energy-low{background:rgba(76,175,80,.12);color:#4caf50}

.btn{padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.7);font-family:inherit;transition:all .2s}
.btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
.btn-primary{border-color:rgba(255,107,107,.3);color:#ff6b6b}
.btn-primary:hover{background:rgba(255,107,107,.1)}

.toast{position:fixed;top:20px;right:20px;background:#1a1a1a;border:1px solid rgba(255,107,107,.3);border-radius:8px;padding:16px 20px;color:#e0e0e0;font-size:13px;z-index:100;opacity:0;transform:translateY(-10px);transition:all .3s;max-width:380px}
.toast.show{opacity:1;transform:translateY(0)}
.toast.ok{border-color:rgba(76,175,80,.3)}
.toast.err{border-color:rgba(244,67,54,.3)}

.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:200;display:none;justify-content:center;align-items:center}
.modal-overlay.show{display:flex}
.modal{background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:28px;width:90%;max-width:600px;max-height:85vh;overflow-y:auto}
.modal h2{color:#fff;font-size:20px;margin-bottom:20px}
.modal label{display:block;color:rgba(255,255,255,.5);font-size:12px;margin:12px 0 4px}
.modal input,.modal textarea,.modal select{width:100%;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:6px;color:#e0e0e0;font-size:13px;font-family:inherit;resize:vertical}
.modal textarea{min-height:70px}
.modal select{appearance:none}
.modal .btn-row{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}

.sub-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.sub-tab{padding:6px 16px;font-size:12px;color:rgba(255,255,255,.4);cursor:pointer;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:6px;transition:all .2s;font-family:inherit}
.sub-tab:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.06)}
.sub-tab.active{color:#ff6b6b;background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.25)}
.sub-count{font-size:10px;color:rgba(255,255,255,.25);margin-left:2px}
.sub-tab.active .sub-count{color:rgba(255,107,107,.5)}

/* 任务操作按钮 */
.task-actions{display:flex;gap:4px;white-space:nowrap}
.task-btn{padding:2px 8px;border-radius:4px;font-size:11px;cursor:pointer;border:1px solid transparent;background:rgba(255,255,255,.06);color:rgba(255,255,255,.4);font-family:inherit;transition:all .15s}
.task-btn:hover{border-color:rgba(255,255,255,.15);color:#fff}
.task-btn.done:hover{background:rgba(76,175,80,.15);border-color:rgba(76,175,80,.3);color:#4caf50}
.task-btn.cancel:hover{background:rgba(244,67,54,.12);border-color:rgba(244,67,54,.3);color:#ef5350}
.task-btn.loading{opacity:.4;pointer-events:none}

/* PAT 设置面板 */
.token-setup{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:10px 14px;background:rgba(255,107,107,.04);border:1px dashed rgba(255,107,107,.15);border-radius:8px;font-size:12px;color:rgba(255,255,255,.45)}
.token-setup input{flex:1;padding:6px 10px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);border-radius:4px;color:#e0e0e0;font-size:12px;font-family:inherit}
.token-setup button{padding:6px 12px;border-radius:4px;font-size:11px;cursor:pointer;border:1px solid rgba(255,107,107,.2);background:rgba(255,107,107,.1);color:#ff6b6b;font-family:inherit;white-space:nowrap}
.token-setup button:hover{background:rgba(255,107,107,.2)}
.token-help{font-size:10px;color:rgba(255,255,255,.25);margin-bottom:12px}
.token-help a{color:rgba(255,255,255,.4)}
</style>
</head>
<body>
<div class="container">
<header>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1>🏭 造化坊 · 仪表盘</h1>
      <div class="sub">${D.today} · 三层管理：系统层 → 项目层 → 工作流层</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn" onclick="openOpsGuide()" title="造化坊操作说明">📖 操作说明</button>
      <button class="btn" onclick="openIssues()" title="系统诊断问题">🔍 系统问题</button>
      <button class="btn" onclick="openAiSuggest()" title="AI 方向建议">💡 AI 建议</button>
      <button class="btn btn-primary" onclick="openRecentLogs()" title="查看近期工作日志">📋 近期日志</button>
    </div>
  </div>
</header>

<div class="tabs">
  <button class="tab active" onclick="switchTab('overview',this)">总览</button>
  <button class="tab" onclick="switchTab('goals',this)">目标</button>
  <button class="tab" onclick="switchTab('projects',this)">项目</button>
  <button class="tab" onclick="switchTab('personal-tasks',this)">任务</button>
  <button class="tab" onclick="switchTab('workflows',this)">工作流</button>
  <button class="tab" onclick="switchTab('guides',this)">知识库</button>
  <button class="tab" onclick="switchTab('assets',this)">资产地址</button>
</div>

<div id="tab-overview" class="panel active">
  <div class="credo"><p><strong>定一个项目 → 遇到问题 → 学需要的知识 → 解决问题 → 完成</strong> · 匠心造化，万物可成</p></div>
  <div class="cards" id="cards-overview"></div>
  <div class="tbl" id="tbl-overview-info"></div>
</div>
<div id="tab-projects" class="panel"><div class="section-title">📌 活跃项目</div><div id="tbl-projects"></div></div>
<div id="tab-workflows" class="panel"><div class="layers"><span class="layer-tag layer-sys">系统层统一管理 · 过程归系统，产出归项目</span></div><div class="sub-tabs" id="wf-sub-tabs"><button class="sub-tab active" onclick="switchWfSub('all',this)">全部<span class="sub-count" id="wf-count-all"></span></button><button class="sub-tab" onclick="switchWfSub('自媒体',this)">自媒体<span class="sub-count" id="wf-count-zimeiti"></span></button><button class="sub-tab" onclick="switchWfSub('游戏开发',this)">游戏开发<span class="sub-count" id="wf-count-gamedev"></span></button><button class="sub-tab" onclick="switchWfSub('skill',this)">SKILL仓库<span class="sub-count" id="wf-count-skill"></span></button></div><div id="tbl-workflows"></div></div>
<div id="tab-personal-tasks" class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div class="section-title" style="margin:0;padding:0;border:none">📋 6 分类个人待办</div><button class="btn" onclick="openGuideModal()" style="font-size:12px">📖 操作说明</button><button class="btn" onclick="showTokenSetup()" style="font-size:12px;margin-left:6px" title="设置 GitHub Token 以启用网页端任务操作">⚙️ 设置</button><button class="btn" onclick="archiveTasks(this)" style="font-size:12px;margin-left:6px" title="将已完成/已取消的任务移至本周归档">📦 执行周度归档</button></div><div id="token-setup-row" class="token-setup" style="display:none"><span>🔑 GitHub Token</span><input id="token-input" type="password" placeholder="ghp_..." onkeydown="if(event.key==='Enter'){event.preventDefault();saveToken();return false}"><button onclick="saveToken()">保存</button><button onclick="clearToken()" style="background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.5)">清除</button></div><div id="token-help" class="token-help" style="display:none">→ <a href="https://github.com/settings/tokens?type=beta" target="_blank">创建细粒度 Token</a>，权限选 <code>Contents: Read and write</code>，仅限此仓库。Token 仅保存在浏览器本地。</div><div id="tbl-recommend"></div><div id="cards-personal-tasks" class="cards"></div><div class="abc-filter" id="abc-filter"><button class="abc-tag active-a" onclick="switchAbc('all',this)">全部</button><button class="abc-tag" onclick="switchAbc('A',this)">A · 要事</button><button class="abc-tag" onclick="switchAbc('B',this)">B · 紧急</button><button class="abc-tag" onclick="switchAbc('C',this)">C · 杂事</button></div><div class="sub-tabs" id="pt-sub-tabs"><button class="sub-tab active" onclick="switchPtSub('all',this)">全部<span class="sub-count" id="pt-count-all"></span></button><button class="sub-tab" style="color:#4caf50" onclick="switchPtSub('D',this)">🏢 主美<span class="sub-count" id="pt-count-D"></span></button><button class="sub-tab" style="color:#ff9800" onclick="switchPtSub('X',this)">📱 小红书<span class="sub-count" id="pt-count-X"></span></button><button class="sub-tab" style="color:#42a5f5" onclick="switchPtSub('G',this)">🎮 游戏<span class="sub-count" id="pt-count-G"></span></button><button class="sub-tab" style="color:#ce93d8" onclick="switchPtSub('F',this)">🔧 造化坊<span class="sub-count" id="pt-count-F"></span></button><button class="sub-tab" style="color:#78909c" onclick="switchPtSub('L',this)">🏠 日常<span class="sub-count" id="pt-count-L"></span></button></div><div id="tbl-personal-tasks"></div><div class="section-title" style="cursor:pointer;user-select:none" onclick="toggleArchive()">📦 周度归档 <span style="font-size:12px;color:rgba(255,255,255,.35)" id="archive-toggle">▶ 展开</span></div><div id="archive-section" style="display:none"></div></div>
<div id="tab-goals" class="panel"><div class="section-title">🎯 长期目标（1年+） — AI原生五维关注</div><div id="tbl-longterm"></div><div class="section-title">📌 季度项目（3个月）— PNAS 驱动</div><div id="tbl-quarterly-goals"></div><div class="section-title" onclick="document.getElementById('goals-archived').classList.toggle('hidden');this.classList.toggle('collapsed')" style="cursor:pointer;user-select:none">📦 已归档目标 <span style="font-size:11px;color:rgba(255,255,255,.3)">（点击展开）</span></div><div id="goals-archived" class="hidden"><div id="tbl-goals-archived"></div></div></div>
<div id="tab-guides" class="panel"><div class="section-title">工具知识库（docs/tool-guides/）</div><div class="credo"><p>每个工具覆盖三个维度：<strong>是什么</strong> · <strong>怎么用</strong> · <strong>AI 怎么配合</strong></p></div><div id="tbl-guides"></div></div>
<div id="tab-assets" class="panel"><div id="tbl-assets"></div><div class="section-title">外部平台</div><div id="tbl-external"></div></div>

<footer class="footer">造化坊 (Creation Forge) · 生成于 ${D.today} · <a href="https://github.com/g676967453-blip/creation-forge" target="_blank">GitHub</a></footer>
</div>

<div id="toast" class="toast"></div>

<div id="issues-overlay" class="modal-overlay" onclick="if(event.target===this)closeIssues()">
<div class="modal" style="max-width:700px">
  <h2>🔍 系统问题（AI 诊断）</h2>
  <div id="issues-body" style="max-height:60vh;overflow-y:auto"></div>
  <p style="color:rgba(255,255,255,.3);font-size:12px;margin-top:12px">💡 在对话中说「检查系统问题」触发诊断 · 由 <code>/goals</code> → 进展追踪自动更新</p>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeIssues()">关闭</button>
  </div>
</div>
</div>

<div id="ai-suggest-overlay" class="modal-overlay" onclick="if(event.target===this)closeAiSuggest()">
<div class="modal" style="max-width:700px">
  <h2>💡 AI 大方向建议</h2>
  <div id="ai-suggest-body" style="max-height:60vh;overflow-y:auto"></div>
  <p style="color:rgba(255,255,255,.3);font-size:12px;margin-top:12px">💡 在对话中说「给建议」或「AI 你觉得下一步该做什么」触发 AI 建议</p>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeAiSuggest()">关闭</button>
  </div>
</div>
</div>

<div id="recent-logs-overlay" class="modal-overlay" onclick="if(event.target===this)closeRecentLogs()">
<div class="modal" style="max-width:700px">
  <h2>📋 近期工作日志（works/）</h2>
  <div id="recent-logs-body" style="max-height:60vh;overflow-y:auto"></div>
  <div class="btn-row">
    <button class="btn btn-primary" onclick="closeRecentLogs()">关闭</button>
  </div>
</div>
</div>

<div id="guide-overlay" class="modal-overlay" onclick="if(event.target===this)closeGuideModal()">
<div class="modal">
  <h2>📖 个人待办 · 操作说明</h2>
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
  <h2>📖 造化坊 · 操作说明</h2>
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
    toast('⚠️ 仪表盘服务器未启动。请运行: npm run dashboard', 'err');
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
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
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
      '<div class="st-title">🧭 战略定位三角</div>'+
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
      ? '<span class="todo-badge has-todos">📋 '+t+' 条待办</span>'
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
        '<span class="badge '+(pm[g.priority]||'')+'">'+g.priority+'</span>'+
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

(function(){
  document.getElementById('cards-overview').innerHTML = [
    {label:'SKILL 文件',value:D.skillCount,detail:'标准 '+D.skillStandard+' · 扁平 '+D.skillFlat+' · <a href=\"../docs/workflows/变更日志.md\" style=\"color:#ff6b6b\">变更日志</a>'},
    {label:'工作流数量',value:D.workflowCount,detail:'标准化流程'},
    {label:'工具知识库',value:D.guideCount,detail:'操作指南'},
    {label:'works 日志',value:D.worksCount,detail:'一事一记'},
    {label:'Git 提交',value:D.commitCount,detail:'版本记录'},
    {label:'活跃项目',value:D.projects.filter(function(p){return p.status==='active'}).length,detail:D.projects.filter(function(p){return p.status==='active'}).map(function(p){return p.name.split('（')[0].split('「')[0];}).join(' + ')},
  ].map(c=>'<div class="card"><div class="label">'+c.label+'</div><div class="value">'+c.value+'</div><div class="detail">'+c.detail+'</div></div>').join('');

  document.getElementById('tbl-overview-info').innerHTML =
    '<table class="tbl"><thead><tr><th>板块</th><th>内容</th></tr></thead><tbody>'+
    '<tr><td>AI 模式</td><td>协作者 · 导师 · 加速器</td></tr>'+
    '<tr><td>SKILL</td><td>/new-post · /git-commit · /update-dashboard · /todo · /goals</td></tr>'+
    '<tr><td>项目结构</td><td>系统层 → 项目层 → 工作流层</td></tr></tbody></table>'+
    '<div class="section-title" style="margin-top:24px">🚀 活跃项目速览</div>'+
    '<table class="tbl"><thead><tr><th>项目</th><th>引擎</th><th>进度</th><th>状态</th></tr></thead><tbody>'+
    D.projects.map(function(p){
      var sb = p.status==='active'?'badge-active':'badge-idle';
      var st = p.status==='active'?'🟢 活跃':'🟡 暂停';
      return '<tr><td><strong>'+p.name+'</strong></td><td>'+p.engine+'</td><td>'+p.progress+'</td><td><span class="badge '+sb+'">'+st+'</span></td></tr>';
    }).join('')+'</tbody></table>';
})();
// 项目卡片渲染：引擎 + 状态 + 进度 + 产出 + 阻塞
function renderProjectCards(projects) {
  var ps = {active:'badge-active',idle:'badge-idle',done:'badge-done'};
  var pst = {active:'🟢 活跃',idle:'🟡 暂停',done:'✅ 完成'};
  return projects.map(function(p) {
    return '<div class="goal-card">'+
      '<div class="goal-header">'+
        '<span class="goal-name">'+p.name+'</span>'+
        '<span class="badge '+(ps[p.status]||'badge-empty')+'">'+(pst[p.status]||p.statusText)+'</span>'+
      '</div>'+
      '<div class="goal-detail">'+p.engine+' · '+p.progress+'</div>'+
      '<div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:8px;line-height:1.5">'+
        '<div>📦 <strong>产出：</strong>'+p.output+'</div>'+
        (p.blocker !== '—' ? '<div style="margin-top:4px">⚠️ <strong>阻塞：</strong>'+p.blocker+'</div>' : '')+
      '</div>'+
    '</div>';
  }).join('');
}
(function(){
  document.getElementById('tbl-projects').innerHTML=renderProjectCards(D.projects);
})();
(function(){
  const sm={mature:'badge-mature',testing:'badge-testing',ongoing:'badge-ongoing'};
  const st={mature:'✅ 成熟',testing:'🟡 待验证',ongoing:'🔄 持续'};
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
  // --- GitHub API 任务操作 ---
  const REPO = 'g676967453-blip/creation-forge';
  const FILE_PATH = 'docs/个人待办.md';
  const STATUS_MAP = { pending: '📋 待办', active: '🟢 进行中', done: '✅ 已完成', cancelled: '❌ 已取消' };

  function getToken() { return localStorage.getItem('gh_pat'); }
  function hasToken() { return !!getToken(); }

  // 调用 GitHub Contents API 更新任务状态
  async function updateTaskStatus(taskId, newStatus, newStatusText) {
    const token = getToken();
    if (!token) { showTokenSetup(); toast('请先设置 GitHub Token', 'err'); return false; }
    const url = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE_PATH;
    try {
      // 1. GET 当前文件
      const getRes = await fetch(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' } });
      if (!getRes.ok) throw new Error('GET failed: ' + getRes.status);
      const fileData = await getRes.json();
      const content = fromBase64(fileData.content);
      const sha = fileData.sha;

      // 2. 找到任务行并替换状态
      const NL = String.fromCharCode(10);
      const CR = String.fromCharCode(13);
      // 统一换行符：去掉 CR，按 LF 分割
      const lines = content.split(CR).join('').split(NL);
      let found = false;
      for (let i = 0; i < lines.length; i++) {
        // 匹配表格行: | ID | 任务 | 状态 | ...
        if (lines[i].indexOf('| ' + taskId + ' |') === 0) {
          const cells = lines[i].split('|');
          if (cells.length >= 3) {
            // cells[2] 是状态列（去掉首尾空白）
            const oldStatus = cells[2].trim();
            // 替换整个状态文本
            lines[i] = lines[i].replace('| ' + oldStatus + ' |', '| ' + newStatusText + ' |');
            found = true;
          }
          break;
        }
      }
      if (!found) { toast('未找到任务 ' + taskId, 'err'); return false; }
      const newContent = lines.join(NL);

      // 3. PUT 更新
      const putBody = {
        message: '✅ ' + taskId + ' → ' + newStatusText + ' [via 仪表盘]',
        content: toBase64(newContent),
        sha: sha,
        branch: 'main'
      };
      const putRes = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify(putBody)
      });
      if (!putRes.ok) {
        const err = await putRes.json();
        if (putRes.status === 409) { // SHA 冲突，重试一次
          toast('文件已被修改，正在重试...', '');
          await new Promise(r => setTimeout(r, 1000));
          return await updateTaskStatus(taskId, newStatus, newStatusText);
        }
        throw new Error(err.message || 'PUT failed: ' + putRes.status);
      }
      return true;
    } catch(e) {
      toast('操作失败: ' + e.message, 'err');
      return false;
    }
  }

  // 正确的 UTF-8 Base64 编解码（兼容中文/emoji）
  function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function fromBase64(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  window.completeTask = async function(taskId, catKey, btn) {
    if (btn) { btn.classList.add('loading'); btn.textContent = '...'; }
    const ok = await updateTaskStatus(taskId, 'done', '✅ 已完成');
    if (btn) { btn.classList.remove('loading'); btn.textContent = '✓'; }
    if (ok) {
      toast('✅ ' + taskId + ' 已完成', 'ok');
      // 局部刷新
      document.getElementById('tbl-personal-tasks').innerHTML = renderPtTable(currentPtFilter);
      // 刷新统计卡片
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
      document.getElementById('tbl-personal-tasks').innerHTML = renderPtTable(currentPtFilter);
      refreshTaskCards();
    }
  };

  // --- 周度归档 ---
  window.archiveTasks = async function(btn) {
    const token = getToken();
    if (!token) { showTokenSetup(); toast('请先设置 GitHub Token', 'err'); return; }
    if (!confirm('将当前所有 ✅ 完成 / ❌ 已取消 的任务移至本周归档？')) return;
    if (btn) { btn.disabled = true; btn.textContent = '归档中...'; }

    const url = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE_PATH;
    try {
      // 1. GET 文件
      const getRes = await fetch(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' } });
      if (!getRes.ok) throw new Error('GET failed: ' + getRes.status);
      const fileData = await getRes.json();
      const content = fromBase64(fileData.content);
      const sha = fileData.sha;
      const CR = String.fromCharCode(13);
      const NL = String.fromCharCode(10);
      const lines = content.split(CR).join('').split(NL);

      // 2. 收集已完成/已取消的任务，并移除
      const archived = [];
      const newLines = [];
      let inArchive = false;
      let inTable = false;
      let currentCat = '';
      const today = new Date().toLocaleDateString('zh-CN').split('/').join('-');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 检测进入归档区
        if (trimmed.startsWith('## 📦')) { inArchive = true; inTable = false; }
        if (inArchive) { newLines.push(line); continue; }

        // 检测分类标题
        if (trimmed.startsWith('## ')) { currentCat = trimmed.replace(/^## /, '').trim(); inTable = false; newLines.push(line); continue; }

        // 检测表格开始
        if (trimmed.match(/^\|[-|\s]+\|$/)) { inTable = true; newLines.push(line); continue; }

        // 表格行
        if (inTable && trimmed.startsWith('|') && !trimmed.match(/^\|[-|\s]+\|$/)) {
          const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length >= 3 && (cells[2].includes('✅') || cells[2].includes('❌'))) {
            // 归档此行
            const emoji = currentCat.substring(0, 2); // 取分类 emoji
            archived.push({ source: emoji + ' ' + currentCat.replace(emoji, '').trim(), id: cells[0], task: cells[1], date: today, result: cells[2] });
            continue; // 跳过此行（不加入输出）
          }
        }

        newLines.push(line);
      }

      if (archived.length === 0) {
        if (btn) { btn.disabled = false; btn.textContent = '📦 执行周度归档'; }
        toast('没有需要归档的任务', '');
        return;
      }

      // 3. 生成归档条目，追加到归档区
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // 周一
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // 周日
      const fmt = (d) => (d.getMonth() + 1) + '/' + d.getDate();
      const weekLabel = '第' + Math.ceil((now.getDate() + (new Date(now.getFullYear(), now.getMonth(), 1).getDay() || 7) - 1) / 7) + '周（' + fmt(weekStart) + ' ~ ' + fmt(weekEnd) + '）';

      // 找到归档区 ## 📦 之后的 ### 或直接追加
      let archiveIdx = -1;
      for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith('## 📦')) { archiveIdx = i; break; }
      }
      if (archiveIdx === -1) {
        // 没有归档区，创建
        newLines.push('', '---', '', '## 📦 周度归档', '');
        archiveIdx = newLines.length - 1;
      }

      // 检查当前周是否已有归档
      let weekIdx = -1;
      for (let i = archiveIdx; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith('### ') && newLines[i].includes(weekLabel)) {
          weekIdx = i; break;
        }
      }

      if (weekIdx === -1) {
        // 插入新周
        const insertAt = archiveIdx + 1;
        newLines.splice(insertAt, 0, '', '### ' + weekLabel, '', '| 来源 | ID | 任务 | 完成日 | 结果 |', '|------|----|------|--------|------|');
      }

      // 追加归档条目
      for (const a of archived) {
        newLines.push('| ' + a.source + ' | ' + a.id + ' | ' + a.task + ' | ' + a.date + ' | ' + a.result + ' |');
      }

      const newContent = newLines.join(NL);

      // 4. PUT
      const putBody = {
        message: '📦 周度归档 — ' + archived.length + ' 条',
        content: toBase64(newContent),
        sha: sha,
        branch: 'main'
      };
      const putRes = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify(putBody)
      });
      if (!putRes.ok) throw new Error('PUT failed: ' + putRes.status);

      toast('✅ 已归档 ' + archived.length + ' 条任务', 'ok');
      if (btn) { btn.disabled = false; btn.textContent = '📦 执行周度归档'; }
      // 刷新页面以显示最新数据
      setTimeout(() => location.reload(), 1500);
    } catch(e) {
      toast('归档失败: ' + e.message, 'err');
      if (btn) { btn.disabled = false; btn.textContent = '📦 执行周度归档'; }
    }
  };

  // 保存 Token
  window.saveToken = function() {
    const input = document.getElementById('token-input');
    const val = input.value.trim();
    if (val) {
      localStorage.setItem('gh_pat', val);
      document.getElementById('token-setup-row').style.display = 'none';
      document.getElementById('token-help').style.display = 'none';
      toast('✅ Token 已保存', 'ok');
    }
  };

  window.clearToken = function() {
    localStorage.removeItem('gh_pat');
    document.getElementById('token-setup-row').style.display = 'flex';
    toast('Token 已清除', '');
  };

  function showTokenSetup() {
    document.getElementById('token-setup-row').style.display = 'flex';
    document.getElementById('token-help').style.display = 'block';
  }
  window.showTokenSetup = showTokenSetup;

  function refreshTaskCards() {
    // 简单刷新：重新计算活跃数
    var cardsEl = document.getElementById('cards-personal-tasks');
    var s = D.personalTasks.stats;
    // 更新全部活跃计数（数据已变，用 DOM 估算）
    // 这里用简单方式：标记需要刷新，用户下次手动刷新仪表盘即可看到准确数据
  }

  // --- 个人待办面板渲染 ---
  const PT = D.personalTasks;
  const sm = {pending:'badge-planned',active:'badge-active-task',done:'badge-done',cancelled:'badge-cancelled'};
  const pm = {'🔴 高':'badge-prio-high','🔴高':'badge-prio-high','🟡 中':'badge-prio-mid','🟡中':'badge-prio-mid','🟢 低':'badge-prio-low','🟢低':'badge-prio-low'};
  const pmap = function(p){for(var k in pm){if(p.indexOf(k.replace(/ .+/,''))===0)return pm[k];}return '';};

  // 汇总卡片
  const cards = document.getElementById('cards-personal-tasks');
  const cats = PT.categories;
  let allActive = 0, allTotal = 0;
  cats.forEach(function(c){
    const s = PT.stats.byCategory[c.key];
    allActive += s.pending + s.active;
    allTotal += c.tasks.length;
  });
  cards.innerHTML = [
    {label:'全部活跃',value:allActive,detail:'共 '+allTotal+' 条任务',color:'#ff6b6b'},
    {label:'🏢 主美工作',value:(PT.stats.byCategory.D||{pending:0,active:0}).pending+(PT.stats.byCategory.D||{pending:0,active:0}).active,detail:'工作主业',color:'#4caf50'},
    {label:'📱 小红书',value:(PT.stats.byCategory.X||{pending:0,active:0}).pending+(PT.stats.byCategory.X||{pending:0,active:0}).active,detail:'自媒体内容',color:'#ff9800'},
    {label:'🎮 游戏开发',value:(PT.stats.byCategory.G||{pending:0,active:0}).pending+(PT.stats.byCategory.G||{pending:0,active:0}).active,detail:'独立游戏',color:'#42a5f5'},
    {label:'🔧 造化坊',value:(PT.stats.byCategory.F||{pending:0,active:0}).pending+(PT.stats.byCategory.F||{pending:0,active:0}).active,detail:'迭代优化',color:'#ce93d8'},
    {label:'🏠 日常管理',value:(PT.stats.byCategory.L||{pending:0,active:0}).pending+(PT.stats.byCategory.L||{pending:0,active:0}).active,detail:'生活杂项',color:'#78909c'},
  ].map(function(c){return '<div class="card"><div class="label" style="color:'+c.color+'">'+c.label+'</div><div class="value" style="color:'+c.color+'">'+c.value+'</div><div class="detail">'+c.detail+'</div></div>';}).join('');

  // 全局筛选状态
  var currentAbcFilter = 'all';
  var currentPtFilter = 'all';

  // 筛选渲染（含 ABC + 能量列）
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
    var enBadge = function(e) {
      if (!e || e === '—') return '<span style="color:rgba(255,255,255,.15)">—</span>';
      var cls = e === '高能' ? 'badge-energy-high' : e === '中能' ? 'badge-energy-mid' : 'badge-energy-low';
      return '<span class="badge-energy '+cls+'">'+e+'</span>';
    };
    return '<table class="tbl"><thead><tr><th>ID</th><th>任务</th><th>状态</th><th>ABC</th><th>能量</th><th>优先级</th><th>截止日</th><th>备注</th><th>操作</th></tr></thead><tbody>'+
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
        return '<tr><td style="color:rgba(255,255,255,.4);font-size:12px">'+t.id+'</td><td>'+t.task+'</td><td><span class="badge '+sm[t.status]+'">'+t.statusText+'</span></td><td>'+abcBadge(t.abc)+'</td><td>'+enBadge(t.energy)+'</td><td><span class="badge '+pmap(t.priority)+'">'+t.priority+'</span></td><td>'+dline+'</td><td style="color:rgba(255,255,255,.35);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+t.note.replace(/"/g,'&quot;')+'">'+t.note+'</td><td>'+actions+'</td></tr>';
      }).join('')+'</tbody></table>';
  }

  // 今日推荐：按能量时段推荐任务
  function renderRecommend() {
    var now = new Date().getHours();
    var period, energyFilter, abcPref;
    if (now < 12) { period = '🌅 上午（高能时段）'; energyFilter = '高能'; abcPref = 'A'; }
    else if (now < 18) { period = '☀️ 下午（中能时段）'; energyFilter = '中能'; abcPref = 'A'; }
    else { period = '🌙 晚上（低能时段）'; energyFilter = '低能'; abcPref = 'B'; }

    var candidates = [];
    cats.forEach(function(c){
      c.tasks.forEach(function(t){
        if (t.status === 'pending' || t.status === 'active') {
          candidates.push({cat:c, task:t, score: 0});
        }
      });
    });

    // 评分：ABC 匹配 + 能量匹配
    candidates.forEach(function(c){
      if (c.task.abc === 'A') c.score += 3;
      if (c.task.abc === 'B') c.score += 1;
      if (c.task.energy === energyFilter) c.score += 2;
      if (c.task.priority.includes('🔴')) c.score += 1;
    });
    candidates.sort(function(a,b){return b.score - a.score;});
    var top = candidates.slice(0, 5);

    if (top.length === 0) return '';
    var enBadge = function(e) {
      if (!e || e === '—') return '';
      var cls = e === '高能' ? 'badge-energy-high' : e === '中能' ? 'badge-energy-mid' : 'badge-energy-low';
      return '<span class="badge-energy '+cls+'">'+e+'</span>';
    };
    var abcBadge = function(a) {
      if (!a || a === '—') return '';
      var cls = a === 'A' ? 'badge-abc-A' : a === 'B' ? 'badge-abc-B' : 'badge-abc-C';
      return '<span class="badge-abc '+cls+'">'+a+'</span>';
    };
    return '<div class="recommend-box">'+
      '<div class="recommend-header">📋 '+period+' — 今日推荐</div>'+
      top.map(function(r){
        return '<div class="recommend-item">'+abcBadge(r.task.abc)+enBadge(r.task.energy)+'<span style="flex:1">'+r.task.task+'</span><span style="font-size:11px;color:rgba(255,255,255,.3)">'+r.cat.emoji+' '+r.cat.label+'</span></div>';
      }).join('')+
    '</div>';
  }

  // 初始渲染
  document.getElementById('tbl-recommend').innerHTML = renderRecommend();
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
      btn.textContent = el.classList.contains('hidden') ? '🖼️ 展开 PNAS' : '🖼️ 收起 PNAS';
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
              a.entries.map(function(e){return '<tr><td>'+e.source+'</td><td style="color:rgba(255,255,255,.4);font-size:12px">'+e.id+'</td><td>'+e.task+'</td><td>'+e.completedDate+'</td><td>'+e.hours+'</td></tr>';}).join('')+'</tbody></table>';
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
(function(){
  const rt=(d,c)=>'<table class="tbl"><thead><tr>'+c.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+d.map(r=>'<tr>'+r.map((v,i)=>i===c.length-1?'<td><span class="badge '+(pm[v]||'')+'">'+v+'</span></td>':'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
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
  const lm={系统层:'layer-sys',项目层:'layer-proj'};
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
