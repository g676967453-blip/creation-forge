const https = require("https");
const fs = require("fs");
const path = require("path");

const key = process.env.XAI_API_KEY;
const refPath = process.env.REF_PATH;
const outDir = process.env.OUT_DIR;
const prompt = process.env.PROMPT;
const size = process.env.SIZE || "1024x1792";
const refB64 = fs.readFileSync(refPath).toString("base64");
const dataUrl = `data:image/png;base64,${refB64}`;
console.log("ref", refPath, fs.statSync(refPath).size, "size", size);

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
  console.log(tag, "status", r.status, "len", r.body.length, "head", r.body.slice(0, 140).replace(/\s+/g, " "));
  let j;
  try { j = JSON.parse(r.body); } catch { console.log("bad json"); return []; }
  if (j.error) console.log("err", JSON.stringify(j.error).slice(0, 500));
  const out = [];
  if (Array.isArray(j.data)) {
    for (const it of j.data) {
      if (it.b64_json) out.push(it.b64_json);
      if (it.image_base64) out.push(it.image_base64);
      if (it.url) console.log("url", it.url);
    }
  }
  const files = [];
  let n = 0;
  for (const b64 of out) {
    n += 1;
    const f = path.join(outDir, `firehero-strict-ref-${tag}-${n}.png`);
    fs.writeFileSync(f, Buffer.from(b64, "base64"));
    console.log("saved", f, fs.statSync(f).size);
    files.push(f);
  }
  return files;
}

(async () => {
  // Strict img2img-style: reference is source of truth
  const attempts = [
    ["quality", {
      model: "grok-imagine-image-quality",
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
      image: dataUrl,
    }],
    ["imagine", {
      model: "grok-imagine-image",
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
      image: dataUrl,
    }],
  ];
  for (const [tag, body] of attempts) {
    const r = await post("/v1/images/generations", body);
    const files = save(tag, r);
    if (files.length) return;
  }
  console.log("failed");
  process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
