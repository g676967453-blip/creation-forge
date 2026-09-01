const https = require("https");
const http = require("http");
const { URL } = require("url");

async function get(url, key) {
  const u = new URL(url);
  const lib = u.protocol === "http:" ? http : https;
  const headers = { Authorization: `Bearer ${key}`, Accept: "application/json", "User-Agent": "node" };
  return new Promise((resolve) => {
    const req = lib.request(u, { method: "GET", headers, timeout: 25000, rejectUnauthorized: false }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d.slice(0, 2000) }));
    });
    req.on("error", (e) => resolve({ status: 0, body: String(e) }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "timeout" }); });
    req.end();
  });
}

(async () => {
  const tests = [
    ["youkia", process.env.SUB2 || "https://lapi.youkia.net:8443/v1/models", process.env.YOUKIA_GPT_API_KEY],
    ["grok-gw", "https://lapi4157.youkia.net:8443/v1/models", process.env.XAI_API_KEY],
    ["rehdasu", "https://rehdasu.cn/v1/models", process.env.REHDASU_API_KEY],
  ];
  for (const [name, url, key] of tests) {
    const r = await get(url, key);
    console.log(name, r.status, r.body.replace(/\s+/g, " ").slice(0, 300));
  }
})();
