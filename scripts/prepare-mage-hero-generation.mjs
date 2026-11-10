import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import process from 'node:process';

const base='art/generated/mage-hero-v2',out='art/main-hero-mage/casting/directions-pixminimax-v2';
mkdirSync(out,{recursive:true});
const directions=['south','south-east','east','north-east','north','north-west','west','south-west'];
const uploaded=Object.fromEntries(await Promise.all(directions.map(async direction=>{
  const form=new globalThis.FormData();form.set('file',new globalThis.Blob([readFileSync(`${base}/first-frames/${direction}.png`)],{type:'image/png'}),direction+'.png');
  const r=await globalThis.fetch(process.argv[2],{method:'POST',body:form});if(!r.ok)throw Error('Upload '+direction+' '+r.status);
  const result=await r.json();if(!result.ref)throw Error('Missing upload ref '+JSON.stringify(result));return[direction,result.ref];
})));
const motions={
  fireball:'Perform one fast fire spell casting gesture: draw one hand close to the chest, thrust that arm toward the facing direction with the palm forward and a brief small orange spark at the palm, then retract the arm and settle into the original neutral standing pose. Keep the feet planted. No large projectile or beam.',
  lightning:'Perform one lightning casting gesture: raise and extend one arm toward the facing direction, point the fingers firmly, a brief small cyan spark flickers at the fingertips, then lower that arm and return to the original neutral standing pose. Keep the feet planted. No long lightning beam.',
  meteor:'Perform one meteor calling gesture: extend one forearm toward the facing direction with palm open facing upward, hold the open palm steadily as if summoning a meteor, close the hand slightly, then lower the arm back into the original neutral standing pose. Feet stay planted. No meteor, fire or other objects.',
  defensive:'Perform one defensive spell casting gesture: raise BOTH hands from the waist and bring them close together in front of the upper chest in a firm protective casting pose, hold that compact symmetric two-handed gesture, then lower both hands into the original neutral standing pose. Keep feet planted. No shield bubble, no spell effects, no weapons.',
  walk:'Walk in place in a continuous looping gait: alternate clearly lifting and planting left and right feet, with restrained opposite arm swing and a gently swaying long coat. Stay facing the specified direction for the entire cycle. The root remains centered, do not translate across the canvas. End poised to repeat the first step.',
  run:'Run in place in a continuous looping gait: alternate pronounced left and right leg strides with both knees clearly lifting and strong opposite arm swings, slight forward torso lean, coat tails trailing and moving. Stay facing the specified direction throughout. Root stays centered, no translation across the canvas. End poised to repeat the first step.',
  death:'Perform one non-looping defeated collapse: knees buckle, torso sinks and falls onto the ground, arms slack, long blue coat settles around the body. End lying motionless on the ground, clearly defeated. No blood, no disintegration, no new objects. Start facing the specified direction and do not rotate upright to the camera.'
};
const requests=[];
for(const [motion,action]of Object.entries(motions))for(const direction of directions){
  if(['fireball','lightning','meteor','defensive'].includes(motion)&&direction==='south')continue;
  if(['walk','run'].includes(motion)&&!['east','west'].includes(direction))continue;
  const id=motion+'/'+direction;
  requests.push({id,motion,direction,args:{description:`${action} The character faces ${direction} for this entire animation. Preserve exactly the same blue long coat, gold armor trim, green tabard, red belt, short dark hair and bearded face from the reference. Fixed low top-down game camera, consistent anatomy and scale, complete body within the canvas, transparent background.`,direction,enhance_prompt:false,first_frame_url:uploaded[direction],frame_count:motion==='death'?12:16,no_background:true,seed:8111000+requests.length,subject_description:'a bearded human male battle mage wearing a long deep blue coat with gold armored shoulders and gold trim, green tabard, red belt and gold boots, short dark brown hair',initial_pose:`standing upright, facing ${direction}, both arms relaxed at his sides, full body visible`,view:'low top-down'}});
}
writeFileSync(out+'/requests.json',JSON.stringify(requests,null,2)+'\n');
writeFileSync(out+'/uploads.json',JSON.stringify(uploaded,null,2)+'\n');
globalThis.console.log(JSON.stringify({requests:requests.length,byMotion:Object.fromEntries(Object.keys(motions).map(m=>[m,requests.filter(r=>r.motion===m).length])),out}));
