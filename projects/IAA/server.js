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
  '.ogg':'audio/ogg',
  '.wav':'audio/wav',
  '.mp4':'video/mp4',
  '.wasm':'application/wasm',
  '.pck':'application/octet-stream'
};

// 可 gzip 压缩的扩展名（wasm/js/pck 体积大头，压缩可省 ~70% 传输量）
var GZIPABLE={'.wasm':1,'.js':1,'.mjs':1,'.json':1,'.html':1,'.htm':1,'.css':1,'.txt':1,'.md':1,'.pck':1,'.svg':1};

var zlib=require('zlib');

function handle(req,res){
  var urlPath=decodeURIComponent((req.url||'/').split('?')[0]);
  // 根路径 → 默认试玩页（兼容旧行为）
  if(urlPath==='/'||urlPath==='') urlPath='/'+INDEX;
  // 防目录穿越
  var safePath=path.normalize(urlPath).replace(/^(\.\.[/\\])+/,'');
  var filePath=path.join(ROOT,safePath);
  if(!filePath.startsWith(ROOT)){
    res.writeHead(403); res.end('Forbidden'); return;
  }
  // 允许目录 URL 自动补 index.html：/ 或 /web-build/ → index.html
  fs.stat(filePath,function(err,st){
    if(!err&&st.isDirectory()){
      var idx=path.join(filePath,'index.html');
      fs.stat(idx,function(err2,st2){
        if(!err2&&st2.isFile()){ serve(req,res,idx); }
        else{
          res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
          res.end('404 Not Found: '+urlPath); return;
        }
      });
      return;
    }
    if(err||!st.isFile()){
      res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
      res.end('404 Not Found: '+urlPath); return;
    }
    serve(req,res,filePath);
  });
}

var server=http.createServer(handle);

// ===== HTTPS（手机体验 H5 需要安全上下文；自签证书见 certs/）=====
var https=null;
var HTTPS_PORT=parseInt(process.argv[3],10)||8443;
var CERT_DIR=path.join(ROOT,'certs');
var crtPath=path.join(CERT_DIR,'server.crt');
var keyPath=path.join(CERT_DIR,'server.key');
if(fs.existsSync(crtPath)&&fs.existsSync(keyPath)){
  var tlsOpts={cert:fs.readFileSync(crtPath),key:fs.readFileSync(keyPath)};
  https=require('https').createServer(tlsOpts,handle);
}

function serve(req,res,filePath){
  var ext=path.extname(filePath).toLowerCase();
  var type=MIME[ext]||'application/octet-stream';
  var acceptGzip=(req.headers['accept-encoding']||'').indexOf('gzip')>=0;
  if(acceptGzip&&GZIPABLE[ext]){
    var headers={'Content-Type':type,'Content-Encoding':'gzip','Cache-Control':'no-cache','Vary':'Accept-Encoding'};
    res.writeHead(200,headers);
    var gz=zlib.createGzip({level:6});
    fs.createReadStream(filePath).pipe(gz).pipe(res);
  }else{
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});
    fs.createReadStream(filePath).pipe(res);
  }
}

// 监听所有网卡，让局域网内的手机也能访问
server.listen(PORT,'0.0.0.0',function(){
  console.log('[fire-hero] 试玩服务器已启动');
  console.log('  网页端        http://127.0.0.1:'+PORT+'/');
  console.log('  手机端(局域网) http://<本机IP>:'+PORT+'/');
  if(https){
    https.listen(HTTPS_PORT,'0.0.0.0',function(){
      console.log('  HTTPS 体验(手机) https://<本机IP>:'+HTTPS_PORT+'/web-build/');
      console.log('  首次访问提示不安全 → 点「高级 / 继续前往」');
    });
  }
});

['SIGINT','SIGTERM'].forEach(function(sig){
  process.on(sig,function(){
    try{ server.close(); }catch(e){}
    if(https){ try{ https.close(); }catch(e){} }
    process.exit(0);
  });
});
