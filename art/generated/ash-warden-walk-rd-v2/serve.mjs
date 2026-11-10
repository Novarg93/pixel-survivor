import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const root=resolve('art/generated/ash-warden-walk-rd-v2');
createServer((req,res)=>{try{const name=decodeURIComponent(new globalThis.URL(req.url,'http://127.0.0.1').pathname),p=resolve(root,'.'+(name==='/'?'/viewer.html':name));if(!p.startsWith(root+sep)){res.writeHead(403);res.end();return;}const bytes=readFileSync(p);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.gif':'image/gif','.png':'image/png'})[extname(p)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}}).listen(5198,'127.0.0.1',()=>globalThis.console.log('Walking V2 viewer http://127.0.0.1:5198/viewer.html'));
