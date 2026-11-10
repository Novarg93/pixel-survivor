import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{createHash}from'node:crypto';
import{resolve}from'node:path';
import process from'node:process';
import{png,empty,inside,blit,poly,link,flip,nearest}from'../ash-warden-directions-v1/pixels.mjs';
import{encodeGif}from'../ash-warden-directions-v1/gif.mjs';
import{RIG as SOUTH}from'../ash-warden-south-polish-01/rig.mjs';
import{COMMON as C,FRONT}from'./rig.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-directional-melee-b-v1/',old='art/generated/ash-warden-directions-v1/';
const previous=JSON.parse(readFileSync(old+'frame-pixels.json','utf8')),southData=JSON.parse(readFileSync('art/generated/ash-warden-south-polish-01/pixel-data.json','utf8'));
const motion=JSON.parse(readFileSync('art/generated/ash-warden-south-polish-01/motion.json','utf8'));
const sources={baseSouth:old+'bases/south.png',baseNorth:old+'bases/north.png',left:'art/generated/ash-warden-south-polish-01/layers/leftLeg.png',right:'art/generated/ash-warden-south-polish-01/layers/rightLeg.png'};
for(let i=0;i<12;i++){sources['B'+i]='art/generated/ash-warden-melee-swing-experiment-01/B/frames/'+String(i).padStart(2,'0')+'.png';sources['N'+i]=dir+'north-rd/frames/'+String(i).padStart(2,'0')+'.png';}
const browser=await chromium.launch({channel:'chromium',headless:true});let decoded;
try{const page=await browser.newPage();decoded=await page.evaluate(async sources=>{const result={};for(const[k,src]of Object.entries(sources)){const im=new globalThis.Image();im.src=src;await im.decode();const c=globalThis.document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');x.drawImage(im,im.width===128?32:0,im.width===128?32:0);result[k]=Array.from(x.getImageData(0,0,192,192).data);}return result;},Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,'data:image/png;base64,'+readFileSync(p).toString('base64')])));}finally{await browser.close();}
const raw=Object.fromEntries(Object.entries(decoded).map(([k,p])=>[k,new Uint8ClampedArray(p)]));
const packs={south:{idle:southData.idle.map(f=>new Uint8ClampedArray(f.pixels)),walk:southData.walk.map(f=>new Uint8ClampedArray(f.pixels)),melee:[]},east:{idle:[],walk:[],melee:[]},north:{idle:previous.north.idle.map(p=>new Uint8ClampedArray(p)),walk:previous.north.walk.map(p=>new Uint8ClampedArray(p)),melee:[]}};
packs.east.idle=packs.south.idle;
const shared={idle:[],walk:[],melee:[]},lowerSouth={walk:[],melee:[]},lowerEast={walk:[],melee:[]},cleanup=[],footMotion=[];
function cut(src,upperPredicate){const upper=empty(),lower=empty();for(let y=0;y<192;y++)for(let x=0;x<192;x++){const k=(y*192+x)*4;if(src[k+3])(upperPredicate(x,y)?upper:lower).set(src.slice(k,k+4),k);}return{upper,lower};}
function compose(lower,upper){const p=empty();blit(p,lower);blit(p,upper);return p;}
function sourceMask(x,y,mask,bx=0,by=0){return inside(x-32-bx+.5,y-32-by+.5,mask);}
const shade=nearest(raw.baseSouth,[28,24,26]),mid=nearest(raw.baseSouth,[47,40,41]);
for(const name of['left','right'])for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(sourceMask(x,y,FRONT.sword)||sourceMask(x,y,SOUTH.masks.cloth))raw[name][(y*192+x)*4+3]=0;
function eastLeg(name,phase,bx,by){
 const cfg=SOUTH.legs[name],foot=SOUTH.gait.footY[phase],lift=SOUTH.gait.lift[phase],sole=[cfg.sole[0]+32+foot,cfg.sole[1]+32-lift],hip=[cfg.hip[0]+32+bx,cfg.hip[1]+32+by],ankle=[sole[0]-(name==='right'?5:0),sole[1]-(name==='right'?5:8)],knee=[(hip[0]+ankle[0])/2+(name==='left'?-3:3),(hip[1]+ankle[1])/2-lift*.3];
 const p=empty();link(p,hip,knee,7,7,shade);link(p,knee,ankle,6,4,shade);link(p,ankle,[sole[0],sole[1]-1],4,5,shade);link(p,knee,ankle,3,2,mid);
 const angles=[Math.atan2(knee[1]-hip[1],knee[0]-hip[0])-Math.PI/2,Math.atan2(ankle[1]-knee[1],ankle[0]-knee[0])-Math.PI/2,phase<=4?0:phase===5?-.1:phase===7?.1:0];
 const targets=[[hip[0]*.3+knee[0]*.7,hip[1]*.3+knee[1]*.7],[(knee[0]+ankle[0])/2,(knee[1]+ankle[1])/2],sole];
 cfg.parts.forEach((part,j)=>blit(p,raw[name],{pivot:part.pivot.map(v=>v+32),target:targets[j],angle:angles[j],scaleY:j===1?Math.max(.7,Math.min(2.2,Math.hypot(ankle[0]-knee[0],ankle[1]-knee[1])/12)):1,filter:(x,y)=>x>=part.box[0]+32&&x<part.box[2]+32&&y>=part.box[1]+32&&y<part.box[3]+32}));
 return{pixels:p,phase,stance:phase<=4,sole,hip,knee,lift};
}
for(let i=0;i<8;i++){
 const [bx,by]=[SOUTH.gait.bodyX[i],SOUTH.gait.bodyY[i]],lag=[0,0,1,1,0,0,-1,-1][i];
 const split=cut(packs.south.walk[i],(x,y)=>{const sy=y-32-by,sx=x-32-bx-Math.round(lag*Math.max(0,sy-78)/27);return y<112+by||inside(sx+.5,sy+.5,SOUTH.masks.cloth)||sourceMask(x,y,FRONT.sword,bx,by);});
 shared.walk.push(split.upper);lowerSouth.walk.push(split.lower);
 const a=eastLeg('left',i,bx,by),b=eastLeg('right',(i+4)%8,bx,by),low=empty();for(const l of(a.sole[1]>b.sole[1]?[b,a]:[a,b]))blit(low,l.pixels);
 poly(low,[[80+bx,109+by],[116+bx,109+by],[122+bx,125+by],[83+bx,125+by]],shade);
 // A hard layer boundary at the belt keeps the authored calves below the shared upper.
 for(let y=0;y<112+by;y++)for(let x=0;x<192;x++)low[(y*192+x)*4+3]=0;
 lowerEast.walk.push(low);packs.east.walk.push(compose(low,split.upper));footMotion.push({index:i,vector:[1,0],body:[bx,by],left:{phase:a.phase,stance:a.stance,sole:a.sole},right:{phase:b.phase,stance:b.stance,sole:b.sole},south:motion[i]});
}
function swordNear(x,y,i){const[a,b]=FRONT.blade[i],dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy)<9;}
for(let i=0;i<12;i++){
 const src=i===0||i===11?packs.south.idle[0]:raw['B'+i];packs.south.melee.push(src);
 const split=cut(src,(x,y)=>!FRONT.meleeLegBoxes.some(b=>x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3])||swordNear(x,y,i));shared.melee.push(split.upper);lowerSouth.melee.push(split.lower);
 const low=empty();for(let y=0;y<192;y++)for(let x=0;x<192;x++){const k=(y*192+x)*4;if(!split.lower[k+3])continue;const name=x<105?'left':'right',fraction=Math.max(0,Math.min(1,(y-128)/22)),dx=Math.round(FRONT.meleeFeetX[name][i]*fraction),xx=x+dx;if(xx>=0&&xx<192)low.set(split.lower.slice(k,k+4),(y*192+xx)*4);}
 lowerEast.melee.push(low);packs.east.melee.push(compose(low,split.upper));
 const north=i===0||i===11?new Uint8ClampedArray(packs.north.idle[0]):new Uint8ClampedArray(raw['N'+i]);let removed=0;
 if(FRONT.northCleanup[i])for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(inside(x+.5,y+.5,FRONT.northCleanup[i])){const k=(y*192+x)*4;if(north[k+3])removed++;north.fill(0,k,k+4);}
 packs.north.melee.push(north);cleanup.push({frame:i,removedPixels:removed,mask:FRONT.northCleanup[i]??null,endpointToIdle:i===0||i===11});
}
packs.west=Object.fromEntries(Object.entries(packs.east).map(([p,frames])=>[p,frames.map(flip)]));
const bases={south:raw.baseSouth,east:raw.baseSouth,west:flip(raw.baseSouth),north:raw.baseNorth};
const textures={},entries=[],clips={},events={},baseFrames={};mkdirSync(dir+'textures',{recursive:true});mkdirSync(dir+'bases',{recursive:true});
function texture(pixels){let x0=192,y0=192,x1=-1,y1=-1;for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(pixels[(y*192+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<0)return null;const w=x1-x0+1,h=y1-y0+1,p=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)p.set(pixels.slice(((y0+y)*192+x0)*4,((y0+y)*192+x0+w)*4),y*w*4);const bytes=png(p,w,h),id=createHash('sha256').update(bytes).digest('hex').slice(0,20);if(!textures[id]){textures[id]={w,h,pixels:p};entries.push(id);writeFileSync(dir+'textures/'+id+'.png',bytes);}return{texture:id,x:x0,y:y0};}
function descriptor(layers,mirror=false){return{layers:layers.map(texture).filter(Boolean),flipX:mirror};}
for(const[d,p]of Object.entries(bases)){writeFileSync(dir+'bases/'+d+'.png',png(p));baseFrames[d]=d==='east'?baseFrames.south:d==='west'?{...baseFrames.south,flipX:true}:descriptor([p]);}
for(const d of['south','east','west','north'])for(const pose of['idle','walk','melee']){
 const path=dir+d+'/'+pose+'/';mkdirSync(path+'frames',{recursive:true});const frames=packs[d][pose],durationsMs=frames.map((_,i)=>pose==='melee'?C.meleeMs[i]:pose==='idle'?450:C.strideWorld/72/8*1000),totalMs=durationsMs.reduce((a,b)=>a+b,0),starts=durationsMs.map((_,i)=>durationsMs.slice(0,i).reduce((a,b)=>a+b,0));
 let descriptors;
 if(d==='west')descriptors=clips['east-'+pose].frames.map(f=>({...f,flipX:true}));
 else if(d==='east'&&pose==='idle')descriptors=clips['south-idle'].frames;
 else if((d==='south'||d==='east')&&pose!=='idle')descriptors=frames.map((_,i)=>descriptor([(d==='south'?lowerSouth:lowerEast)[pose][i],shared[pose][i]]));
 else descriptors=frames.map(f=>descriptor([f]));
 frames.forEach((p,i)=>writeFileSync(path+'frames/'+String(i).padStart(2,'0')+'.png',png(p)));const gif=encodeGif(frames.map(p=>({pixels:p})),durationsMs);writeFileSync(path+'preview.gif',gif.bytes);
 if(pose==='melee')writeFileSync(path+'idle-melee-idle.gif',encodeGif([...packs[d].idle,...frames,...packs[d].idle].map(p=>({pixels:p})),[...packs[d].idle.map(()=>450),...durationsMs,...packs[d].idle.map(()=>450)]).bytes);
 const forward={south:[0,1],east:[1,0],west:[-1,0],north:[0,-1]}[d],presentation={south:'front',east:'front',west:'front-mirror',north:'back'}[d];
 const ev=pose==='melee'?{attackStart:{frame:0,timeMs:0},directionLock:{frame:0,timeMs:0,worldForward:forward,policy:'Latch combat aim independently of presentation once per attack'},windupEnd:{frame:d==='north'?6:5,timeMs:starts[d==='north'?6:5]},hitFrame:{frame:7,timeMs:starts[7],guardKey:'attackInstanceId',dispatch:'once-per-instance'},activeEnd:{frame:8,timeMs:starts[8]},recoveryEnd:{frameExclusive:12,timeMs:totalMs},damagePolicy:{maxApplicationsPerAttack:1,notPerActiveFrame:true},hitArea:{worldForward:forward,kind:'front-sector',radiusWorld:null,deriveFromSwordImage:false},returnToLocomotion:{visualBlendWindowMs:[starts[11],totalMs],exitAllowedAfterMs:totalMs},presentation,combatFacing:d,status:'visual metadata, not connected to gameplay'}:null;
 if(ev)events[d]=ev;
 clips[d+'-'+pose]={direction:d,pose,presentation,combatFacing:d,worldForward:forward,frames:descriptors,durationsMs,totalMs,previewFPS:frames.length/totalMs*1000,strideWorld:pose==='walk'?C.strideWorld:null,events:ev,loop:pose!=='melee',status:'candidate-for-manual-review'};
 writeFileSync(path+'frames.json',JSON.stringify({canvas:[192,192],pivot:C.pivot,worldScale:C.worldScale,events:ev,frames:descriptors.map((render,i)=>({index:i,file:'frames/'+String(i).padStart(2,'0')+'.png',durationMs:durationsMs[i],startMs:starts[i],render}))},null,2));
 // Preview strip and grid stay on the virtual192px canvas.
 const strip=new Uint8ClampedArray(192*frames.length*192*4),cols=4,rows=Math.ceil(frames.length/cols),sheet=new Uint8ClampedArray(768*192*rows*4);
 frames.forEach((p,i)=>{for(let y=0;y<192;y++){strip.set(p.slice(y*192*4,(y+1)*192*4),(y*192*frames.length+i*192)*4);sheet.set(p.slice(y*192*4,(y+1)*192*4),((Math.floor(i/cols)*192+y)*768+i%cols*192)*4);}});
 writeFileSync(path+'animation-strip.png',png(strip,192*frames.length,192));writeFileSync(path+'spritesheet.png',png(sheet,768,192*rows));
}
// One deduplicated atlas. Trimming records source offsets; it never fits or scales a frame.
let ax=1,ay=1,rowH=0;const atlasW=1024;for(const id of entries){const t=textures[id];if(ax+t.w+1>atlasW){ax=1;ay+=rowH+2;rowH=0;}t.frame={x:ax,y:ay,w:t.w,h:t.h};ax+=t.w+2;rowH=Math.max(rowH,t.h);}const atlasH=ay+rowH+1,atlasPixels=new Uint8ClampedArray(atlasW*atlasH*4),atlasFrames={};
for(const id of entries){const t=textures[id];for(let y=0;y<t.h;y++)atlasPixels.set(t.pixels.slice(y*t.w*4,(y+1)*t.w*4),((t.frame.y+y)*atlasW+t.frame.x)*4);atlasFrames[id]={frame:t.frame,rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:t.w,h:t.h},sourceSize:{w:t.w,h:t.h}};}
const atlasPNG=png(atlasPixels,atlasW,atlasH);writeFileSync(dir+'atlas.png',atlasPNG);writeFileSync(dir+'atlas.json',JSON.stringify({frames:atlasFrames,meta:{app:'Pixel Survivor art preview',image:'atlas.png',format:'RGBA8888',size:{w:atlasW,h:atlasH},scale:'1'}},null,2));
const presentation={south:'front',east:'front',west:'front-mirror',north:'back'},data={clips,bases:baseFrames,atlas:{src:'data:image/png;base64,'+atlasPNG.toString('base64'),frames:atlasFrames,size:[atlasW,atlasH]},worldScale:C.worldScale,pivot:C.pivot,maxPreviewFPS:C.maxPreviewFPS,presentation};
writeFileSync(dir+'viewer-data.js','globalThis.ASH_WARDEN_DIRECTIONAL_B='+JSON.stringify(data)+';\n');
writeFileSync(dir+'events.json',JSON.stringify(events,null,2));writeFileSync(dir+'clips.json',JSON.stringify(clips,null,2));writeFileSync(dir+'east-walk-motion.json',JSON.stringify(footMotion,null,2));writeFileSync(dir+'north-cleanup.json',JSON.stringify(cleanup,null,2));
writeFileSync(dir+'manifest.json',JSON.stringify({status:'manual-review-pending',approvedMotionReference:'Candidate B, user decision 2026-11-06',canvas:[192,192],pivot:C.pivot,worldScale:C.worldScale,presentation,combatDirections:{south:[0,1],east:[1,0],west:[-1,0],north:[0,-1]},counts:{directions:4,idlePerDirection:4,walkPerDirection:8,meleePerDirection:12,totalPNGFrames:96},retime:{originalBMs:1800,derivedBMs:1200,framesRemoved:0,allInteriorSouthBPixelPosesPreserved:true,endpointsToIdle:[0,11]},mirror:{axisX:96,pixelFormula:'191-x',additionalTranslation:0,reason:'Keep root pivot fixed and retain entire wide blade inside192; no old +16 registration'},sharedLayers:{southEastIdle:true,southEastWalkUpper:true,southEastMeleeUpper:true,westUsesEastTexturesWithFlip:true},textureMemory:{uniqueTextures:entries.length,atlasSize:[atlasW,atlasH],atlasRGBABytes:atlasW*atlasH*4,naiveFullFrameRGBABytes:96*192*192*4},north:{method:'RD custom_action from accepted back model; only endpoints and secondary blade-like artifact cleanup',cleanup},gameplayChanged:false},null,2));
globalThis.console.log(JSON.stringify({clips:Object.keys(clips).length,frames:96,atlas:[atlasW,atlasH],uniqueTextures:entries.length,northRemoved:cleanup.filter(f=>f.removedPixels)}));
