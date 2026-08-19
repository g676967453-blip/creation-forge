// MuMu 模拟器控制器 —— 封装 mumu-cli 的 ADB 和 control 功能
import { execSync, spawn } from 'child_process';
import { join } from 'path';

export class MumuCtl {
  constructor(config) {
    this.cli = config.cli;
    this.adbExe = config.adbExe;
    this.vmIndex = config.vmIndex;
    this.adbHost = config.adbHost;
    this.adbPort = config.adbPort;
    this.deviceSerial = `${this.adbHost}:${this.adbPort}`;
  }

  _run(args, timeout = 15000) {
    const cmd = `"${this.cli}" ${args}`;
    try {
      const out = execSync(cmd, { timeout, encoding: 'utf8', windowsHide: true });
      return { ok: true, output: out };
    } catch (e) {
      return { ok: false, output: e.stdout || '', error: e.stderr || e.message };
    }
  }

  // === VM 控制 ===
  launch() {
    return this._run(`control --vmindex ${this.vmIndex} launch`);
  }

  shutdown() {
    return this._run(`control --vmindex ${this.vmIndex} shutdown`);
  }

  async info() {
    const r = this._run(`info --vmindex ${this.vmIndex}`);
    if (r.ok) {
      try {
        return { ok: true, data: JSON.parse(r.output) };
      } catch {
        return { ok: false, error: 'parse failed', raw: r.output };
      }
    }
    return r;
  }

  async isBooted() {
    const r = await this.info();
    return r.ok && r.data && r.data.is_android_started;
  }

  // === ADB 操作 ===
  adb(cmdWithArgs) {
    return this._run(`adb --vmindex ${this.vmIndex} --cmd "${cmdWithArgs}"`);
  }

  // 截图 (两步法: 保存到设备再拉取，确保 PNG 格式兼容)
  async screenshot(outPath) {
    try {
      const tmpDevice = '/sdcard/mumu_bot_screen.png';
      // 1. 在设备上截图
      execSync(
        `"${this.adbExe}" -s ${this.deviceSerial} shell screencap -p ${tmpDevice}`,
        { timeout: 10000, windowsHide: true }
      );
      // 2. 拉取到本地
      execSync(
        `"${this.adbExe}" -s ${this.deviceSerial} pull ${tmpDevice} "${outPath}"`,
        { timeout: 10000, windowsHide: true }
      );
      return { ok: true, path: outPath };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // 点击坐标
  tap(x, y) {
    return this.adb(`shell input tap ${Math.round(x)} ${Math.round(y)}`);
  }

  // 滑动
  swipe(x1, y1, x2, y2, durationMs = 300) {
    return this.adb(`shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${durationMs}`);
  }

  // 长按
  longPress(x, y, durationMs = 1000) {
    return this.adb(`shell input swipe ${Math.round(x)} ${Math.round(y)} ${Math.round(x)} ${Math.round(y)} ${durationMs}`);
  }

  // 按键
  keyEvent(keyCode) {
    return this.adb(`shell input keyevent ${keyCode}`);
  }

  // 输入文本
  inputText(text) {
    // 对中文等特殊字符需要转义
    const escaped = text.replace(/"/g, '\\"').replace(/ /g, '%s');
    return this.adb(`shell input text "${escaped}"`);
  }

  // 启动应用
  startApp(pkg, activity) {
    return this.adb(`shell am start -n ${pkg}/${activity}`);
  }

  // 强制停止应用
  stopApp(pkg) {
    return this.adb(`shell am force-stop ${pkg}`);
  }

  // 返回桌面
  goHome() {
    return this.keyEvent(3);
  }

  // 返回
  goBack() {
    return this.keyEvent(4);
  }

  // 获取屏幕分辨率
  async getScreenSize() {
    const r = this.adb('shell wm size');
    if (r.ok) {
      const m = r.output.match(/(\d+)x(\d+)/);
      if (m) return { width: parseInt(m[1]), height: parseInt(m[2]) };
    }
    return { width: 1280, height: 720 };
  }

  // 获取当前前台应用
  async getCurrentApp() {
    const r = this.adb('shell dumpsys window | grep mCurrentFocus');
    if (r.ok) {
      const m = r.output.match(/u0\s+([^/]+)\//);
      if (m) return m[1];
    }
    return null;
  }
}
