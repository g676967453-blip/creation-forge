// OBS 录制控制 —— 通过 WebSocket v5 协议控制 OBS 录制
import crypto from 'crypto';

export class ObsController {
  constructor(config) {
    this.url = config.wsUrl;
    this.password = config.password;
    this.ws = null;
    this.reqId = 0;
    this.pending = new Map();
    this.ready = false;
    this.readyPromise = null;
  }

  async connect() {
    const ws = new WebSocket(this.url);
    this.ws = ws;
    this.ready = false;

    this.readyPromise = new Promise((resolve, reject) => {
      ws.onopen = () => { /* 等待 Hello */ };

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.op === 0) {
          // Hello
          const d = msg.d;
          console.log('[OBS] Hello, authRequired=' + (d.authentication ? d.authentication.required : false));
          let ident = { rpcVersion: 1 };
          if (this.password) {
            const a = d.authentication || {};
            const secret = crypto.createHash('sha256')
              .update(this.password + a.salt).digest('base64');
            const auth = crypto.createHash('sha256')
              .update(secret + a.challenge).digest('base64');
            ident.authentication = auth;
          }
          ws.send(JSON.stringify({ op: 1, d: ident }));
        } else if (msg.op === 2) {
          console.log('[OBS] Identified');
          this.ready = true;
          resolve();
        } else if (msg.op === 3) {
          reject(new Error('OBS identify error: ' + JSON.stringify(msg.d)));
        } else if (msg.op === 7) {
          const d = msg.d;
          const p = this.pending.get(d.requestId);
          if (p) {
            this.pending.delete(d.requestId);
            if (d.requestStatus && d.requestStatus.result === false) {
              p.reject(new Error(d.requestStatus.comment || 'OBS request failed'));
            } else {
              p.resolve(d.responseData || {});
            }
          }
        }
      };

      ws.onerror = (e) => reject(new Error('OBS WS error: ' + (e.message || 'connection failed')));
      ws.onclose = () => { this.ready = false; };
    });

    return this.readyPromise;
  }

  async _request(requestType, requestData = {}) {
    if (!this.ready || !this.ws) throw new Error('OBS not connected');
    const rid = 'req' + (++this.reqId);
    return new Promise((resolve, reject) => {
      this.pending.set(rid, { resolve, reject });
      this.ws.send(JSON.stringify({
        op: 6,
        d: { requestType, requestId: rid, requestData }
      }));
    });
  }

  // === 录制控制 ===
  async startRecording() {
    try {
      const st = await this._request('GetRecordStatus');
      if (st.outputActive) {
        console.log('[OBS] Already recording');
        return { ok: true, alreadyRecording: true };
      }
      await this._request('StartRecord');
      console.log('[OBS] Recording started');
      return { ok: true, started: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async stopRecording() {
    try {
      const st = await this._request('GetRecordStatus');
      if (!st.outputActive) {
        console.log('[OBS] Not recording');
        return { ok: true, alreadyStopped: true };
      }
      const r = await this._request('StopRecord');
      console.log('[OBS] Recording stopped, output:', r.outputPath);
      return { ok: true, stopped: true, outputPath: r.outputPath };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  async getStatus() {
    try {
      const st = await this._request('GetRecordStatus');
      return { ok: true, recording: st.outputActive, ...st };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // 截图（从当前预览画面）
  async takeScreenshot(outPath) {
    try {
      const scene = await this._request('GetCurrentProgramScene');
      const s = await this._request('GetSourceScreenshot', {
        sourceName: scene.currentProgramSceneName,
        imageFormat: 'png',
        imageWidth: 1280,
        imageHeight: 720
      });
      const fs = await import('fs');
      const data = s.imageData.includes(',') ? s.imageData.split(',')[1] : s.imageData;
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      return { ok: true, path: outPath };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ready = false;
    }
  }
}
