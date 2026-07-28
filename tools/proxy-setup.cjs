// 为 mcp-stitch 注入代理支持
const { setGlobalDispatcher, ProxyAgent } = require('undici');
setGlobalDispatcher(new ProxyAgent('http://127.0.0.1:7897'));
console.error('[proxy-setup] Global proxy set to http://127.0.0.1:7897');
