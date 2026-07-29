/**
 * 造化坊仪表盘生成器
 * 生成独立 HTML 文件（8 Tab 切页，暗色系）
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
      <button class="btn" onclick="doRefresh()" title="重新采集数据并刷新">🔄 更新数据</button>
      <button class="btn btn-primary" onclick="openLogModal()" title="记录今天的工作日志">📝 总结日志</button>
    </div>
  </div>
</header>

<div class="tabs">
  <button class="tab active" onclick="switchTab('overview',this)">系统总览</button>
  <button class="tab" onclick="switchTab('projects',this)">项目状态</button>
  <button class="tab" onclick="switchTab('workflows',this)">工作流</button>
  <button class="tab" onclick="switchTab('activity',this)">近期动态</button>
  <button class="tab" onclick="switchTab('personal-tasks',this)">个人待办</button>
  <button class="tab" onclick="switchTab('goals',this)">目标计划</button>
  <button class="tab" onclick="switchTab('guides',this)">知识库</button>
  <button class="tab" onclick="switchTab('assets',this)">资产地址</button>
</div>

<div id="tab-overview" class="panel active">
  <div class="credo"><p><strong>定一个项目 → 遇到问题 → 学需要的知识 → 解决问题 → 完成</strong> · 匠心造化，万物可成</p></div>
  <div class="cards" id="cards-overview"></div>
  <div class="tbl" id="tbl-overview-info"></div>
</div>
<div id="tab-projects" class="panel"><div id="tbl-projects"></div></div>
<div id="tab-workflows" class="panel"><div class="layers"><span class="layer-tag layer-sys">系统层统一管理 · 过程归系统，产出归项目</span></div><div class="sub-tabs" id="wf-sub-tabs"><button class="sub-tab active" onclick="switchWfSub('all',this)">全部<span class="sub-count" id="wf-count-all"></span></button><button class="sub-tab" onclick="switchWfSub('造化坊',this)">造化坊<span class="sub-count" id="wf-count-zaohuafang"></span></button><button class="sub-tab" onclick="switchWfSub('自媒体',this)">自媒体<span class="sub-count" id="wf-count-zimeiti"></span></button><button class="sub-tab" onclick="switchWfSub('游戏开发',this)">游戏开发<span class="sub-count" id="wf-count-gamedev"></span></button><button class="sub-tab" onclick="switchWfSub('skill',this)">SKILL仓库<span class="sub-count" id="wf-count-skill"></span></button></div><div id="tbl-workflows"></div></div>
<div id="tab-activity" class="panel"><div class="section-title">works/ 工作日志</div><div id="list-works"></div><div class="section-title">Git 提交历史</div><div id="list-commits"></div></div>
<div id="tab-personal-tasks" class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div class="section-title" style="margin:0;padding:0;border:none">📋 5 分类个人待办</div><button class="btn" onclick="openGuideModal()" style="font-size:12px">📖 操作说明</button></div><div id="cards-personal-tasks" class="cards"></div><div class="sub-tabs" id="pt-sub-tabs"><button class="sub-tab active" onclick="switchPtSub('all',this)">全部<span class="sub-count" id="pt-count-all"></span></button><button class="sub-tab" style="color:#4caf50" onclick="switchPtSub('D',this)">🏢 主美<span class="sub-count" id="pt-count-D"></span></button><button class="sub-tab" style="color:#ff9800" onclick="switchPtSub('X',this)">📱 小红书<span class="sub-count" id="pt-count-X"></span></button><button class="sub-tab" style="color:#42a5f5" onclick="switchPtSub('G',this)">🎮 游戏<span class="sub-count" id="pt-count-G"></span></button><button class="sub-tab" style="color:#ce93d8" onclick="switchPtSub('F',this)">🔧 造化坊<span class="sub-count" id="pt-count-F"></span></button><button class="sub-tab" style="color:#78909c" onclick="switchPtSub('L',this)">🏠 日常<span class="sub-count" id="pt-count-L"></span></button></div><div id="tbl-personal-tasks"></div><div class="section-title" style="cursor:pointer;user-select:none" onclick="toggleArchive()">📦 周度归档 <span style="font-size:12px;color:rgba(255,255,255,.35)" id="archive-toggle">▶ 展开</span></div><div id="archive-section" style="display:none"></div></div>
<div id="tab-goals" class="panel"><div class="section-title">📌 用户需求（你提出的任务）</div><div id="tbl-goals-user"></div><div class="section-title">🔍 系统问题（AI 诊断）</div><div id="tbl-goals-issues"></div><div class="section-title">💡 AI 大方向建议</div><div id="tbl-goals-ai"></div></div>
<div id="tab-guides" class="panel"><div class="section-title">工具知识库（docs/tool-guides/）</div><div class="credo"><p>每个工具覆盖三个维度：<strong>是什么</strong> · <strong>怎么用</strong> · <strong>AI 怎么配合</strong></p></div><div id="tbl-guides"></div></div>
<div id="tab-assets" class="panel"><div id="tbl-assets"></div><div class="section-title">外部平台</div><div id="tbl-external"></div></div>

<footer class="footer">造化坊 (Creation Forge) · 生成于 ${D.today} · <a href="https://github.com/g676967453-blip/creation-forge" target="_blank">GitHub</a></footer>
</div>

<div id="toast" class="toast"></div>

<div id="log-overlay" class="modal-overlay" onclick="if(event.target===this)closeLogModal()">
<div class="modal">
  <h2>📝 记录今日工作日志</h2>
  <label>日期</label><input type="date" id="log-date">
  <label>标题（简短）</label><input type="text" id="log-title" placeholder="例如：仪表盘交互按钮上线">
  <label>遇到了什么</label><textarea id="log-problem" placeholder="一句话描述今天解决的问题"></textarea>
  <label>AI 怎么协作的</label><textarea id="log-ai" placeholder="AI 做了什么、关键决策"></textarea>
  <label>产出结果</label><textarea id="log-output" placeholder="具体产出物及路径"></textarea>
  <label>关联项目</label>
  <select id="log-project">
    <option>造化坊 · 基础设施</option><option>小红书自媒体</option>
    <option>GAME-002 开仙门</option><option>asset-pipeline</option>
  </select>
  <div class="btn-row">
    <button class="btn" onclick="closeLogModal()">取消</button>
    <button class="btn btn-primary" onclick="submitLog()">💾 写入 works/</button>
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

function openLogModal() {
  document.getElementById('log-overlay').classList.add('show');
  document.getElementById('log-date').value = new Date().toISOString().slice(0,10);
}
function closeLogModal() { document.getElementById('log-overlay').classList.remove('show'); }

function openGuideModal() { document.getElementById('guide-overlay').classList.add('show'); }
function closeGuideModal() { document.getElementById('guide-overlay').classList.remove('show'); }

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

async function submitLog() {
  const body = {
    date: document.getElementById('log-date').value,
    title: document.getElementById('log-title').value || '工作日志',
    problem: document.getElementById('log-problem').value,
    ai: document.getElementById('log-ai').value,
    output: document.getElementById('log-output').value,
    project: document.getElementById('log-project').value,
  };
  try {
    const r = await fetch('/api/log', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    const res = await r.json();
    toast('✅ 日志已写入 works/' + res.filename, 'ok');
    closeLogModal();
    doRefresh();
  } catch(e) {
    toast('⚠️ 服务器未启动，改为下载 .md 文件', 'err');
    // Fallback: download as file
    const md = ['# [',body.date,'] ',body.title,'','','---','','## 问题解决日志','','### 遇到了什么','',body.problem,'','### AI 怎么协作的','',body.ai,'','### 产出结果','',body.output,'','### 关联项目','',body.project].join('\\n');
    const blob = new Blob([md], {type:'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = body.date + '-' + body.title.replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,'-').substring(0,40) + '.md';
    a.click();
  }
}

function switchTab(name, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
}
(function(){
  document.getElementById('cards-overview').innerHTML = [
    {label:'SKILL 文件',value:D.skillCount,detail:'标准 '+D.skillStandard+' · 扁平 '+D.skillFlat+' · <a href=\"../docs/workflows/变更日志.md\" style=\"color:#ff6b6b\">变更日志</a>'},
    {label:'工作流数量',value:D.workflowCount,detail:'标准化流程'},
    {label:'工具知识库',value:D.guideCount,detail:'操作指南'},
    {label:'works 日志',value:D.worksCount,detail:'一事一记'},
    {label:'Git 提交',value:D.commitCount,detail:'版本记录'},
    {label:'活跃项目',value:'3',detail:'GAME-002 + 小红书 + asset-pipeline'},
  ].map(c=>'<div class="card"><div class="label">'+c.label+'</div><div class="value">'+c.value+'</div><div class="detail">'+c.detail+'</div></div>').join('');

  document.getElementById('tbl-overview-info').innerHTML =
    '<table class="tbl"><thead><tr><th>板块</th><th>内容</th></tr></thead><tbody>'+
    '<tr><td>AI 模式</td><td>协作者 · 导师 · 加速器</td></tr>'+
    '<tr><td>SKILL</td><td>/new-post · /git-commit · /update-dashboard</td></tr>'+
    '<tr><td>项目结构</td><td>系统层 → 项目层 → 工作流层</td></tr></tbody></table>';
})();
(function(){
  const m={active:'badge-active',idle:'badge-idle',empty:'badge-empty'};
  document.getElementById('tbl-projects').innerHTML='<table class="tbl"><thead><tr><th>项目</th><th>引擎/工具</th><th>状态</th><th>进度</th><th>本周产出</th><th>阻塞项</th></tr></thead><tbody>'+
    D.projects.map(p=>'<tr><td>'+p.name+'</td><td>'+p.engine+'</td><td><span class="badge '+m[p.status]+'">'+p.statusText+'</span></td><td>'+p.progress+'</td><td>'+p.output+'</td><td>'+p.blocker+'</td></tr>').join('')+'</tbody></table>';
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

  window.switchWfSub = function(cat, el) {
    document.querySelectorAll('#wf-sub-tabs .sub-tab').forEach(function(t){t.classList.remove('active');});
    el.classList.add('active');
    var data;
    if (cat === 'all') data = D.workflows;
    else if (cat === 'skill') data = D.skills;
    else data = D.workflows.filter(function(w){return w.category === cat;});
    document.getElementById('tbl-workflows').innerHTML = renderWfTable(data, cat);
  };

  // 初始渲染全部 + 设置计数
  document.getElementById('tbl-workflows').innerHTML = renderWfTable(D.workflows, 'all');
  document.getElementById('wf-count-all').textContent = '('+D.workflows.length+')';
  document.getElementById('wf-count-zaohuafang').textContent = '('+D.workflows.filter(function(w){return w.category==='造化坊';}).length+')';
  document.getElementById('wf-count-zimeiti').textContent = '('+D.workflows.filter(function(w){return w.category==='自媒体';}).length+')';
  document.getElementById('wf-count-gamedev').textContent = '('+D.workflows.filter(function(w){return w.category==='游戏开发';}).length+')';
  document.getElementById('wf-count-skill').textContent = '('+D.skills.length+')';
})();
(function(){
  document.getElementById('list-works').innerHTML=D.worksData.map(w=>'<div class="log-item"><span class="log-date">'+w.date+'</span><span class="log-file">'+w.file+'</span><span class="log-desc">'+w.desc+'</span></div>').join('');
  document.getElementById('list-commits').innerHTML=D.gitCommits.map(c=>'<div class="commit-item"><span class="log-date">'+c.date+'</span><span>'+c.msg+'</span><span class="hash">'+c.hash+'</span></div>').join('');
})();
// 个人待办面板
(function(){
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

  // 筛选渲染
  function renderPtTable(filterKey) {
    var allRows = [];
    cats.forEach(function(c){
      var tasks = filterKey === 'all' ? c.tasks : (c.key === filterKey ? c.tasks : []);
      tasks.forEach(function(t){
        allRows.push({cat:c, task:t});
      });
    });
    if (allRows.length === 0) {
      return '<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25);font-size:14px">暂无任务。说「添加任务」开始记录，或「扫描待办」从项目提取。</div>';
    }
    return '<table class="tbl"><thead><tr><th>ID</th><th>任务</th><th>状态</th><th>优先级</th><th>截止日</th><th>备注</th></tr></thead><tbody>'+
      allRows.map(function(r){
        var t = r.task;
        var dline = t.deadline === '—' ? '<span style="color:rgba(255,255,255,.2)">—</span>' : '<span style="color:#ff6b6b">'+t.deadline+'</span>';
        return '<tr><td style="color:rgba(255,255,255,.4);font-size:12px">'+t.id+'</td><td>'+t.task+'</td><td><span class="badge '+sm[t.status]+'">'+t.statusText+'</span></td><td><span class="badge '+pmap(t.priority)+'">'+t.priority+'</span></td><td>'+dline+'</td><td style="color:rgba(255,255,255,.35);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+t.note.replace(/"/g,'&quot;')+'">'+t.note+'</td></tr>';
      }).join('')+'</tbody></table>';
  }

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

  window.switchPtSub = function(key, el) {
    document.querySelectorAll('#pt-sub-tabs .sub-tab').forEach(function(t){t.classList.remove('active');});
    el.classList.add('active');
    document.getElementById('tbl-personal-tasks').innerHTML = renderPtTable(key);
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
  const pm={"🔴 紧急":"badge-active-task","🔴 阻塞":"badge-active-task","🔴 优先":"badge-active-task","🟡 本周":"badge-idle","🟡 持续":"badge-idle","🟡 累积":"badge-idle","🟡 便利性":"badge-idle","🟡 建议":"badge-idle","🟢 远期":"badge-empty"};
  const rt=(d,c)=>'<table class="tbl"><thead><tr>'+c.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+d.map(r=>'<tr>'+r.map((v,i)=>i===c.length-1?'<td><span class="badge '+(pm[v]||'')+'">'+v+'</span></td>':'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  document.getElementById('tbl-goals-user').innerHTML=rt(D.goalsUser.map(g=>[g.id,g.task,g.detail,g.priority]),['#','任务','详情','优先级']);
  document.getElementById('tbl-goals-issues').innerHTML=rt(D.goalsIssues.map(g=>[g.id,g.issue,g.source,g.severity]),['#','问题','来源','严重度']);
  document.getElementById('tbl-goals-ai').innerHTML=rt(D.goalsAI.map(g=>[g.id,g.suggestion,g.detail,g.priority]),['#','建议','详情','优先级']);
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
