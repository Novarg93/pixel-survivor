import{readFileSync,writeFileSync,existsSync}from'node:fs';
const dir='art/generated/ash-warden-melee-swing-experiment-01/';
const uri=p=>'data:image/png;base64,'+readFileSync(p).toString('base64');
const globalData=p=>JSON.parse(readFileSync(p,'utf8').split('=').slice(1).join('=').replace(/;\s*$/,''));
const manifest=JSON.parse(readFileSync(dir+'generation-manifest.json','utf8')),clips={},references={};
for(const op of manifest.operations){const id=op.candidate,path=dir+id+'/';if(!existsSync(path+'frame-metadata.json'))continue;const frames=JSON.parse(readFileSync(path+'frame-metadata.json','utf8')),durationsMs=frames.map(f=>f.durationMs),totalMs=durationsMs.reduce((a,b)=>a+b,0);clips['south-'+id]={name:op.name,candidate:id,direction:'south',pose:'swing',status:'raw-awaiting-user-selection',frames:frames.map(f=>uri(path+'frames/'+String(f.index).padStart(2,'0')+'.png')),durationsMs,totalMs,previewFPS:frames.length/totalMs*1000};writeFileSync(path+'prompt.txt',op.request.prompt);writeFileSync(path+'parameters.json',JSON.stringify(op,null,2));}
const v2=globalData('art/generated/ash-warden-basic-melee-south-02/viewer-data.js').clips['south-melee'];references.v2={...v2,name:'Basic Melee v2 REJECTED',events:undefined};
const cleaveDir='art/generated/ash-warden-cleave-rd-01/attempt-02/';const cm=JSON.parse(readFileSync(cleaveDir+'frame-metadata.json','utf8'));const durationsMs=cm.map(f=>f.durationMs),totalMs=durationsMs.reduce((a,b)=>a+b,0);references.cleave={name:'Infernal Great Cleave',frames:cm.map(f=>uri(cleaveDir+'frames/'+String(f.index).padStart(2,'0')+'.png')),durationsMs,totalMs,previewFPS:cm.length/totalMs*1000};
writeFileSync(dir+'viewer-data.js','globalThis.ASH_WARDEN_SWING_REVIEW='+JSON.stringify({clips,references})+';\n');
globalThis.console.log(JSON.stringify({candidates:Object.keys(clips),nativeDurations:Object.fromEntries(Object.entries(clips).map(([id,c])=>[id,c.totalMs])),references:Object.keys(references)}));
