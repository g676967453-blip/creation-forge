#!/usr/bin/env node
// 点兵成将 全自动游戏循环
// 主循环: 截图 → OCR → AI决策 → ADB执行 → 重复
// 同时通过 OBS 录制全程

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { MumuCtl } from './lib/mumuctl.mjs';
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';
import { ObsController } from './lib/obs.mjs';
import { GameAI } from './lib/ai.mjs';

// === 加载配置 ===
const configPath = join(import.meta.dirname, 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

// === 初始化模块 ===
const mumu = new MumuCtl(config.mumu);
const ai = new GameAI(config.game);
let obs = null;
if (config.obs) {
  obs = new ObsController(config.obs);
}

// === 确保目录存在 ===
const dirs = [config.loop.screenshotDir, config.loop.ocrOutDir];
dirs.forEach(d => { if (!existsSync(d)) mkdirSync(d, { recursive: true }); });

// === 日志 ===
function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(config.loop.logFile, line + '\n', 'utf8');
  } catch (e) { /* ignore */ }
}

// === 屏幕分辨率缓存 ===
let screenSize = { width: 1280, height: 720 };

// === 安全等待 ===
const sleep = ms => new Promise(r => setTimeout(r, ms));

// === ADB 分段录屏 ===
function startAdbRecorder(adbExe, deviceSerial, outDir) {
  const recDir = join(outDir, 'records');
  mkdirSync(recDir, { recursive: true });
  let index = 0;
  let activeProcess = null;
  let stopped = false;

  async function recordOne() {
    if (stopped) return;
    const remoteFile = `/sdcard/bot_record_${String(index).padStart(3, '0')}.mp4`;
    const localFile = join(recDir, `record_${String(index).padStart(3, '0')}.mp4`);
    index++;

    await new Promise((resolve) => {
      activeProcess = spawn('"' + adbExe + '"', ['-s', deviceSerial, 'shell', 'screenrecord', '--time-limit', '180', '--bit-rate', '4000000', remoteFile], { shell: true });
      activeProcess.on('close', async (code) => {
        activeProcess = null;
        if (!stopped) {
          // pull and remove remote file
          spawn('"' + adbExe + '"', ['-s', deviceSerial, 'pull', remoteFile, localFile], { shell: true }).on('close', () => {
            spawn('"' + adbExe + '"', ['-s', deviceSerial, 'shell', 'rm', remoteFile], { shell: true });
          });
        }
        resolve();
      });
    });

    if (!stopped) {
      setImmediate(recordOne);
    }
  }

  recordOne();

  return {
    stop: () => {
      stopped = true;
      if (activeProcess) {
        activeProcess.kill('SIGINT');
      }
    }
  };
}

// === 截图并 OCR ===
async function captureAndOcr(iter) {
  const shotPath = join(config.loop.screenshotDir, `f${iter}.png`);
  const ocrPath = join(config.loop.ocrOutDir, `f${iter}.txt`);

  // 截图
  const shotR = await mumu.screenshot(shotPath);
  if (!shotR.ok) {
    log(`截图失败: ${shotR.error}`);
    return null;
  }

  // OCR
  const ocrR = await ocrImage(shotPath, ocrPath);
  if (!ocrR.ok) {
    log(`OCR 失败: ${ocrR.error}`);
    return { shotPath, lines: [], fullText: '', parsed: {}, states: [] };
  }

  const parsed = parseOcrText(ocrR.lines);
  const states = detectUIState(ocrR.lines);

  return {
    shotPath,
    lines: ocrR.lines,
    fullText: ocrR.fullText,
    parsed,
    states
  };
}

// === 执行动作 ===
async function executeAction(action, decision) {
  log(`🎯 动作: ${action.desc}`);

  switch (action.type) {
    case 'tap':
      log(`   点击 (${action.x}, ${action.y})`);
      return mumu.tap(action.x, action.y);

    case 'swipe':
      return mumu.swipe(action.x1, action.y1, action.x2, action.y2, action.durationMs || 300);

    case 'key': {
      const keyMap = {
        'BACK': 4, 'HOME': 3, 'TASK': 187,
        'ENTER': 66, 'SPACE': 62, 'DELETE': 67
      };
      const code = keyMap[action.key] || action.key;
      log(`   按键 ${action.key} (code=${code})`);
      return mumu.keyEvent(code);
    }

    case 'wait':
      log(`   等待 ${action.durationMs}ms`);
      await sleep(action.durationMs);
      return { ok: true };

    case 'ask_ai':
      // 需要外部 AI 介入
      log(`   ⚡ 需要 AI 决策！状态: ${decision.reason}`);
      log(`   OCR 预览: ${decision.ocrPreview?.join(' | ') || 'N/A'}`);
      // 暂停循环，等待外部指令
      return { ok: true, needHumanOrAI: true, decision };

    default:
      log(`   未知动作类型: ${action.type}`);
      return { ok: false, error: 'unknown action type' };
  }
}

