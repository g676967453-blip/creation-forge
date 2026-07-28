// Stitch MCP — 横屏器灵选择界面（匹配开仙门实际设计）
import { spawn } from 'child_process';

// 从环境变量读取 API Key，不再硬编码
// 使用前请设置：export GOOGLE_API_KEY="your-key-here"
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('错误: 请设置 GOOGLE_API_KEY 环境变量');
  process.exit(1);
}
const childEnv = { ...process.env, GOOGLE_API_KEY: API_KEY };

const proc = spawn('cmd.exe', ['/c', 'npx.cmd', '-y', 'mcp-stitch'], { env: childEnv, stdio: ['pipe', 'pipe', 'pipe'] });

let buffer = '', msgId = 0;
const pending = new Map();

proc.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try { const msg = JSON.parse(line); const cb = pending.get(msg.id); if (cb) { pending.delete(msg.id); cb(msg); } } catch {}
  }
});
proc.stderr.on('data', d => { const s = d.toString().trim(); if (s) console.error('[stderr]', s.slice(0, 300)); });
proc.on('error', e => { console.error('spawn 失败:', e.message); process.exit(1); });

function send(method, params = {}) {
  const id = ++msgId;
  process.stdout.write(`>>> ${method}\n`);
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    setTimeout(() => { pending.delete(id); reject(new Error(`超时: ${method}`)); }, 120000);
  });
}

try {
  // 初始化
  const init = await send('initialize', {
    protocolVersion: '2024-11-05', capabilities: {},
    clientInfo: { name: 'qiling-gen', version: '1.0.0' },
  });
  console.log('服务端:', init.result?.serverInfo?.name, init.result?.serverInfo?.version);
  send('notifications/initialized', {}).catch(() => {});

  // 列出已有项目
  console.log('\n--- 列出项目 ---');
  const listRes = await send('tools/call', { name: 'stitch_list_projects', arguments: {} });
  const listText = listRes.result?.content?.[0]?.text || JSON.stringify(listRes.result);
  console.log(listText.slice(0, 600));

  // 找已有项目或创建
  let projectId = null;
  const matches = listText.match(/projects\/(\d+)/g);
  if (matches) {
    for (const m of matches) console.log('  已有:', m);
    projectId = matches[0];
  }
  if (!projectId) {
    console.log('\n--- 创建项目 ---');
    const createRes = await send('tools/call', {
      name: 'stitch_create_project',
      arguments: { name: '开仙门-器灵选择界面', confirm: true },
    });
    const ct = createRes.result?.content?.[0]?.text || JSON.stringify(createRes.result);
    console.log(ct.slice(0, 300));
    const cm = ct.match(/projects\/(\d+)/);
    if (cm) projectId = cm[0];
  }
  console.log('使用项目:', projectId);

  // ===== 真实匹配开仙门设计的 Prompt =====
  console.log('\n--- 生成器灵选择界面 ---\n');

  const prompt = [
    'Design a landscape (1280x720) game UI: Chinese Xianxia spirit selection screen "选择器灵".',
    '',
    'ART: 16-bit pixel RPG + Chinese ink-wash painting. Dark mystical xianxia atmosphere.',
    '',
    'BACKGROUND: Dark gradient sky #0a0a14→#1a1a2e→#16213e, semi-transparent black overlay.',
    '',
    'COLORS: bg #1a1a2e, gold #f0c040, jade #4ecca3, ink #0a0a14, card bg #120f22, border #665588.',
    '',
    'LAYOUT (centered, 1280x720):',
    '- Top: Title "选择器灵" bold gold 32px, subtitle "选好后点击开始游戏，进入经营阶段" 14px gray',
    '- Center: 3 spirit cards in horizontal row, gap 32px',
    '- Bottom: Gold gradient button "开 始 游 戏" 200x48 pill-shaped',
    '',
    'CARD 1 (百世书, Unlocked): 240x320, gold glow border, book icon, name "百世书" in gold, desc "蕴藏万界知识", badge "免死护佑", SELECTED state',
    'CARD 2 (诛仙剑, Locked): dashed gray border, sword icon dimmed, name "???", label "通关一次解锁", opacity 45%',
    'CARD 3 (神农鼎, Locked): dashed gray border, cauldron icon dimmed, name "???", label "通关两次解锁", opacity 45%',
    '',
    'Cards rounded 8px, card bg dark purple #120f22. Locked cards use dashed #555 borders. Chinese calligraphy style.',
  ].join('\n');

  const genRes = await send('tools/call', {
    name: 'stitch_generate_screen_from_text',
    arguments: { projectId, prompt, confirm: true },
  });
  const genText = genRes.result?.content?.[0]?.text || JSON.stringify(genRes.result);
  console.log(genText.slice(0, 2000));
  console.log('\n=== 完成 ===');

} catch (err) {
  console.error('错误:', err.message);
} finally {
  setTimeout(() => { proc.kill(); process.exit(0); }, 3000);
}
