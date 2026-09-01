const https = require("https");
const { URL } = require("url");
function get(url, key) {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request(u, { method: "GET", headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, rejectUnauthorized: false, timeout: 30000 }, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject); req.end();
  });
}
(async () => {
  for (const [name, url, key] of [
    ["grok", "https://lapi4157.youkia.net:8443/v1/models", process.env.XAI_API_KEY],
    ["rehdasu", "https://rehdasu.cn/v1/models", process.env.REHDASU_API_KEY],
  ]) {
    const r = await get(url, key);
    const j = JSON.parse(r.body);
    const ids = (j.data || []).map(x => x.id);
    console.log("====", name, "count", ids.length);
    ids.filter(id => /image|dall|flux|banana|seedream|imagen|gpt-image|vision|draw|aura|grok.*image/i.test(id)).forEach(id => console.log(id));
    // also print any grok ids
    ids.filter(id => /grok/i.test(id)).forEach(id => console.log("grok:", id));
  }
})();
