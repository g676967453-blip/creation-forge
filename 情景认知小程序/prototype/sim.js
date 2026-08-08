// 财富模拟原型 - 《中了500万》MVP 难度曲线验证
// 运行: node sim.js
// 三种策略: naive(大众新手,偏向诱惑选项) / chives(韭菜,专选坏选项) / steady(稳健,专选好选项)
// 另保留 random(均匀随机)作为参照
// 每种跑 N 局,统计结局分布;另输出一局稳健策略的完整回放用于人工检查

const N = 2000;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function newState() {
  const s = {
    cash: 5000000, stable: 0, growth: 0, property: 0, debt: 0,
    expense: 10000, income: 8000, scam: false, locked: false, concentrate: false,
    hits: {}
  };
  ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach(p => s.hits[p] = { good: 0, bad: 0 });
  return s;
}
function mark(s, p, good) { s.hits[p][good ? 'good' : 'bad']++; }

// 事件池: id, name, stage, options[{t,g:[],b:[],f}]
const EVENTS = [
  {
    id: 1, name: '第一笔安排', stage: 1,
    options: [
      { t: '留60万货基当应急金,其余配置到稳健+进取', g: ['p1'], f: s => { s.cash -= 600000; s.cash -= 4400000; s.stable += 2000000; s.growth += 2400000; } },
      { t: '全部存5年定期吃利息', g: [], f: s => { s.cash -= 5000000; s.stable += 5000000; s.locked = true; } },
      { t: '发小说有稳赚项目,全投进去', b: ['p3'], f: s => { s.cash -= 5000000; s.scam = true; } }
    ]
  },
  {
    id: 2, name: '亲戚来了', stage: 1,
    options: [
      { t: '借50万,都是一家人', b: ['p6'], f: s => { s.cash -= 500000; } },
      { t: '借5万,明说不用还', g: ['p6'], f: s => { s.cash -= 50000; } },
      { t: '不借,帮他找正规渠道', g: ['p6'], f: () => {} }
    ]
  },
  {
    id: 3, name: '换车冲动', stage: 1,
    options: [
      { t: '全款买100万豪车', b: ['p5'], f: s => { s.cash -= 1000000; s.expense += 20000; } },
      { t: '买20万代步车+80万小公寓收租', g: ['p5'], f: s => { s.cash -= 200000; s.property += 800000; } },
      { t: '不买,旧车还能开', g: ['p2'], f: () => {} }
    ]
  },
  {
    id: 4, name: '杀猪盘', stage: 2,
    options: [
      { t: '投50万试试水', b: ['p3'], f: s => { s.cash -= 500000; s.scam = true; } },
      { t: '拉黑退群', g: ['p3'], f: () => {} },
      { t: '先观察三个月', g: [], f: () => {} }
    ]
  },
  {
    id: 5, name: '发小开店', stage: 2,
    options: [
      { t: '出100万,兄弟情义', b: ['p5', 'p6'], f: s => { s.cash -= 1000000; } },
      { t: '只出20万,签好分红退出条款', g: ['p5'], f: s => { s.cash -= 200000; s.cash += 100000; } },
      { t: '不出钱,帮他做市场调研', g: [], f: () => {} }
    ]
  },
  {
    id: 6, name: '理财经理', stage: 2,
    options: [
      { t: '买200万保本12%', b: ['p3'], f: s => { s.cash -= 2000000; s.scam = true; } },
      { t: '追问底层资产,发现是包装,拒绝', g: ['p3'], f: () => {} },
      { t: '买10万试试', b: ['p3'], f: s => { s.cash -= 100000; s.scam = true; } }
    ]
  },
  {
    id: 7, name: '换大房子', stage: 2, family: 'house',
    options: [
      { t: '换,月供吃掉60%现金流', b: ['p5'], f: s => { s.cash -= 2000000; s.expense += 30000; } },
      { t: '不换,现有住房够住', g: ['p2'], f: () => {} },
      { t: '换改善型,月供≤30%', g: ['p5'], f: s => { s.cash -= 1000000; s.expense += 10000; } }
    ]
  },
  {
    id: 8, name: '意外失业', stage: 2,
    options: [
      { t: '靠应急金撑过去', g: ['p1'], f: s => { s.cash -= 3 * s.expense; } },
      { t: '卖股票套现', b: ['p1'], f: s => { s.cash -= 3 * s.expense; s.growth *= 0.85; } },
      { t: '借消费贷过渡', b: ['p2', 'p1'], f: s => { s.debt += 100000; s.expense += 1000; } }
    ]
  },
  {
    id: 9, name: '牛市来了', stage: 3,
    options: [
      { t: '卖房All in股市', b: ['p4'], f: s => { s.growth += s.property + 0.8 * s.cash; s.cash *= 0.2; s.property = 0; s.concentrate = true; s.growth *= 1.5; } },
      { t: '按原计划定投,不动', g: ['p4'], f: s => { s.cash -= 500000; s.growth += 500000; s.growth *= 1.5; } },
      { t: '追加20%仓位', g: [], f: s => { const a = 0.2 * s.cash; s.cash -= a; s.growth += a; s.growth *= 1.5; } }
    ]
  },
  {
    id: 10, name: '内部消息', stage: 3,
    options: [
      { t: '重仓300万', b: ['p4'], f: s => { s.cash -= 3000000; s.growth += 1200000; } },
      { t: '买5万玩玩', g: [], f: s => { s.cash -= 50000; s.growth += 50000; } },
      { t: '不碰', g: ['p4'], f: () => {} }
    ]
  },
  {
    id: 11, name: '担保', stage: 3,
    options: [
      { t: '签了,一家人', b: ['p6'], f: s => { s.debt += 2000000; } },
      { t: '拒绝,担保=替他还债', g: ['p6'], f: () => {} },
      { t: '帮他对接正规渠道,不担保', g: ['p6'], f: () => {} }
    ]
  },
  {
    id: 12, name: '大病来袭', stage: 3,
    options: [
      { t: '有商业险,保险覆盖80%', g: ['p1'], f: s => { s.cash -= 100000; } },
      { t: '裸奔,卖房卖资产凑钱', b: ['p1'], f: s => { s.cash -= 500000; s.growth *= 0.9; s.property *= 0.9; } },
      { t: '水滴筹', b: ['p1'], f: s => { s.cash -= 500000; } }
    ]
  },
  {
    id: 13, name: 'P2P暴雷', stage: 3, needScam: true,
    options: [
      { t: '投得不多,认栽', g: [], f: () => {} },
      { t: '全投进去了,血本无归', b: ['p3'], f: () => {} },
      { t: '再投新平台回本', b: ['p3'], f: s => { s.cash -= 500000; } }
    ]
  },
  {
    id: 14, name: '熊市暴跌', stage: 4,
    options: [
      { t: '割肉离场', b: ['p4'], f: s => { s.growth *= s.concentrate ? 0.6 : 0.7; } },
      { t: '坚持定投持有', g: ['p4'], f: s => { s.growth *= s.concentrate ? 0.6 : 0.7; s.growth *= 1.43; } },
      { t: '有分寸加仓', g: [], f: s => { s.growth *= s.concentrate ? 0.6 : 0.7; s.cash -= 200000; s.growth += 260000; } }
    ]
  },
  {
    id: 15, name: '二度借钱', stage: 4,
    options: [
      { t: '再借30万,不然之前的要不回来', b: ['p6'], f: s => { s.cash -= 300000; } },
      { t: '不借,之前那笔当送他了', g: ['p6'], f: () => {} }
    ]
  },
  {
    id: 16, name: '养老规划', stage: 4,
    options: [
      { t: '开始定投养老组合', g: ['p4'], f: s => { s.cash -= 300000; s.growth += 300000; } },
      { t: '儿孙自有儿孙福', b: ['p2'], f: () => {} }
    ]
  },
  {
    id: 17, name: '彩票再来', stage: 4,
    options: [
      { t: '买10块玩玩', g: [], f: s => { s.cash -= 10; } },
      { t: '买10万搏一搏', b: ['p2'], f: s => { s.cash -= 100000; } }
    ]
  },
  {
    id: 18, name: '继承纠纷', stage: 4,
    options: [
      { t: '放弃,不争', g: [], f: () => {} },
      { t: '走法律程序,该拿的拿', g: ['p5'], f: s => { s.property += 1500000; } }
    ]
  },
  {
    id: 19, name: '同学聚会', stage: 1,
    options: [
      { t: '投50万内部名额', b: ['p3'], f: s => { s.cash -= 500000; s.scam = true; } },
      { t: '不投,婉拒', g: ['p3'], f: () => {} },
      { t: '投5万意思一下', b: ['p3'], f: s => { s.cash -= 50000; s.scam = true; } }
    ]
  },
  {
    id: 20, name: '丈母娘买房', stage: 1, family: 'house',
    options: [
      { t: '全款买300万,掏空现金', b: ['p5'], f: s => { s.cash -= 3000000; } },
      { t: '按揭买,月供≤30%', g: ['p5'], f: s => { s.cash -= 1000000; s.expense += 10000; } },
      { t: '先租房,攒够首付再说', g: ['p2'], f: () => {} }
    ]
  },
  {
    id: 21, name: '亲戚住院', stage: 2,
    options: [
      { t: '出2万表达心意', g: ['p6'], f: s => { s.cash -= 20000; } },
      { t: '出20万,写借条', g: [], f: s => { s.cash -= 200000; } },
      { t: '一分不出', b: ['p6'], f: () => {} }
    ]
  },
  {
    id: 22, name: '借名贷款', stage: 2,
    options: [
      { t: '答应,以你名义贷100万', b: ['p6'], f: s => { s.debt += 1000000; } },
      { t: '拒绝,借名=你背债', g: ['p6'], f: () => {} },
      { t: '不借名,直接借他10万', g: ['p6'], f: s => { s.cash -= 100000; } }
    ]
  },
  {
    id: 23, name: '币圈暴富', stage: 3,
    options: [
      { t: '投100万,三个月翻10倍', b: ['p3'], f: s => { s.cash -= 1000000; s.scam = true; } },
      { t: '不碰', g: ['p3'], f: () => {} },
      { t: '投1万玩玩', b: ['p3'], f: s => { s.cash -= 10000; s.scam = true; } }
    ]
  },
  {
    id: 24, name: '海外存款', stage: 3,
    options: [
      { t: '投100万,年化8%', b: ['p3'], f: s => { s.cash -= 1000000; s.scam = true; } },
      { t: '查资质,发现是骗局', g: ['p3'], f: () => {} },
      { t: '投20万试水', b: ['p3'], f: s => { s.cash -= 200000; s.scam = true; } }
    ]
  },
  {
    id: 25, name: '免费讲座', stage: 2,
    options: [
      { t: '买5万财富课', b: ['p3'], f: s => { s.cash -= 50000; } },
      { t: '听完就走', g: ['p3'], f: () => {} },
      { t: '买99元课意思一下', g: [], f: s => { s.cash -= 99; } }
    ]
  },
  {
    id: 26, name: '板块轮动', stage: 3,
    options: [
      { t: '割肉换赛道', b: ['p4'], f: s => { s.growth *= 0.9; } },
      { t: '继续定投,不追热点', g: ['p4'], f: () => {} },
      { t: '换一半', g: [], f: s => { s.growth *= 0.95; } }
    ]
  },
  {
    id: 27, name: '楼市机会', stage: 4,
    options: [
      { t: '全款买200万,押注明年涨30%', b: ['p4'], f: s => { s.cash -= 2000000; s.property += 2000000; } },
      { t: '买100万,留一半现金', g: ['p4'], f: s => { s.cash -= 1000000; s.property += 1000000; } },
      { t: '不买,继续定投', g: ['p4'], f: s => { s.cash -= 500000; s.growth += 500000; } }
    ]
  },
  {
    id: 28, name: '经济下行', stage: 3,
    options: [
      { t: '跟着朋友卖资产', b: ['p4'], f: s => { s.growth *= 0.92; } },
      { t: '不动,长期计划不变', g: ['p4'], f: () => {} },
      { t: '趁机加一点仓', g: [], f: s => { s.cash -= 200000; s.growth += 200000; } }
    ]
  },
  {
    id: 29, name: '奢侈品', stage: 1,
    options: [
      { t: '买10万的包', b: ['p2'], f: s => { s.cash -= 100000; } },
      { t: '不买,带她去旅行', g: ['p2'], f: s => { s.cash -= 20000; } },
      { t: '买,约定今年最后一笔', g: [], f: s => { s.cash -= 100000; } }
    ]
  },
  {
    id: 30, name: '孩子教育', stage: 4,
    options: [
      { t: '上国际学校,一年30万', b: ['p2'], f: s => { s.expense += 30000; } },
      { t: '公立+兴趣班', g: ['p2'], f: () => {} },
      { t: '公立,自己多陪', g: ['p2'], f: () => {} }
    ]
  }
];

