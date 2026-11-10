import{readFileSync,writeFileSync}from'node:fs';
import{resolve,sep,extname}from'node:path';
import{createServer}from'node:http';
import{createHash}from'node:crypto';
import assert from'node:assert/strict';
import process from'node:process';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directional-melee-b-v1/',root=resolve('.'),clips=JSON.parse(readFileSync(dir+'clips.json','utf8')),uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64'),sources={},references={},gifs={};
for(const[key,c]of Object.entries(clips)){gifs[key]=readFileSync(dir+c.direction+'/'+c.pose+'/preview.gif').toString('base64');for(let i=0;i<c.frames.length;i++){const file=String(i).padStart(2,'0')+'.png';sources[key+'-'+i]=uri(dir+c.direction+'/'+c.pose+'/frames/'+file);if(['south','north'].includes(c.direction)&&c.pose!=='melee')references[key+'-'+i]=uri('art/generated/ash-warden-directions-v1/'+c.direction+'/'+c.pose+'/frames/'+file);if(c.direction==='south'&&c.pose==='melee'&&i>0&&i<11)references[key+'-'+i]=uri('art/generated/ash-warden-melee-swing-experiment-01/B/frames/'+file);}}
const server=createServer((req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new globalThis.URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+sep)){res.writeHead(403);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'})[extname(p)]??'application/octet-stream');res.end(readFileSync(p));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true}),errors=[],states={};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/art/generated/ash-warden-locomotion-rd-01/viewer.html');await page.waitForFunction(()=>globalThis.reviewState?.().rendered>2);
 const pixels=await page.evaluate(async({sources,references,gifs})=>{
  async function load(src){const i=new globalThis.Image();i.src=src;await i.decode();return i;}
  const data=globalThis.ASH_WARDEN_DIRECTIONAL_B,atlas=await load(data.atlas.src),canvas=globalThis.document.createElement('canvas');canvas.width=canvas.height=192;const x=canvas.getContext('2d');x.imageSmoothingEnabled=false;
  function render(f){x.clearRect(0,0,192,192);x.save();if(f.flipX){x.translate(192,0);x.scale(-1,1);}for(const layer of f.layers){const r=data.atlas.frames[layer.texture].frame;x.drawImage(atlas,r.x,r.y,r.w,r.h,layer.x,layer.y,r.w,r.h);}x.restore();return new Uint8ClampedArray(x.getImageData(0,0,192,192).data);}
  function difference(a,b,mirror=false){let n=0;for(let y=0;y<192;y++)for(let xx=0;xx<192;xx++){const k=(y*192+xx)*4,z=(y*192+(mirror?191-xx:xx))*4;if(a[k+3]!==b[z+3]||(a[k+3]&&[0,1,2].some(j=>a[k+j]!==b[z+j])))n++;}return n;}
  const frames={},rows=[],roundtrip=[];
  for(const[key,c]of Object.entries(data.clips)){
   const decoder=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(gifs[key]),a=>a.charCodeAt(0)),type:'image/gif',preferAnimation:true});await decoder.tracks.ready;let gifMs=0;
   for(let i=0;i<c.frames.length;i++){
    const p=render(c.frames[i]);frames[key+'-'+i]=p;let edge=0,partialAlpha=0,opaque=0,minY=192,maxY=-1;
    for(let yy=0;yy<192;yy++)for(let xx=0;xx<192;xx++){const a=p[(yy*192+xx)*4+3];if(a){opaque++;minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);if(a!==255)partialAlpha++;if(!xx||!yy||xx===191||yy===191)edge++;}}
    const im=await load(sources[key+'-'+i]);x.clearRect(0,0,192,192);x.drawImage(im,0,0);const flat=x.getImageData(0,0,192,192).data,atlasVsFlat=difference(p,flat);
    let preserved=null;if(references[key+'-'+i]){const im=await load(references[key+'-'+i]);x.clearRect(0,0,192,192);x.drawImage(im,0,0);preserved=difference(p,x.getImageData(0,0,192,192).data);}
    const{image}=await decoder.decode({frameIndex:i});x.clearRect(0,0,192,192);x.drawImage(image,0,0);const gifDiff=difference(p,x.getImageData(0,0,192,192).data);gifMs+=image.duration/1000;image.close();
    rows.push({clip:key,frame:i,edge,partialAlpha,opaque,boundsY:[minY,maxY],atlasVsFlat,preserved,gifDiff});
   }
   decoder.close();roundtrip.push({clip:key,frames:c.frames.length,gifMs,metadataMs:c.totalMs});
  }
  const mirrors=[],shared=[],endpoints=[];
  for(const p of['idle','walk','melee']){
   for(let i=0;i<data.clips['east-'+p].frames.length;i++){
    mirrors.push({pose:p,frame:i,pixels:difference(frames['west-'+p+'-'+i],frames['east-'+p+'-'+i],true)});
    const a=data.clips['south-'+p].frames[i],b=data.clips['east-'+p].frames[i];shared.push({pose:p,frame:i,upperSame:JSON.stringify(a.layers.at(-1))===JSON.stringify(b.layers.at(-1)),idleDiff:p==='idle'?difference(frames['south-idle-'+i],frames['east-idle-'+i]):null});
   }
  }
  for(const d of['south','east','west','north'])for(const i of[0,11])endpoints.push({direction:d,frame:i,diff:difference(frames[d+'-melee-'+i],frames[d+'-idle-0'])});
  return{rows,roundtrip,mirrors,shared,endpoints};
 },{sources,references,gifs});
 assert(pixels.rows.every(r=>r.atlasVsFlat===0&&r.gifDiff===0&&r.partialAlpha===0&&r.edge===0&&(r.preserved===null||r.preserved===0)));assert(pixels.mirrors.every(r=>r.pixels===0));assert(pixels.shared.every(r=>r.upperSame&&(r.idleDiff===null||r.idleDiff===0)));assert(pixels.endpoints.every(r=>r.diff===0));assert(pixels.roundtrip.every(r=>Math.abs(r.gifMs-r.metadataMs)<10));
 writeFileSync(dir+'pixel-validation.json',JSON.stringify({status:'passed',...pixels},null,2));
 // The planted East foot moves backwards exactly as world travel moves right at72u/s.
 const motion=JSON.parse(readFileSync(dir+'east-walk-motion.json','utf8'));for(const leg of['left','right']){const stance=motion.map(m=>m[leg]).filter(l=>l.stance).sort((a,b)=>a.phase-b.phase);for(let i=1;i<stance.length;i++){assert.equal(stance[i].sole[1],stance[i-1].sole[1]);assert(Math.abs((stance[i].sole[0]-stance[i-1].sole[0])*(72.68625/111)+72*clips['east-walk'].durationsMs[0]/1000)<1e-8);}}
 const ev=JSON.parse(readFileSync(dir+'events.json','utf8'));for(const[d,forward]of Object.entries({south:[0,1],east:[1,0],west:[-1,0],north:[0,-1]})){assert.deepEqual(ev[d].hitArea.worldForward,forward);assert.equal(ev[d].hitArea.deriveFromSwordImage,false);assert.equal(ev[d].damagePolicy.maxApplicationsPerAttack,1);}
 await page.clock.install();
 for(const[w,h]of[[1280,720],[844,390]]){
  await page.setViewportSize({width:w,height:h});await page.locator('#version').selectOption('directionalB');
  for(const pose of['idle','walk','melee']){await page.locator('#pose').selectOption(pose);await page.locator('#packLayout').selectOption('all');await page.locator('#frame').fill(pose==='idle'?'0':pose==='walk'?'3':'7');await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(32);await page.screenshot({path:dir+'viewer-all-'+pose+'-'+w+'.png'});}
  for(const layout of['se','ew','ba']){await page.locator('#packLayout').selectOption(layout);await page.clock.runFor(17);await page.screenshot({path:dir+'viewer-'+layout+'-'+w+'.png'});}
  await page.locator('#packLayout').selectOption('single');
  for(const d of['south','east','west','north']){
   await page.locator('#direction').selectOption(d);await page.locator('#pose').selectOption('melee');const before=await page.evaluate(()=>globalThis.reviewState().hitCount);
   for(let i=0;i<12;i++){await page.locator('#frame').fill(String(i));await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(17);assert.equal(await page.evaluate(()=>globalThis.reviewState().index),i);}
   assert.equal(await page.evaluate(()=>globalThis.reviewState().hitCount),before);
   await page.locator('#transition').click();await page.clock.runFor(5100);const s=await page.evaluate(()=>globalThis.reviewState());states[d+'-transition-'+w]=s;assert.equal(s.transitionComplete,true);assert.equal(s.hitCount-before,1);assert.equal(s.key,d+'-idle');assert.equal(s.playing,false);
  }
  await page.locator('#direction').selectOption('east');await page.locator('#pose').selectOption('walk');await page.locator('#autoTempo').check();await page.locator('#travel').check();
  for(const speed of[72,100,144]){await page.locator('#speed').fill(String(speed));await page.locator('#speed').dispatchEvent('input');await page.locator('#frame').fill('3');await page.locator('#frame').dispatchEvent('input');await page.clock.runFor(17);states['east-walk-'+speed+'-'+w]=await page.evaluate(()=>globalThis.reviewState());await page.screenshot({path:dir+'viewer-east-walk-'+speed+'-'+w+'.png'});}
  await page.locator('#travel').uncheck();
 }
 await page.locator('#pose').selectOption('melee');await page.locator('#direction').selectOption('east');for(const rate of[1,.5,.25]){await page.locator('[data-pack-rate="'+rate+'"]').click();await page.locator('#frame').fill('0');await page.locator('#frame').dispatchEvent('input');const hits=await page.evaluate(()=>globalThis.reviewState().hitCount);await page.locator('#play').click();await page.clock.runFor(2500/rate);assert.equal(await page.evaluate(()=>globalThis.reviewState().hitCount)-hits,2);await page.locator('#play').click();}
 await page.locator('#version').selectOption('swing');await page.locator('#candidate').selectOption('A');await page.clock.runFor(17);assert.equal(await page.evaluate(()=>globalThis.reviewState().key),'south-A');
 assert.deepEqual(errors,[]);writeFileSync(dir+'viewer-validation.json',JSON.stringify({status:'passed',viewports:[[1280,720],[844,390]],states,errors,checks:['all96 atlas compositions equal PNG and GIF','accepted South/North Idle/Walk unchanged','South B interior poses1-10 unchanged','S/E upper shared every frame','West exact mirror around root, no translation','all4directions endpoints equal idle','8Idle-Melee-Idle transitions with one hit each','all48attack frames scrubbed on both viewports, no hit on scrub','two hits for two cycles at1/.5/.25','East contact sequence at72 and visual100/144cap','A preserved as comparison']},null,2));
 const baseline=JSON.parse(readFileSync(dir+'protected-baseline.json','utf8')),modified=[];for(const[p,h]of Object.entries(baseline))if(createHash('sha256').update(readFileSync(p)).digest('hex')!==h)modified.push(p);assert.deepEqual(modified,[]);writeFileSync(dir+'integrity-validation.json',JSON.stringify({protectedFiles:Object.keys(baseline).length,modified},null,2));globalThis.console.log(JSON.stringify({status:'passed',frames:pixels.rows.length,protectedFiles:Object.keys(baseline).length,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
