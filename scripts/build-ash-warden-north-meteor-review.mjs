import {copyFileSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-north-meteor-review-v1',library='art/generated/ash-warden-animation-library-v1';
const read=f=>JSON.parse(readFileSync(f,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const baseline=read(`${root}/source/runtime-baseline.json`),files=[...walk('src'),...walk('public')].sort();
const changed=Object.entries(baseline).filter(([f,sha])=>!existsSync(f)||hash(readFileSync(f))!==sha).map(([f])=>f),inventoryUnchanged=JSON.stringify(files)===JSON.stringify(Object.keys(baseline).sort());
const approved=existsSync(`${root}/source/approval.json`)&&read(`${root}/source/approval.json`).accepted===true;
if(approved){
 const report=read('art/generated/ash-warden-pixellab-runtime-v1/integration-verification.json');
 if(JSON.stringify(changed.sort())!==JSON.stringify(report.changed)||JSON.stringify(files)!==JSON.stringify([...Object.keys(baseline),...report.added].sort()))throw Error('Unexpected approved inventory');
 for(const [file,sha]of Object.entries(report.currentSHA256))if(hash(readFileSync(file))!==sha)throw Error('Approved integration changed: '+file);
}else{
 if(changed.length||!inventoryUnchanged)throw Error('Runtime baseline changed: '+changed.join(','));
 writeFileSync(`${root}/source/runtime-verification.json`,JSON.stringify({protectedFiles:files.length,changed,inventoryUnchanged,runtimeIntegration:false},null,2)+'\n');
}
const lm=read(`${library}/manifest.json`),definitions=read(`${root}/source/sequences.json`),images={},clips={},sources={};
mkdirSync(`${root}/assets`,{recursive:true});mkdirSync(`${root}/prepared`,{recursive:true});
function image(file,key){if(images[key])return key;const b=readFileSync(file),im=readPNG(file),dest=`assets/${key}.png`;copyFileSync(file,`${root}/${dest}`);images[key]={file:dest,dataUrl:'data:image/png;base64,'+b.toString('base64'),canvas:[im.width,im.height],sha256:hash(b),pixelSHA256:hash(im.pixels),source:file};return key;}
for(const id of ['north-idle','north-melee','south-cleave','meteor-fall','meteor-telegraph','meteor-impact','meteor-aftermath']){
 const entry=lm.entries.find(e=>e.id===id);clips['current-'+id]={provider:'current-game',pivot:entry.frames.find(f=>f.layers.length)?.layers[0].pivot,scale:entry.frames.find(f=>f.layers.length)?.layers[0].scale,loop:entry.loop,durationsMs:entry.durationsMs,frames:entry.frames.map(f=>({layers:f.layers.map(l=>({...l,asset:image(`${library}/${lm.frames[l.asset].file}`,l.asset.replace(':','-'))}))}))};
}
for(const [id,d] of Object.entries(definitions.clips)){
 const frames=[],durationsMs=[],jobIds=[];sources[id]=[];
 for(const part of d.parts??[d]){
  const result=read(`${root}/source/${part.job}-result.json`).structuredContent,audit=read(`${root}/raw/${part.job}/download-audit.json`);
  if(result.status!=='completed'||result.asset?.status!=='saved')throw Error('Unfinished job '+part.job);
  for(const f of audit.frames)if(hash(readFileSync(`${root}/${f.file}`))!==f.sha256)throw Error('Changed AI source '+f.file);
  if(part.indices.length!==part.durationsMs.length||part.durationsMs.some(t=>t<=0))throw Error('Invalid playback '+id);
  for(const index of part.indices){const f=audit.frames[index];if(!f)throw Error('Missing frame '+id+'/'+index);frames.push({index,job:part.job,jobId:result.job_id,layers:[{asset:image(`${root}/${f.file}`,id+'-'+String(frames.length).padStart(2,'0')),pivot:d.pivot,scale:d.scale}]});}
  durationsMs.push(...part.durationsMs);jobIds.push(result.job_id);sources[id].push({jobId:result.job_id,chargedGenerations:result.charged_generations,inputFramesIncluded:result.frames===part.generatedFrames+1});
 }
 clips[id]={...d,durationsMs,provider:'PixelLab',jobIds,frames};
 const cols=4,im=readPNG(images[frames[0].layers[0].asset].source),w=im.width,h=im.height,sheet=new Uint8Array(cols*w*Math.ceil(frames.length/cols)*h*4);
 for(const [i,frame] of frames.entries()){const raw=readPNG(images[frame.layers[0].asset].source);for(let y=0;y<h;y++)sheet.set(raw.pixels.subarray(y*w*4,(y+1)*w*4),((Math.floor(i/cols)*h+y)*cols*w+(i%cols)*w)*4);}
 writeFileSync(`${root}/prepared/${id}-sheet.png`,png(sheet,cols*w,Math.ceil(frames.length/cols)*h));
}
const backgrounds={};for(const id of ['grove','forest'])backgrounds[id]=image(`${library}/${lm.backgrounds[id]}`,'background-'+id);
const refs=read(`${root}/source/references.json`),manifest={name:'Ash Warden · North slam / Meteor · PixelLab review v1',runtimeIntegration:approved,acceptedForIntegration:approved,protectedRuntimeFiles:Object.keys(baseline).length,clips,images,backgrounds,sources,references:refs,scene:definitions.scene,notes:definitions.notes};
writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');writeFileSync(`${root}/viewer-data.js`,'globalThis.REVIEW_DATA='+JSON.stringify(manifest)+';\n');
const lua=['local root=app.params["root"]'];
for(const [id,c]of Object.entries(clips).filter(([,c])=>c.provider==='PixelLab')){
 const size=images[c.frames[0].layers[0].asset].canvas;lua.push(`do local s=Sprite(${size[0]},${size[1]},ColorMode.RGB);s.layers[1].name="PixelLab original RGBA"`);
 for(const [i,f]of c.frames.entries()){if(i)lua.push('s:newEmptyFrame()');lua.push(`s:newCel(s.layers[1],s.frames[${i+1}],Image{fromFile=root.."/${images[f.layers[0].asset].file}"},Point(0,0));s.frames[${i+1}].duration=${c.durationsMs[i]/1000}`);}
 lua.push(`s:saveAs(root.."/prepared/${id}.aseprite")`,'local elapsed,previous=0,0;for _,f in ipairs(s.frames) do elapsed=elapsed+f.duration*1000;local stop=math.floor(elapsed/10+0.5)*10;f.duration=(stop-previous)/1000;previous=stop end',`s:saveAs(root.."/prepared/${id}.gif");s:close();end`);
}
writeFileSync(`${root}/source/export.lua`,lua.join('\n')+'\n');
let html=readFileSync('scripts/templates/ash-warden-north-meteor-viewer.html','utf8');
if(approved)html=html.replace('PixelLab · На приёмку · В игру не подключено','PixelLab · Принято · В игре').replace('СЕЙЧАС В ИГРЕ','ДО РЕВОРКА').replace('Слева — текущий вариант, справа — новые AI-кадры.','Слева — вариант до реворка, справа — принятые AI-кадры, подключённые к игре.').replace('игровых файлов без изменений','игровых файлов в исходном baseline');
writeFileSync(`${root}/viewer.html`,html);
globalThis.console.log(JSON.stringify({clips:Object.keys(clips).length,nativeImages:Object.keys(images).length,runtimeFiles:files.length,runtimeIntegration:approved}));
