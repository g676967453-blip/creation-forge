// OBS WebSocket v5 helper v2: handles Hello + auth challenge
import crypto from 'crypto';
const url = process.argv[2] || 'ws://127.0.0.1:4455';
const action = process.argv[3] || 'status'; // status | start | stop
const password = process.argv[4] || '';

const ws = new WebSocket(url);
let reqId = 0;
const pending = new Map();

function send(op, d) { ws.send(JSON.stringify({ op, d })); }
function request(requestType, requestData = {}, id) {
  const rid = id || ('req' + (++reqId));
  return new Promise((resolve, reject) => {
    pending.set(rid, { resolve, reject, requestType });
    send(6, { requestType, requestId: rid, requestData });
  });
}

ws.onopen = () => { /* wait for Hello(op 0) */ };

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.op === 0) {
    // Hello
    const d = msg.d;
    console.log('[hello] rpcVersion=' + d.rpcVersion + ' authRequired=' + (d.authentication ? d.authentication.required : false));
    let ident = { rpcVersion: 1 };
    if (password) {
      const a = d.authentication || {};
      console.log('[auth] challenge=' + (a.challenge ? a.challenge.slice(0,12) + '...' : 'MISSING') + ' salt=' + (a.salt ? a.salt.slice(0,12) + '...' : 'MISSING'));
      const secret = crypto.createHash('sha256').update(password + a.salt).digest('base64');
      const auth = crypto.createHash('sha256').update(secret + a.challenge).digest('base64');
      ident.authentication = auth;
      console.log('[auth] solved');
    }
    send(1, ident);
  } else if (msg.op === 3) {
    console.error('[identify_error]', JSON.stringify(msg.d));
    ws.close();
  } else if (msg.op === 2) {
    console.log('[identified]');
    run();
  } else if (msg.op === 7) {
    const d = msg.d;
    const p = pending.get(d.requestId);
    if (p) {
      pending.delete(d.requestId);
      if (d.requestStatus && d.requestStatus.result === false) {
        p.reject(new Error(d.requestStatus.comment || 'failed'));
      } else {
        p.resolve(d.responseData || {});
      }
    }
  } else if (msg.op === 5) {
    // Event - ignore
  }
};

ws.onerror = (e) => { console.error('WS error:', e.message || e); process.exit(1); };
ws.onclose = (e) => { console.log('[closed] code=' + e.code + ' reason=' + e.reason); process.exit(0); };

async function run() {
  try {
    if (action === 'status') {
      const st = await request('GetRecordStatus');
      const scene = await request('GetCurrentProgramScene');
      const video = await request('GetVideoSettings');
      console.log('record:', JSON.stringify(st));
      console.log('scene:', JSON.stringify(scene));
      console.log('video:', JSON.stringify(video));
    } else if (action === 'start') {
      const st = await request('GetRecordStatus');
      if (st.outputActive) { console.log('ALREADY_RECORDING'); }
      else { await request('StartRecord'); console.log('RECORD_STARTED'); }
    } else if (action === 'stop') {
      const st = await request('GetRecordStatus');
      if (!st.outputActive) { console.log('NOT_RECORDING'); }
      else { const r = await request('StopRecord'); console.log('RECORD_STOPPED', JSON.stringify(r)); }
    } else if (action === 'windows') {
      const list = await request('GetWindowList');
      console.log(JSON.stringify(list.windows, null, 1));
    } else if (action === 'input') {
      const name = process.argv[5] || '窗口采集';
      const s = await request('GetInputSettings', { inputName: name });
      console.log('kind=' + s.inputKind);
      console.log(JSON.stringify(s.inputSettings, null, 1));
    } else if (action === 'items') {
      const scene = await request('GetCurrentProgramScene');
      const items = await request('GetSceneItemList', { sceneName: scene.currentProgramSceneName });
      console.log(JSON.stringify(items.sceneItems.map(i => ({ name: i.sourceName, type: i.inputKind, visible: i.sceneItemEnabled, x: i.sceneItemTransform?.positionX, y: i.sceneItemTransform?.positionY, w: i.sceneItemTransform?.sourceWidth, h: i.sceneItemTransform?.sourceHeight })), null, 2));
    } else if (action === 'shot') {
      const out = process.argv[5] || 'J:/ceshi/shot.png';
      const scene = await request('GetCurrentProgramScene');
      const s = await request('GetSourceScreenshot', { sourceName: scene.currentProgramSceneName, imageFormat: 'png', imageWidth: 1280, imageHeight: 720 });
      const fs = await import('fs');
      fs.writeFileSync(out, Buffer.from(s.imageData.split(',')[1], 'base64'));
      console.log('SHOT_SAVED ' + out);
    }
  } catch (e) { console.error('ERROR:', e.message); }
  ws.close();
}