const BY_ID = {};
EVENTS.forEach(e => BY_ID[e.id] = e);

function tick(s) {
  s.cash += s.income * 12; // 工资收入
  s.cash *= 1.02; s.stable *= 1.03; s.growth *= 1.07; s.property *= 1.03;
  s.cash += s.property * 0.04; // 租金
  s.debt *= 1.10; // 负债利息
  s.cash -= s.expense * 12; // 生活支出
  if (s.locked && s.cash < s.expense * 12 && s.stable > 0) { // 定期提前支取损失
    const need = s.expense * 12 - s.cash;
    const take = Math.min(s.stable, need);
    s.stable -= take; s.cash += take * 0.98;
  }
  if (s.cash < 0) {
    // 现金不足:先卖资产救急(进取9折/稳健95折/房产85折急售),实在没有才负债
    let need = -s.cash; s.cash = 0;
    const sellFrom = (bucket, rate) => {
      if (need <= 0) return;
      const sell = Math.min(s[bucket], need / rate);
      s[bucket] -= sell;
      s.cash += sell * rate;
      need = Math.max(0, -s.cash);
    };
    sellFrom('growth', 0.9);
    sellFrom('stable', 0.95);
    sellFrom('property', 0.85);
    if (need > 0) s.debt += need;
  }
}

