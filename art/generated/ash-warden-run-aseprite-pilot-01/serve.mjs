import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve('art/generated/ash-warden-run-aseprite-pilot-01');
createServer((req,res)=>{try{const name=decodeURIComponent(new globalThis.URL(req.url,'http://127.0.0.1').pathname),path=resolve(root,'.'+(name==='/'?'/viewer.html':name));if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}const bytes=readFileSync(path);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.gif':'image/gif'})[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}}).listen(5197,'127.0.0.1',()=>globalThis.console.log('East pilot viewer http://127.0.0.1:5197/viewer.html'));
