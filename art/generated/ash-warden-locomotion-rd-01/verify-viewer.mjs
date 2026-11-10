import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-locomotion-rd-01/';
const baseline=JSON.parse(readFileSync(dir+'protected-baseline.json','utf8'));
const changed=Object.entries(baseline).filter(([f,hash])=>createHash('sha256').update(readFileSync(f)).digest('hex')!==hash).map(([f])=>f);
if(changed.length)throw Error('Protected files changed: '+changed.join(', '));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 const observations=[];
 for(const [width,height]of [[1280,720],[844,390]]){
  await page.setViewportSize({width,height});await page.goto(pathToFileURL(resolve(dir+'viewer.html')).href);await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
  await page.waitForFunction(()=>globalThis.reviewState().loops>=2);
  await page.locator('#play').click();await page.locator('#frame').fill('3');await page.waitForFunction(()=>globalThis.reviewState().index===3);
  const idle=await page.evaluate(()=>globalThis.reviewState());await page.screenshot({path:dir+'idle-'+width+'.png'});
  await page.locator('#previous').click();await page.waitForFunction(()=>globalThis.reviewState().index===2);await page.locator('#next').click();await page.waitForFunction(()=>globalThis.reviewState().index===3);
  await page.locator('#pose').selectOption('walk');await page.locator('#speed').fill('72');await page.locator('#travel').check();await page.locator('#play').click();await page.waitForFunction(()=>globalThis.reviewState().loops>=3);
  const native=await page.evaluate(()=>globalThis.reviewState());await page.screenshot({path:dir+'walk-'+width+'.png'});
  await page.locator('#rate').fill('2');await page.locator('#speed').fill('144');const before=await page.evaluate(()=>globalThis.reviewState().loops);await page.waitForFunction(n=>globalThis.reviewState().loops>=n+3,before);
  const fast=await page.evaluate(()=>globalThis.reviewState());await page.screenshot({path:dir+'walk-fast-'+width+'.png'});
  await page.locator('#play').click();const paused=await page.evaluate(()=>globalThis.reviewState());await page.waitForFunction(n=>globalThis.reviewState().rendered>n+15,paused.rendered);
  const after=await page.evaluate(()=>globalThis.reviewState());if(after.index!==paused.index||after.distance!==paused.distance)throw Error('Pause changes frame or displacement');
  const directions=await page.locator('#direction option').evaluateAll(items=>items.map(i=>({value:i.value,disabled:i.disabled})));
  observations.push({viewport:[width,height],idle,nativeWalk:native,fastWalk:fast,pausePassed:true,stepControlsPassed:true,directions});
 }
 if(errors.length||external.length)throw Error(JSON.stringify({errors,external}));
 const result={protectedFiles:Object.keys(baseline).length,changedProtectedFiles:changed,errors,externalRequests:external,observations,scope:'isolated artifact viewer, not gameplay E2E; visual acceptance remains separate'};
 writeFileSync(dir+'validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify(result));
}finally{await browser.close();}