function netWorth(s) { return s.cash + s.stable + s.growth + s.property - s.debt; }

function tier(nw) {
  if (nw < 0) return '破产';
  if (nw < 1000000) return '返贫';
  if (nw < 5000000) return '缩水';
  if (nw < 10000000) return '守住';
  return '自由';
}

function drawStage(st, s, rng, count, win, usedFam, exclude) {
  const pool = EVENTS.filter(e => e.stage === st && e.id !== exclude && (!e.needScam || s.scam) && !usedFam.has(e.family || '')).map(e => e.id);
  const picks = [];
  const p = pool.slice();
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * p.length);
    picks.push(p.splice(idx, 1)[0]);
  }
  const [lo, hi] = win[st];
  const years = {};
  picks.forEach(id => {
    const fam = BY_ID[id].family;
    if (fam) usedFam.add(fam);
    let y;
    do { y = lo + Math.floor(rng() * (hi - lo + 1)); } while (years[y]);
    years[y] = id;
  });
  return years;
}

function pickOption(s, ev, policy, rng) {
  const scored = ev.options.map((o, i) => ({ i, score: (o.g || []).length - (o.b || []).length }));
  if (policy === 'steady') scored.sort((a, b) => b.score - a.score);
  else if (policy === 'chives') scored.sort((a, b) => a.score - b.score);
  else if (policy === 'naive') {
    // 大众新手:被情绪吸引——55% 选最坏、30% 选中间、15% 选最好
    const sorted = scored.slice().sort((a, b) => a.score - b.score);
    const r = rng();
    if (r < 0.55) return ev.options[sorted[0].i];
    if (r < 0.85) return ev.options[sorted[1] ? sorted[1].i : sorted[0].i];
    return ev.options[sorted[sorted.length - 1].i];
  }
  else return ev.options[Math.floor(rng() * ev.options.length)];
  return ev.options[scored[0].i];
}

