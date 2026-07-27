// 代理测试
const https = require('https');
const http = require('http');
const url = 'https://stitch.googleapis.com/mcp';

// 方法1: 直接用 fetch
console.log('=== 测试1: Node.js fetch 走代理 ===');
const testFetch = async () => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log('fetch 结果:', res.status);
  } catch (e) {
    console.log('fetch 错误:', e.message, e.cause?.message || '');
  }

  // 方法2: 通过 http.Agent 代理
  console.log('\n=== 测试2: http.Agent 走代理 ===');
  try {
    const agent = new http.Agent({
      proxy: { host: '127.0.0.1', port: 7897 }
    });
    // 这个API可能不支持，换一种方式
    console.log('Agent 创建成功');
  } catch (e) {
    console.log('Agent 错误:', e.message);
  }
};
testFetch();
