// OCR 模块 —— 调用 Windows WinRT OCR 引擎提取中文文字
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ocr.ps1 位于仓库根 tools/tbh/ 下；本文件在 game-bot/lib/，向上三级到仓库根。
// 基于 import.meta.dirname 解析，不依赖 J: 盘或进程 cwd。
// 调用时经 winPath 转换为 Windows 反斜杠路径（见 ocrImage）。
const OCR_SCRIPT = join(import.meta.dirname, '../../../tools/tbh/ocr.ps1');

export async function ocrImage(imagePath, outPath, retries = 3) {
  // WinRT API 需要 Windows 风格反斜杠路径
  const winPath = (p) => p.replace(/\//g, '\\');
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = spawnSync('powershell', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', winPath(OCR_SCRIPT),
        '-ImagePath', winPath(imagePath),
        '-OutFile', winPath(outPath)
      ], {
        timeout: 15000,
        encoding: 'utf8',
        windowsHide: true
      });

      if (existsSync(outPath)) {
        const text = readFileSync(outPath, 'utf8');
        const lines = text.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0);
        return { ok: true, lines, fullText: lines.join('\n') };
      }
      // 文件未生成，等一下重试
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      if (attempt === retries - 1) {
        return { ok: false, error: e.message };
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return { ok: false, error: 'OCR output file not created after retries' };
}

// 从 OCR 文本中提取关键数据
export function parseOcrText(lines) {
  // 常见模式匹配
  const patterns = {
    // 血量: 数字 / 数字
    hp: /(\d+)\s*\/\s*(\d+)/,
    // 等级
    level: /Lv\.?\s*(\d+)/i,
    // 金币/货币: 数字后跟"金"或"币"
    gold: /(\d[\d,]*)\s*(金|币|金币)/,
    // 攻击力
    atk: /攻击[力击]?\s*[：:]*\s*(\d+)/,
    // DPS
    dps: /DPS\s*[：:]*\s*(\d+)/,
    // 经验
    exp: /经验\s*[：:]*\s*(\d+)/,
  };

  const result = {};
  const fullText = lines.join(' ');

  for (const [key, regex] of Object.entries(patterns)) {
    const match = fullText.match(regex);
    if (match) {
      result[key] = match[1];
      if (match[2]) result[key + '_full'] = match[0];
    }
  }

  return result;
}

// 检测常见 UI 状态
export function detectUIState(lines) {
  const fullText = lines.join(' ');
  const states = [];

  const checks = {
    '登录界面': ['登录', '注册', '账号', '密码'],
    '主界面': ['背包', '英雄', '商店', '编队'],
    '战斗界面': ['攻击', '技能', '血量', 'DPS'],
    '设置': ['设置', '图形', '声音'],
    '弹窗': ['确认', '取消', '确定'],
    '商店': ['购买', '商店', '价格'],
    '装备': ['装备', '属性', '材料'],
  };

  for (const [state, keywords] of Object.entries(checks)) {
    const matchCount = keywords.filter(kw => fullText.includes(kw)).length;
    if (matchCount >= keywords.length * 0.5) {
      states.push({ state, confidence: matchCount / keywords.length });
    }
  }

  return states.sort((a, b) => b.confidence - a.confidence);
}