function run(policy, rng, log) {
  const s = newState();
  const win = { 1: [1, 3], 2: [4, 7], 3: [8, 13], 4: [14, 20] };
  const usedFam = new Set();
  const win1 = { ...win, 1: [2, 3] };
  const e1 = drawStage(1, s, rng, 2, win1, usedFam, 1);
  e1[1] = 1; // 第一笔安排固定第1年
  const e2 = drawStage(2, s, rng, 3, win, usedFam);
  let e3 = {}, e4 = {};
  for (let y = 1; y <= 20; y++) {
    if (y === 8) e3 = drawStage(3, s, rng, 3, win, usedFam);
    if (y === 14) e4 = drawStage(4, s, rng, 3, win, usedFam);
    tick(s);
    const map = y <= 3 ? e1 : y <= 7 ? e2 : y <= 13 ? e3 : e4;
    if (map[y]) {
      const ev = BY_ID[map[y]];
      const opt = pickOption(s, ev, policy, rng);
      (opt.g || []).forEach(p => mark(s, p, true));
      (opt.b || []).forEach(p => mark(s, p, false));
      opt.f(s);
      if (log) log.push({ y, name: ev.name, opt: opt.t, cash: Math.round(s.cash), nw: Math.round(netWorth(s)) });
    }
  }
  return { s, nw: netWorth(s), tier: tier(netWorth(s)) };
}

