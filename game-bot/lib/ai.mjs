// AI 决策引擎 —— 分析游戏画面和 OCR 文字，决定下一步操作
export class GameAI {
  constructor(config) {
    this.config = config;
    this.iteration = 0;
    this.context = {
      state: 'unknown',
      previousState: null,
      stuckCount: 0,
      lastAction: null,
      lastActionTime: 0,
    };
  }

  analyze(ocrLines, parsedData, uiStates) {
    this.iteration++;
    const fullText = ocrLines.join(' ');

    this.context.previousState = this.context.state;

    const decision = this._matchState(fullText, parsedData, uiStates, ocrLines);

    // 卡住检测
    if (this.context.previousState === this.context.state) {
      this.context.stuckCount++;
    } else {
      this.context.stuckCount = 0;
    }

    if (this.context.stuckCount > 15) {
      decision.action = 'stuck_recovery';
      decision.reason = `在 ${this.context.state} 卡住 ${this.context.stuckCount} 次，尝试恢复`;
      this.context.stuckCount = 0;
    }

    decision.iteration = this.iteration;
    decision.context = { ...this.context };
    return decision;
  }

  _matchState(fullText, parsedData, uiStates, ocrLines = []) {
    // 去除 OCR 产生的多余空格
    const compact = fullText.replace(/\s+/g, '');

    // === 登录界面 ===
    if (compact.includes('登录') || compact.includes('注册')) {
      this.context.state = 'login';
      if (compact.includes('开始游戏') || compact.includes('dengxia01')) {
        return { action: 'tap_button', target: '开始游戏', reason: '登录界面，点击开始游戏' };
      }
      if (compact.includes('自动登录')) {
        return { action: 'tap_button', target: '登录按钮', reason: '尝试登录' };
      }
      return { action: 'need_help', reason: '登录界面，需要手动处理' };
    }

    // === 弹窗 ===
    if (compact.includes('确认') && compact.includes('取消')) {
      this.context.state = 'popup';
      return { action: 'tap_button', target: '确认', reason: '弹窗确认' };
    }
    if (compact.includes('关闭') && compact.length < 20) {
      this.context.state = 'popup_close';
      return { action: 'tap_button', target: '关闭', reason: '关闭弹窗' };
    }

    // === 设置界面 ===
    if (uiStates.find(s => s.state === '设置')) {
      this.context.state = 'settings';
      return { action: 'go_back', reason: '退出设置' };
    }

    // === 主界面 ===
    if (uiStates.find(s => s.state === '主界面')) {
      this.context.state = 'main_menu';
      if (compact.includes('英雄')) return { action: 'tap_button', target: '英雄', reason: '进入英雄管理' };
      if (compact.includes('编队')) return { action: 'tap_button', target: '编队', reason: '编队界面' };
      if (compact.includes('商店')) return { action: 'tap_button', target: '商店', reason: '进入商店' };
      return { action: 'explore', reason: '主界面，探索可用功能' };
    }

    // === 天赋选择 ===
    if (compact.includes('天赋') && compact.includes('选择')) {
      this.context.state = 'talent_select';
      // 优先选传说/史诗，其次选稀有
      if (compact.includes('传说') || compact.includes('史诗')) {
        return { action: 'tap_button', target: '天赋选项1', reason: '选择传说天赋' };
      }
      if (compact.includes('稀有')) {
        return { action: 'tap_button', target: '天赋选项2', reason: '选择稀有天赋' };
      }
      return { action: 'tap_button', target: '天赋选项1', reason: '选择第一个天赋' };
    }

    // === 英雄详情 ===
    if (compact.includes('英雄') && (compact.includes('等级') || compact.includes('技能') || compact.includes('DPS'))) {
      this.context.state = 'hero_detail';
      if (compact.includes('技能点数') && !compact.includes('技能点数0')) {
        return { action: 'tap_button', target: '技能', reason: '有可用技能点' };
      }
      if (compact.includes('装饰') || compact.includes('装备')) {
        return { action: 'tap_button', target: '装备/装饰', reason: '管理装备' };
      }
      return { action: 'go_back', reason: '返回主界面' };
    }

    // === 战斗 ===
    if (compact.includes('DPS') || (compact.includes('HP') && compact.includes('攻击'))) {
      this.context.state = 'battle';
      if (compact.includes('技能') && !compact.includes('技能点数0')) {
        return { action: 'tap_button', target: '技能', reason: '释放技能' };
      }
      return { action: 'wait', durationMs: 2000, reason: '战斗中等待' };
    }

    // === 商店 ===
    if (compact.includes('商店') || compact.includes('购买')) {
      this.context.state = 'shop';
      return { action: 'go_back', reason: '离开商店' };
    }

    // === 背包 ===
    if (compact.includes('背包') && !compact.includes('英雄')) {
      this.context.state = 'inventory';
      return { action: 'go_back', reason: '离开背包' };
    }

    // === 游戏中（文字少，主要是画面） ===
    if (ocrLines.length <= 5 && /^\d{2}:\d{2}$/.test(ocrLines[0]?.trim())) {
      this.context.state = 'gameplay_timer';
      // 有计时器 → 可能在战斗中，偶尔点击屏幕保持活跃
      return { action: 'explore', reason: '战斗中，保持活跃' };
    }

    // === 纯游戏画面（极少或无文字） ===
    if (ocrLines.length === 0 || (ocrLines.length <= 3 && ocrLines.every(l => /^[\d\s\/\-%]+$/.test(l)))) {
      this.context.state = 'gameplay';
      return { action: 'explore', reason: '游戏画面中，保持活跃' };
    }

    // === 未知状态 → 需要外部 AI 决策 ===
    this.context.state = 'unknown';
    return {
      action: 'need_help',
      reason: `未知状态: ${ocrLines.slice(0, 3).join(' | ')}`,
      ocrPreview: ocrLines.slice(0, 10),
      parsedData,
      uiStates
    };
  }

