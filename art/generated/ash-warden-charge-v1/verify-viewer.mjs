import {readFileSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const root=resolve('.'),dir='art/generated/ash-warden-charge-v1/';
const server=createServer((req,res)=>{const file=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.gif':'image/gif'})[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
const errors=[],results=[];
try{for(const [width,height]of [[1280,720],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+dir+'viewer.html');await page.waitForFunction(()=>globalThis.chargeReviewState?.().phase==='chargeWindup');
 for(const mode of ['idle','walk','melee','chargeWindup','chargeTravel','chargeBrake','full']){
  await page.selectOption('#mode',mode);await page.locator('#frame').fill(mode==='full'?'7':'2');await page.locator('#frame').dispatchEvent('input');await page.waitForTimeout(40);
  await page.screenshot({path:dir+'viewer-'+mode+'-'+width+'.png'});
  assert.equal(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth<=globalThis.innerWidth),true);
 }
 for(const rate of ['1','0.5','2']){
  await page.selectOption('#rate',rate);await page.click('#restart');await page.waitForFunction(()=>globalThis.chargeReviewState().done,{},{timeout:12000});
  const state=await page.evaluate(()=>globalThis.chargeReviewState());assert.equal(state.phase,'idle');assert.equal(state.index,13);assert.equal(state.events.filter(e=>e==='directionLock').length,1);assert.equal(state.events.filter(e=>e==='chargeStart').length,1);results.push({width,height,rate,state});
 }
 await page.screenshot({path:dir+'viewer-return-idle-'+width+'.png'});
 await page.selectOption('#mode','chargeTravel');await page.uncheck('#travel');await page.click('#restart');await page.waitForTimeout(600);assert.equal((await page.evaluate(()=>globalThis.chargeReviewState())).distance,0);
 await page.close();
}assert.deepEqual(errors,[]);writeFileSync(dir+'viewer-validation.json',JSON.stringify({errors,results,scope:'South pilot only; East/West/North unavailable, artistic acceptance failed'},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
globalThis.console.log('South viewer: desktop/mobile, 7 modes, 3 rates, event order, Idle return, background toggle passed');