// === 主循环 ===
async function mainLoop() {
  log('═══════════════════════════════════');
  log('  点兵成将 全自动游戏循环 启动');
  log('═══════════════════════════════════');

  // 0. 确保 MuMu 已启动
  log('检查 MuMu 连接...');
  const booted = await mumu.isBooted();
  if (!booted) {
    log('MuMu 未启动，尝试启动...');
    await mumu.launch();
    await sleep(15000); // 等待启动
  }
  log('MuMu 就绪 ✓');

  // 1. 获取屏幕分辨率
  screenSize = await mumu.getScreenSize();
  log(`屏幕分辨率: ${screenSize.width}x${screenSize.height}`);

  // 2. 启动游戏
  log(`启动游戏: ${config.game.package}`);
  const startR = mumu.startApp(config.game.package, config.game.activity);
  log(startR.ok ? '游戏启动命令已发送' : `启动警告: ${startR.output}`);
  await sleep(5000); // 等待加载

  // 3. 设置输出目录与录制
  const runDir = join(import.meta.dirname, `run_${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}`);
  mkdirSync(runDir, { recursive: true });
  mkdirSync(join(runDir, 'screenshots'), { recursive: true });
  log(`运行目录: ${runDir}`);

  const adbExe = config.mumu.adbExe;
  const deviceSerial = `${config.mumu.adbHost}:${config.mumu.adbPort}`;
  const adbRecorder = startAdbRecorder(adbExe, deviceSerial, runDir);
  log('ADB 分段录屏已启动');

  // 3b. 连接 OBS 并开始录制（可选）
  if (obs) {
    try {
      await obs.connect();
      log('OBS WebSocket 已连接 ✓');
      const recR = await obs.startRecording();
      log(recR.ok ? 'OBS 录制开始 ✓' : `OBS 录制: ${recR.error || '已就绪'}`);
    } catch (e) {
      log(`OBS 连接失败: ${e.message}，跳过录制`);
      obs = null;
    }
  }

  // 4. 主循环
  let iter = 0;
  const maxIter = config.loop.maxIterations || 0;
  const durationMinutes = config.loop.durationMinutes || 30;
  const startTime = Date.now();
  let running = true;

  const shutdown = async () => {
    running = false;
    log('收到停止信号，正在关闭...');
    adbRecorder.stop();
    if (obs) {
      await obs.stopRecording();
      obs.close();
    }
    // 等待最后一段 ADB 录屏落地
    await sleep(6000);
    log('循环已停止');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (running) {
    iter++;
    const elapsedMin = (Date.now() - startTime) / 60000;
    if (maxIter > 0 && iter > maxIter) {
      log(`达到最大迭代次数 ${maxIter}`);
      break;
    }
    if (elapsedMin >= durationMinutes) {
      log(`达到运行时长 ${durationMinutes} 分钟`);
      break;
    }

    log(`\n── 迭代 #${iter} ──`);

    try {
      // 4a. 截图 + OCR
      const cap = await captureAndOcr(iter);
      if (!cap) {
        log('截图/OCR 失败，等待后重试');
        await sleep(2000);
        continue;
      }

      if (cap.lines.length > 0) {
        log(`OCR (${cap.lines.length}行): ${cap.lines.slice(0, 3).join(' | ')}`);
      } else {
        log('OCR 未检测到文字');
      }

      // 4b. AI 决策
      const decision = ai.analyze(cap.lines, cap.parsed, cap.states);
      log(`🧠 状态: ${decision.context?.state || '?'}, 决策: ${decision.reason}`);

      // 4c. 转 ADB 动作
      const action = ai.toAction(decision, screenSize);

      // 4d. 执行动作
      const execR = await executeAction(action, decision);

      // 4e. 处理需要 AI 的情况
      if (execR.needHumanOrAI) {
        log('─────────────────');
        log('⚠️  遇到需要外部决策的情况');
        log('   游戏状态: ' + decision.context?.state);
        log('   OCR 数据: ' + JSON.stringify(decision.parsed));
        log('   界面状态: ' + JSON.stringify(decision.states));
        log('─────────────────');

        // 写入决策请求文件
        const aidRequest = {
          timestamp: new Date().toISOString(),
          iteration: iter,
          decision,
          ocrLines: cap.lines,
          parsedData: cap.parsed,
          uiStates: cap.states,
          screenshot: cap.shotPath,
        };
        writeFileSync(
          join(import.meta.dirname, 'aid_request.json'),
          JSON.stringify(aidRequest, null, 2),
          'utf8'
        );

        log('决策请求已写入 aid_request.json，暂停等待分析...');
        log('按 Ctrl+C 停止或等待 10 秒后重试');

        // 等待后重试（也可以在此处被外部 AI 中断）
        await sleep(10000);
        ai.context.stuckCount = 0; // 重置卡住计数
      }

    } catch (e) {
      log(`迭代错误: ${e.message}`);
      await sleep(3000);
    }

    // 等待间隔
    await sleep(config.loop.intervalMs);
  }

  await shutdown();
}

// === 启动 ===
mainLoop().catch(e => {
  log(`致命错误: ${e.message}`);
  console.error(e);
  process.exit(1);
});