  toAction(decision, screenSize) {
    const { width, height } = screenSize;
    const cx = width / 2;
    const cy = height / 2;

    const actionMap = {
      tap_button: () => {
        const target = decision.target || '';
        const pos = this._guessButtonPosition(target, width, height);
        return { type: 'tap', x: pos.x, y: pos.y, desc: `点击 "${target}"` };
      },
      go_back: () => ({ type: 'key', key: 'BACK', desc: '返回' }),
      go_home: () => ({ type: 'key', key: 'HOME', desc: '回桌面' }),
      wait: () => ({ type: 'wait', durationMs: decision.durationMs || 1500, desc: `等待 ${decision.durationMs || 1500}ms` }),
      explore: () => {
        const rx = cx + (Math.random() - 0.5) * width * 0.4;
        const ry = cy + Math.random() * height * 0.3;
        return { type: 'tap', x: Math.round(rx), y: Math.round(ry), desc: '探索点击' };
      },
      stuck_recovery: () => ({ type: 'key', key: 'BACK', desc: '卡住恢复：返回' }),
      need_help: () => ({
        type: 'ask_ai',
        desc: '需要 AI 决策',
        context: decision
      })
    };

    const fn = actionMap[decision.action];
    return fn ? fn() : { type: 'unknown', desc: decision.reason || '？' };
  }

  _guessButtonPosition(keyword, width, height) {
    const map = {
      '登录': { x: 0.5, y: 0.5 },
      '开始游戏': { x: 0.5, y: 0.6 },
      '登录按钮': { x: 0.5, y: 0.5 },
      '确认': { x: 0.55, y: 0.6 },
      '取消': { x: 0.4, y: 0.6 },
      '关闭': { x: 0.9, y: 0.05 },
      '英雄': { x: 0.15, y: 0.85 },
      '背包': { x: 0.3, y: 0.85 },
      '商店': { x: 0.45, y: 0.85 },
      '编队': { x: 0.6, y: 0.85 },
      '技能': { x: 0.7, y: 0.7 },
      '装备': { x: 0.5, y: 0.5 },
      '装备/装饰': { x: 0.5, y: 0.5 },
      '返回': { x: 0.05, y: 0.05 },
      '天赋选项1': { x: 0.5, y: 0.30 },
      '天赋选项2': { x: 0.5, y: 0.45 },
      '天赋选项3': { x: 0.5, y: 0.60 },
      '获得全部': { x: 0.5, y: 0.75 },
    };
    const pos = map[keyword];
    if (pos) return { x: Math.round(pos.x * width), y: Math.round(pos.y * height) };
    return { x: Math.round(0.5 * width), y: Math.round(0.55 * height) };
  }
}
