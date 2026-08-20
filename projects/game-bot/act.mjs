// 执行动作：tap x y | key BACK | swipe x1 y1 x2 y2 | wait ms
import { readFileSync } from 'fs';
import { join } from 'path';
import { MumuCtl } from './lib/mumuctl.mjs';

const config = JSON.parse(readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
const mumu = new MumuCtl(config.mumu);

const cmd = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (cmd) {
    case 'tap':
      console.log(`点击 (${args[0]}, ${args[1]})`);
      await mumu.tap(Number(args[0]), Number(args[1]));
      break;
    case 'swipe':
      console.log(`滑动 (${args[0]},${args[1]}) → (${args[2]},${args[3]})`);
      await mumu.swipe(Number(args[0]), Number(args[1]), Number(args[2]), Number(args[3]), Number(args[4]) || 300);
      break;
    case 'key':
      const map = { BACK: 4, HOME: 3, TASK: 187, ENTER: 66, SPACE: 62, DELETE: 67 };
      const code = map[args[0]] || Number(args[0]);
      console.log(`按键 ${args[0]} (code=${code})`);
      await mumu.keyEvent(code);
      break;
    case 'longpress':
      console.log(`长按 (${args[0]}, ${args[1]})`);
      await mumu.longPress(Number(args[0]), Number(args[1]), Number(args[2]) || 1000);
      break;
    case 'wait':
      const ms = Number(args[0]) || 1000;
      console.log(`等待 ${ms}ms`);
      await new Promise(r => setTimeout(r, ms));
      break;
    case 'home':
      await mumu.goHome();
      console.log('回桌面');
      break;
    case 'back':
      await mumu.goBack();
      console.log('返回');
      break;
    default:
      console.log('用法: node act.mjs <tap|swipe|key|longpress|wait|home|back> [参数]');
      console.log('  tap x y');
      console.log('  swipe x1 y1 x2 y2 [duration]');
      console.log('  key BACK|HOME|TASK|ENTER');
      console.log('  wait [ms]');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
