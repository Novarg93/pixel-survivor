import process from 'node:process';
import {Buffer} from 'node:buffer';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const root='art/generated/secondary-bosses-review-01/';mkdirSync(root+'context',{recursive:true});
const bundle=await build({entryPoints:['src/game/art/groveArtPack.ts'],bundle:true,write:false,format:'iife',globalName:'Grove',platform:'browser'});
const server=createServer((q,r)=>r.end('<!doctype html><html><body></body></html>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);await page.addScriptTag({content:bundle.outputFiles[0].text});
 const atlases=Object.fromEntries(['bosses','guardian','mage'].map(n=>[n,{png:'data:image/png;base64,'+readFileSync('public/assets/hd/'+n+'.png').toString('base64'),json:JSON.parse(readFileSync('public/assets/hd/'+n+'.json','utf8'))}]));
 const outputs=await page.evaluate(async atlases=>{
  const out={};for(const[name,a]of Object.entries(atlases)){const im=new globalThis.Image();im.src=a.png;await im.decode();const names=name==='bosses'?['charger-1-right-idle-0','sorcerer-1-right-idle-0','eclipse-1-right-idle-0','eclipse-2-right-idle-0']:name==='mage'?['mage-down-idle-0']:['guardian-idle-0'];
   for(const key of names){const c=globalThis.document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const f=a.json.frames[key].frame;x.drawImage(im,f.x,f.y,f.w,f.h,(128-f.w)/2,(128-f.h)/2,f.w,f.h);out[key]=c.toDataURL();}
  }
  const atlas=globalThis.Grove.createGroveArtAtlas();for(const phase of ['normal','burning'])out['grove-'+phase]=globalThis.Grove.paintGroveRegion(atlas,phase,-10,-6,40,24).toDataURL();return out;
 },atlases);
 for(const[name,data]of Object.entries(outputs))writeFileSync(root+'context/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
 writeFileSync(root+'context/provenance.json',JSON.stringify({sources:['src/game/art/groveArtPack.ts','src/game/config/biomes.ts','src/game/utils/worldTiles.ts','public/assets/hd/bosses.png','public/assets/hd/guardian.png','public/assets/hd/mage.png'],method:'Existing Grove renderer bundled temporarily in memory. Original atlas frame cropped at native size and padded symmetrically to128; no resize.',scales:{boss:.45,guardian:.35,mage:.375},pivots:{native128:[64,64],motion192:[96,96]}},null,2));globalThis.console.log(Object.keys(outputs));
}finally{await browser.close();await new Promise(r=>server.close(r));}
