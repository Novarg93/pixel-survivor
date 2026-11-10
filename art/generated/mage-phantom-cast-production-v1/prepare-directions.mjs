import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
const root='art/generated/mage-phantom-cast-production-v1';
if(existsSync(root+'/generation-manifest.json')&&JSON.parse(readFileSync(root+'/generation-manifest.json')).jobs.length)throw Error('Generation ledger already exists; do not overwrite queued/paid request provenance.');
const base=JSON.parse(readFileSync('art/generated/mage-phantom-cast-pixellab-v1/request-03.json')).parameters;
const vectors={'south':[0,1],'south-east':[Math.SQRT1_2,Math.SQRT1_2],east:[1,0],'north-east':[Math.SQRT1_2,-Math.SQRT1_2],north:[0,-1],'north-west':[-Math.SQRT1_2,-Math.SQRT1_2],west:[-1,0],'south-west':[-Math.SQRT1_2,Math.SQRT1_2]};
mkdirSync(root+'/reference',{recursive:true});mkdirSync(root+'/requests',{recursive:true});mkdirSync(root+'/raw',{recursive:true});mkdirSync(root+'/comparisons',{recursive:true});
for(const [direction,[dx,dy]] of Object.entries(vectors)){
  copyFileSync('art/generated/mage-hero-v2/first-frames/'+direction+'.png',root+'/reference/'+direction+'.png');
  if(direction==='south')continue;
  const breadth=.6+.4*Math.abs(dy),sign=dy<-.1?-1:1;
  const first=base.first_frame_keypoints.map(p=>{
    const face=/NOSE|EYE|EAR/.test(p.label),x=128+(p.x*256-128)*breadth*sign+(face?dx*12:0);
    return {...p,x:x/256,y:p.y,z_index:p.z_index+(p.label.startsWith(dx<0?'LEFT':'RIGHT')?2:0)};
  });
  const active=dx<0?'LEFT':'RIGHT',side=active==='RIGHT'?-sign:sign;
  const get=(frame,label)=>frame.find(p=>p.label===label);
  const palm=[128+dx*80+(Math.abs(dx)<.1?23:0),110+dy*48];
  const weights=[0,.08,.18,.36,.58,.82,1,1,.8,.5,.2,0];
  const keypoints=weights.map((amount,index)=>{
    const frame=structuredClone(first),shoulder=get(frame,active+' SHOULDER'),wrist=get(frame,active+' ARM'),elbow=get(frame,active+' ELBOW');
    const ready=[128+side*13,105];
    const manifest=index<=2?(index/2):1;
    wrist.x=((1-manifest)*wrist.x*256+manifest*(ready[0]+(palm[0]-ready[0])*amount))/256;
    wrist.y=((1-manifest)*wrist.y*256+manifest*(ready[1]+(palm[1]-ready[1])*amount))/256;
    elbow.x=(shoulder.x+wrist.x)/2+side*(1-amount)*.035;
    elbow.y=(shoulder.y+wrist.y)/2+.07*(1-amount*.65);
    shoulder.x+=dx*.008*amount;shoulder.y+=dy*.006*amount;
    return frame;
  });
  const parameters={...base,direction,action:'empty open-palm spell cast: gather, reach, push, retract; rooted feet; no objects',description:base.description.replace('toward the camera','toward the '+direction+' facing direction'),first_frame_keypoints:first,keypoints,seed:470000+Object.keys(vectors).indexOf(direction)};
  writeFileSync(root+'/requests/'+direction+'.json',JSON.stringify({tool:'animate_with_skeleton_v3',referenceFile:'reference/'+direction+'.png',parameters,preflight:{subscriptionGenerations:3,conservativeApiEquivalentUsd:.0622,budgetTotalIncludingPilotUsd:2,sevenRequestsMaxUsd:.4354,pilotMaxUsd:.1475,totalMaxUsd:.5829}},null,2)+'\n');
}
writeFileSync(root+'/generation-manifest.json',JSON.stringify({purpose:'Eight facings of ONE shared directional Phantom Cast for Fireball and regular Lightning',pilot:'../mage-phantom-cast-pixellab-v1',south:'Reuse accepted pilot; no regeneration',budgetUsd:2,maxNewEquivalentUsd:.4354,maxCombinedEquivalentUsd:.5829,pricing:'https://www.pixellab.ai/pixellab-api',before:{generations:1650.9,creditsUsd:0},jobs:[]},null,2)+'\n');
