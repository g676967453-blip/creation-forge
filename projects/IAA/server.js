// 救火英雄 IAA 试玩静态服务器
// 用途：本地启动，网页端 / 手机端（同局域网）都能打开 fire-hero-iaa.html 试玩
// 用法：node server.js  [端口]
var http=require('http');
var fs=require('fs');
var path=require('path');

var PORT=parseInt(process.argv[2],10)||8080;
var ROOT=__dirname;
var INDEX='fire-hero-iaa.html';

var MIME={
  '.html':'text/html; charset=utf-8',
  '.htm':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.mjs':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
  '.woff':'font/woff',
  '.woff2':'font/woff2',
  '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8',
  '.md':'text/plain; charset=utf-8',
  '.mp3':'audio/mpeg',
  '.mp4':'video/mp4'
};

var server=http.createServer(function(req,res){
  var urlPath=decodeURIComponent((req.url||'/').split('?')[0]);
  if(urlPath==='/'||urlPath==='') urlPath='/'+INDEX;
  // 防目录穿越
  var safePath=path.normalize(urlPath).replace(/^(\.\.[/\\])+/,'');
  var filePath=path.join(ROOT,safePath);
  if(!filePath.startsWith(ROOT)){
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath,function(err,st){
    if(err||!st.isFile()){
      res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('404 Not Found: '+urlPath); return;
    }
    var ext=path.extname(filePath).toLowerCase();
    var type=MIME[ext]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});
    fs.createReadStream(filePath).pipe(res);
  });
});

// 监听所有网卡，让局域网内的手机也能访问
server.listen(PORT,'0.0.0.0',function(){
  console.log('[fire-hero] 试玩服务器已启动');
  console.log('  网页端       http://127.0.0.1:'+PORT+'/');
  console.log('  手机端(局域网) http://<本机IP>:'+PORT+'/');
  console.log('  根目录       '+ROOT);
});

['SIGINT','SIGTERM'].forEach(function(sig){
  process.on(sig,function(){ server.close(function(){ process.exit(0); }); });
});
