const https = require("https");
const fs = require("fs");
const path = require("path");

const key = process.env.XAI_API_KEY;
const refPath = process.env.REF_PATH;
const outDir = process.env.OUT_DIR;
const prompt = process.env.PROMPT;
const refB64 = fs.readFileSync(refPath).toString("base64");
const dataUrl = `data:image/png;base64,${refB64}`;
console.log("ref", refPath, fs.statSync(refPath).size);

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
  console.log(tag, "status", r.status, "len", r.body.length, "head", r.body.slice(0, 160).replace(/\s+/g, " "));
  let j;
  try { j = JSON.parse(r.body); } catch { console.log("bad json"); return []; }
  if (j.error) console.log("err", JSON.stringify(j.error).slice(0, 400));
  const out = [];
  const push = (b64) => {
    if (typeof b64 === "string" && b64.length > 500) out.push(b64);
  };
  if (Array.isArray(j.data)) {
    for (const it of j.data) {
      push(it.b64_json);
      push(it.image_base64);
      if (it.url) console.log("url", it.url);
    }
  }
  const files = [];
  let n = 0;
  for (const b64 of out) {
    n += 1;
    const f = path.join(outDir, `firehero-refine-${tag}-${n}.png`);
    fs.writeFileSync(f, Buffer.from(b64, "base64"));
    console.log("saved", f, fs.statSync(f).size);
    files.push(f);
  }
  return files;
}

(async () => {
  // Primary: image-conditioned generation (style lock from reference)
  const body = {
    model: "grok-imagine-image-quality",
    prompt,
    n: 1,
    size: "1024x1792",
    response_format: "b64_json",
    image: dataUrl,
  };
  const r = await post("/v1/images/generations", body);
  const files = save("v1", r);
  if (files.length) return;

  // Fallback without extra fields if needed
  const r2 = await post("/v1/images/generations", {
    model: "grok-imagine-image",
    prompt,
    n: 1,
    size: "1024x1792",
    response_format: "b64_json",
    image: dataUrl,
  });
  save("v2", r2);
})().catch((e) => { console.error(e); process.exit(1); });
