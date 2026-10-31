import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout } from 'node:timers';
const production = process.argv.includes('--preview'), port = production ? '4173' : '5173';
const base = `http://127.0.0.1:${port}`;
async function existing() {
  try { const r=await globalThis.fetch(base,{signal:globalThis.AbortSignal.timeout(700)}); return r.ok ? await r.text() : null; } catch { return null; }
}
const previous=await existing();
if(previous && !previous.includes('<title>Pixel Survivor</title>'))throw new Error(`Port ${port} belongs to a different application`);
const server=previous?undefined:spawn(process.execPath,['node_modules/vite/bin/vite.js',...(production?['preview']:[]),'--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'inherit',windowsHide:true});
if(previous)globalThis.console.log(`Reusing existing Pixel Survivor server on ${port}; it will remain running.`);
let serverExited=false;server?.on('exit',()=>{serverExited=true;});
try {
  let ready=!!previous;
  for(let i=0;!ready&&i<100;i++){
    await new Promise(resolve=>setTimeout(resolve,100));
    if(serverExited)throw new Error('Test server exited before startup');
    ready=!!(await existing());
  }
  if(!ready)throw new Error('Test server timeout');
  const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test',...process.argv.slice(2).filter(arg=>arg!=='--preview')],{stdio:'inherit',windowsHide:true,env:{...process.env,PIXEL_E2E_PRODUCTION:production?'1':'0'}});
  process.exitCode=await new Promise(resolve=>child.once('exit',code=>resolve(code??1)));
}finally{server?.kill();}
