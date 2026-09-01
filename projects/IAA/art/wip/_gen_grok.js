const https = require("https");
const fs = require("fs");
const path = require("path");

const key = process.env.XAI_API_KEY;
const refB64 = process.env.REF_B64;
const outDir = process.env.OUT_DIR;
const prompt = process.env.PROMPT;

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
      "User-Agent": "node-firehero/1.0",
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(data);
    req.end();
  });
}

function saveFromResponse(tag, r) {
  console.log(tag, "status", r.status, "bodyLen", r.body.length);
  const preview = r.body.slice(0, 500).replace(/\s+/g, " ");
  console.log(tag, "preview", preview);
  let j;
  try { j = JSON.parse(r.body); } catch (e) { console.log(tag, "not json"); return 0; }
  if (j.error) console.log(tag, "error", JSON.stringify(j.error).slice(0, 400));
  const images = [];
  if (Array.isArray(j.data)) {
    for (const item of j.data) {
      if (item.b64_json) images.push(item.b64_json);
      if (item.url) images.push({ url: item.url });
      if (item.image_base64) images.push(item.image_base64);
    }
  }
  // responses style
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    if (typeof o.result === "string" && o.result.length > 1000) images.push(o.result);
    if (typeof o.b64_json === "string") images.push(o.b64_json);
    if (typeof o.image_url === "string") images.push({ url: o.image_url });
    if (Array.isArray(o)) o.forEach(walk); else Object.values(o).forEach(walk);
  };
  walk(j);
  let n = 0;
  for (const img of images) {
    n += 1;
    const file = path.join(outDir, `firehero-grok-${tag}-${n}.png`);
    if (typeof img === "string") {
      fs.writeFileSync(file, Buffer.from(img, "base64"));
      console.log("saved", file, fs.statSync(file).size);
    } else if (img.url) {
      console.log("url", img.url);
      fs.writeFileSync(file + ".url.txt", img.url);
    }
  }
  return n;
}

(async () => {
  const dataUrl = `data:image/png;base64,${refB64}`;
  // Attempt A: images/generations with grok-imagine-image-quality + prompt only
  let r = await post("/v1/images/generations", {
    model: "grok-imagine-image-quality",
    prompt,
    n: 1,
    size: "1024x1792",
    response_format: "b64_json",
  });
  let n = saveFromResponse("A-gen-only", r);
  if (n > 0) return;

  // Attempt B: include image field variants
  r = await post("/v1/images/generations", {
    model: "grok-imagine-image",
    prompt,
    n: 1,
    size: "1024x1792",
    response_format: "b64_json",
    image: dataUrl,
  });
  n = saveFromResponse("B-gen-image", r);
  if (n > 0) return;

  r = await post("/v1/images/generations", {
    model: "grok-imagine-image",
    prompt,
    n: 1,
    aspect_ratio: "9:16",
    response_format: "b64_json",
  });
  n = saveFromResponse("C-aspect", r);
  if (n > 0) return;

  // Attempt D: responses non-stream
  r = await post("/v1/responses", {
    model: "grok-4.5",
    input: [{
      type: "message",
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        { type: "input_image", image_url: dataUrl },
      ],
    }],
    tools: [{ type: "image_generation", model: "grok-imagine-image-quality", size: "1024x1792", quality: "high" }],
    tool_choice: { type: "image_generation" },
  });
  n = saveFromResponse("D-responses", r);
  if (n > 0) return;

  // Attempt E: chat completions multimodal ask to generate? unlikely
  console.log("all attempts failed");
})().catch((e) => { console.error(e); process.exit(1); });
