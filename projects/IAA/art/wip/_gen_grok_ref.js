const https = require("https");
const fs = require("fs");
const path = require("path");

const key = process.env.XAI_API_KEY;
const refPath = process.env.REF_PATH;
const outDir = process.env.OUT_DIR;
const prompt = process.env.PROMPT;
const refB64 = fs.readFileSync(refPath).toString("base64");
const dataUrl = `data:image/png;base64,${refB64}`;
console.log("ref", refPath, "bytes", fs.statSync(refPath).size);

function post(urlPath, body) {
  const data = JSON.stringify(body);
  const opts = {
    hostname: "lapi4157.youkia.net",
    port: 8443,
    path: urlPath,
    method: "POST",
    rejectUnauthorized: false,
    timeout: 600000,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let d = Buffer.alloc(0);
      res.on("data", (c) => { d = Buffer.concat([d, c]); });
      res.on("end", () => resolve({ status: res.statusCode, body: d.toString("utf8") }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(data);
    req.end();
  });
}

function save(tag, r) {
  console.log(tag, "status", r.status, "len", r.body.length, "head", r.body.slice(0, 180).replace(/\s+/g," "));
  let j; try { j = JSON.parse(r.body); } catch { console.log("bad json"); return 0; }
  if (j.error) console.log("err", JSON.stringify(j.error).slice(0,300));
  const out = [];
  const push = (b64) => { if (b64 && typeof b64 === "string" && b64.length > 200) out.push(b64); };
  if (j.data) for (const it of j.data) { push(it.b64_json); push(it.image_base64); if (it.url) console.log("url", it.url); }
  const walk = (o, depth=0) => {
    if (!o || depth>8) return;
    if (typeof o === "string" && o.length > 5000 && /^[A-Za-z0-9+/=]+$/.test(o.slice(0,80))) push(o);
    else if (Array.isArray(o)) o.forEach(x => walk(x, depth+1));
    else if (typeof o === "object") {
      if (o.b64_json) push(o.b64_json);
      Object.values(o).forEach(v => walk(v, depth+1));
    }
  };
  walk(j);
  let n=0;
  for (const b64 of out) {
    n++;
    const f = path.join(outDir, `firehero-grok-ref-${tag}-${n}.png`);
    fs.writeFileSync(f, Buffer.from(b64, "base64"));
    console.log("saved", f, fs.statSync(f).size);
  }
  return n;
}

(async () => {
  // 1) generations with image + prompt (edit/style transfer style fields)
  const attempts = [
    ["img", { model: "grok-imagine-image-quality", prompt, n: 1, size: "1024x1792", response_format: "b64_json", image: dataUrl }],
    ["images", { model: "grok-imagine-image-quality", prompt, n: 1, size: "1024x1792", response_format: "b64_json", images: [dataUrl] }],
    ["input_image", { model: "grok-imagine-image-quality", prompt, n: 1, size: "1024x1792", response_format: "b64_json", input_image: dataUrl }],
    ["image_url", { model: "grok-imagine-image", prompt, n: 1, size: "1024x1792", response_format: "b64_json", image_url: dataUrl }],
    ["ref_prompt", { model: "grok-imagine-image-quality", prompt: prompt + "\n\nUse the provided reference image as the mandatory style reference.", n: 1, size: "1024x1792", response_format: "b64_json", reference_image: dataUrl }],
  ];
  for (const [tag, body] of attempts) {
    try {
      const r = await post("/v1/images/generations", body);
      if (save(tag, r) > 0) return;
    } catch (e) {
      console.log(tag, "fail", String(e));
    }
  }
  // 2) edits endpoint if exists
  try {
    const r = await post("/v1/images/edits", {
      model: "grok-imagine-image-quality",
      prompt,
      image: dataUrl,
      n: 1,
      size: "1024x1792",
      response_format: "b64_json",
    });
    if (save("edits", r) > 0) return;
  } catch (e) { console.log("edits fail", String(e)); }

  console.log("no ref-conditioned image saved");
})().catch(e => { console.error(e); process.exit(1); });