const rng = mulberry32(42);
const policies = { naive: 'naive', random: 'random', chives: 'chives', steady: 'steady' };
const results = {};
Object.keys(policies).forEach(name => {
  const dist = {};
  let sum = 0, med = [];
  for (let i = 0; i < N; i++) {
    const r = run(policies[name], rng);
    dist[r.tier] = (dist[r.tier] || 0) + 1;
    sum += r.nw; med.push(r.nw);
  }
  med.sort((a, b) => a - b);
  const pct = k => ((dist[k] || 0) / N * 100).toFixed(1) + '%';
  const fail = ((dist['破产'] || 0) + (dist['返贫'] || 0)) / N * 100;
  const succ = ((dist['守住'] || 0) + (dist['自由'] || 0)) / N * 100;
  results[name] = { dist, pct, fail, succ, mean: Math.round(sum / N), median: Math.round(med[N >> 1]) };
});

console.log('=== 结局分布(N=' + N + ') ===');
console.log('策略   破产    返贫    缩水    守住    自由    | 失败率  成功率  中位净资产  均值净资产');
Object.keys(results).forEach(name => {
  const r = results[name];
  console.log(
    name.padEnd(6),
    r.pct('破产').padStart(7), r.pct('返贫').padStart(7), r.pct('缩水').padStart(7),
    r.pct('守住').padStart(7), r.pct('自由').padStart(7), '|',
    r.fail.toFixed(1).padStart(5) + '%', r.succ.toFixed(1).padStart(5) + '%',
    String(r.median).padStart(12), String(r.mean).padStart(12)
  );
});

// 稳健策略完整回放(种子固定)
console.log('\n=== 稳健策略回放(seed=7) ===');
const log = [];
const rng2 = mulberry32(7);
const r = run('steady', rng2, log);
log.forEach(l => console.log('第' + String(l.y).padStart(2) + '年 ' + l.name.padEnd(6) + ' → ' + l.opt + ' | 现金:' + l.cash + ' 净资产:' + l.nw));
console.log('结局:' + r.tier + ' 净资产:' + Math.round(r.nw));
console.log('原则命中:' + JSON.stringify(r.s.hits));

// 最差稳健局分析:找出净资产最低的稳健局并打印完整回放
let worst = null;
for (let seed = 0; seed < 5000; seed++) {
  const lg = [];
  const rr = run('steady', mulberry32(seed), lg);
  if (!worst || rr.nw < worst.nw) worst = { seed, nw: rr.nw, tier: rr.tier, log: lg, hits: rr.s.hits };
}
console.log('\n=== 最差稳健局(seed=' + worst.seed + ', 结局:' + worst.tier + ', 净资产:' + Math.round(worst.nw) + ') ===');
worst.log.forEach(l => console.log('第' + String(l.y).padStart(2) + '年 ' + l.name.padEnd(6) + ' → ' + l.opt + ' | 现金:' + l.cash + ' 净资产:' + l.nw));
console.log('原则命中:' + JSON.stringify(worst.hits));
