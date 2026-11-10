import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-pixellab-v1',base='http://127.0.0.1:5173/'+root+'/viewer.html';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const protectedFiles=JSON.parse(readFileSync(root+'/validation/protected-before.json'));
for(const [file,expected]of Object.entries(protectedFiles))assert.equal(hash(file),expected,'Protected file changed: '+file);
const refs=JSON.parse(readFileSync(root+'/reference/source-manifest.json'));
for(const r of [refs.sources.model,refs.sources.south,refs.sources.north,refs.sources.east,refs.sources.directions,...refs.sources.idle,...refs.sources.run,...refs.sources.castNorth,...refs.sources.castSouth]){assert.equal(hash(r.source),r.sha256);assert.equal(hash(root+'/'+r.file),r.sha256);}
const animation=JSON.parse(readFileSync(root+'/animation.json')),audit=JSON.parse(readFileSync(root+'/validation/frame-audit.json'));
assert.equal(animation.frames.length,12);assert.equal(animation.frames.reduce((n,f)=>n+f.durationMs,0),340);assert.equal(animation.loop,false);assert.deepEqual(animation.anchorNative,[128,64]);
assert(audit.distinctProcessedFrames>=9);assert(audit.frames.every(f=>f.edge===0&&f.lowerLegRegionPixels===0));
const heads={south:readPNG(root+'/reference/mage-south.png'),north:readPNG(root+'/reference/mage-north.png'),east:readPNG(root+'/reference/mage-east.png')},body=readPNG(root+'/layers/body.png');let headMaxRgbDifference=0,headPixelsChecked=0;
const clamp=v=>Math.max(0,Math.min(255,Math.floor(v)));
for(let i=1;i<=10;i++)for(let y=32;y<71;y++)for(let x=110;x<=147;x++){
  const head=heads[i===1?'north':i===2?'east':'south'];
  const k=(y*256+x)*4;if(!head.pixels[k+3])continue;const shift=animation.frames[i].bakedProjectionShiftNative[1],out=((Math.floor(i/4)*256+y+shift)*body.width+i%4*256+x)*4;
  const [r,g,b]=head.pixels.slice(k,k+3),l=.2126*r+.7152*g+.0722*b,expected=[clamp(r*.42+(l*.58+38)*.58),clamp(g*.42+(l*.68+50)*.58),clamp(b*.42+(l*1.03+85)*.58)];
  assert(body.pixels[out+3]>0);for(let c=0;c<3;c++)headMaxRgbDifference=Math.max(headMaxRgbDifference,Math.abs(body.pixels[out+c]-expected[c]));headPixelsChecked++;
}
assert(headMaxRgbDifference<=1,'Head identity repair must preserve native reference pixels, apart from uniform colour grade');
const expenses=JSON.parse(readFileSync(root+'/actual-expenses.json'));assert.equal(expenses.subscriptionGenerationsDebited,7);assert.equal(expenses.creditsDebitedUsd,0);assert(expenses.estimatedApiCreditEquivalentUsdRange[1]<2);
const jsonFiles=[];function walk(dir){for(const name of readdirSync(dir)){const p=dir+'/'+name;if(statSync(p).isDirectory())walk(p);else if(/\.(json|mjs|js|html|md|lua|css)$/.test(name))jsonFiles.push(p);}}walk(root);
for(const p of jsonFiles){const text=readFileSync(p,'utf8');assert(!/https:\/\/[^\s"']+(?:\/uploads\/|\/mcp\/images\/[^$])/i.test(text),'Private link in '+p);assert(!/Bearer\s+[A-Za-z0-9_.-]{15}/.test(text),'Credential in '+p);}
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test'),browser=await chromium.launch({channel:'chromium',headless:true}),results=[];
try{
 for(const viewport of [{width:1280,height:720},{width:844,height:390}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width===844}),page=await context.newPage(),errors=[],badResponses=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)badResponses.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await page.evaluate(()=>window.phantomReview.seekFrame(6));const initial=await page.evaluate(()=>window.phantomReview.snapshot());assert.equal(initial.duration,340);assert.equal(initial.zoom,1);
  await page.screenshot({path:root+'/screenshots/desktop-mobile-'+viewport.width+'-combined-1x.png'});
  await page.selectOption('#mode','comparison');await page.screenshot({path:root+'/screenshots/desktop-mobile-'+viewport.width+'-comparison-1x.png'});
  const paused=await page.locator('#canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(120);assert.equal(await page.locator('#canvas').evaluate(c=>c.toDataURL()),paused);
  const modes=[];
  for(const mode of ['run','phantom','combined','standing','comparison']){await page.selectOption('#mode',mode);const state=await page.evaluate(()=>window.phantomReview.snapshot());assert.equal(state.mode,mode);modes.push(state);if(viewport.width===1280)await page.screenshot({path:root+'/screenshots/mode-'+mode+'.png'});}
  await page.selectOption('#zoom','4');await page.screenshot({path:root+'/screenshots/desktop-mobile-'+viewport.width+'-comparison-4x.png'});await page.selectOption('#zoom','1');
  await page.selectOption('#speed','0.25');assert.equal(await page.inputValue('#speed'),'0.25');await page.selectOption('#speed','0.5');await page.selectOption('#speed','2');await page.selectOption('#speed','1');
  await page.check('#anchor');await page.uncheck('#direction');await page.uncheck('#phantom');const hidden=await page.evaluate(()=>window.phantomReview.snapshot());assert.equal(hidden.phantomVisible,false);assert.equal(hidden.anchor,true);assert.equal(hidden.direction,false);
  await page.check('#phantom');await page.check('#direction');await page.uncheck('#anchor');
  const frameStates=[];for(let i=0;i<12;i++){await page.evaluate(i=>window.phantomReview.seekFrame(i),i);const state=await page.evaluate(()=>window.phantomReview.snapshot());assert.equal(state.frame,i);assert.equal(state.playing,false);frameStates.push(state);}
  await page.locator('#timing').evaluate(d=>d.open=true);await page.getByLabel('Длительность кадра 1',{exact:true}).fill('40');await page.getByLabel('Длительность кадра 1',{exact:true}).dispatchEvent('change');
  const changed=await page.evaluate(()=>window.phantomReview.snapshot());assert.equal(changed.duration,360);assert.equal(changed.releaseAtMs,170);
  await page.getByLabel('Длительность кадра 1',{exact:true}).fill('20');await page.getByLabel('Длительность кадра 1',{exact:true}).dispatchEvent('change');await page.locator('#timing').evaluate(d=>d.open=false);
  await page.selectOption('#mode','combined');await page.uncheck('#repeat');
  await page.evaluate(()=>{window.phantomReview.setTime(0);window.phantomReview.play();});
  const sequence=await page.evaluate(async()=>{const samples=[];await new Promise(resolve=>{const start=performance.now();const sample=()=>{samples.push(window.phantomReview.snapshot());if(performance.now()-start<800)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});return samples;});
  assert(new Set(sequence.filter(s=>s.phantomVisible).map(s=>s.runFrame)).size>=4,'Run must advance during the cast');
  assert(sequence.at(-1).castTime>340&&!sequence.at(-1).phantomVisible);assert(sequence.at(-1).runClock>700);
  assert(sequence.every((s,i)=>i===0||s.runClock>=sequence[i-1].runClock),'Run clock must not restart when Phantom ends');
  const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight}));assert.equal(dimensions.scrollWidth,viewport.width);assert(dimensions.scrollHeight<=viewport.height+2,'Viewer overflows vertically');
  assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);results.push({viewport,initial,modes,frameStates,sequence,dimensions,errors,badResponses});await context.close();
 }
 const page=await browser.newPage();await page.goto(base);const gif=await page.evaluate(async()=>{const result=[];for(const file of ['phantom-cast.gif','phantom-cast-alpha.gif']){const data=await(await fetch(file)).arrayBuffer(),decoder=new ImageDecoder({data,type:'image/gif',preferAnimation:true});await decoder.tracks.ready;const frames=[];for(let i=0;i<decoder.tracks.selectedTrack.frameCount;i++){const {image}=await decoder.decode({frameIndex:i});frames.push({width:image.displayWidth,height:image.displayHeight,durationMs:image.duration/1000});image.close();}decoder.close();result.push({file,frames});}return result;});
 for(const item of gif){assert.equal(item.frames.length,12);assert.equal(item.frames.reduce((n,f)=>n+f.durationMs,0),340);}
 writeFileSync(root+'/validation/viewer-validation.json',JSON.stringify({protectedFiles:Object.keys(protectedFiles).length,productionUnchanged:true,headPixelsChecked,headMaxRgbDifference,distinctProcessedFrames:audit.distinctProcessedFrames,gif,viewports:results},null,2)+'\n');
 console.log(JSON.stringify({pass:true,productionUnchangedFiles:Object.keys(protectedFiles).length,headPixelsChecked,headMaxRgbDifference,viewports:results.map(r=>r.viewport),gifFrames:gif.map(g=>g.frames.length),consoleErrors:0,httpErrors:0}));
}finally{await browser.close();}
