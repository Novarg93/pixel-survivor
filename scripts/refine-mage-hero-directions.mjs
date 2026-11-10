import {readFileSync,writeFileSync} from 'node:fs';
const root='art/main-hero-mage/casting/directions-pixminimax-v2',requests=JSON.parse(readFileSync(root+'/requests.json','utf8'));
const captions={
  north:'STRICT REAR VIEW throughout. The back of his head and the back panel of his blue coat face the viewer. His face, beard, green front tabard and chest MUST NOT become visible. He looks away toward the TOP of the image for EVERY frame. The arm reaches away from the viewer, with the hand mostly hidden on the far side of his body. Animate the bending elbow and shoulder from BEHIND. No turn, no pivot, no torso twist to camera.',
  'north-east':'STRICT rear three-quarter view throughout: back of head and blue cape dominate, body and gaze point toward the UPPER RIGHT corner. Do not turn toward the viewer or reveal the chest front. The casting hand extends AWAY toward the UPPER RIGHT. Preserve this exact rear three-quarter silhouette throughout.',
  'north-west':'STRICT rear three-quarter view throughout: back of head and blue cape dominate, body and gaze point toward the UPPER LEFT corner. Do not turn toward the viewer or reveal the chest front. The casting hand extends AWAY toward the UPPER LEFT. Preserve this exact rear three-quarter silhouette throughout.'
};
for(const q of requests){
  if(!captions[q.direction]||['walk','run','death'].includes(q.motion))continue;
  const gesture={fireball:'Bend one elbow, thrust the forearm AWAY in the facing direction with a small orange palm spark, then retract to neutral.',lightning:'Raise one arm, extend and point the fingers AWAY in the facing direction with a small cyan fingertip spark, then lower to neutral.',meteor:'Extend one forearm AWAY in the facing direction, hold the open palm facing upward, then lower it to neutral.',defensive:'Bring BOTH hands together in front of the chest ON THE FAR SIDE of the body, bend the elbows, hold, then lower to neutral.'}[q.motion];
  q.args.description=captions[q.direction]+' '+gesture+' Feet planted, no new objects or large effects. Preserve the costume, colors and scale. Fixed low top-down camera, transparent background.';
  q.args.subject_description='the REAR view of a human male battle mage, back of short dark hair, long deep blue coat BACK with gold armored shoulders and gold trim, gold boots';
  q.args.initial_pose=q.direction==='north'?'Strict BACK view, standing upright, back of head and blue cape visible, NO face or chest, both arms down, looking toward the top of the image.':'Strict REAR three-quarter view facing '+q.direction+', looking away, back of head and blue cape visible, arms down.';
  q.args.last_frame_url=q.args.first_frame_url;
}
const selection={};
for(const motion of ['fireball','lightning','meteor','defensive']){
  const q=globalThis.structuredClone(requests.find(q=>q.id===motion+'/north'));q.id+='/attempt-02';q.args.seed+=100;
  requests.push(q);selection[motion+'/north']=q.id;
}
writeFileSync(root+'/requests-refined.json',JSON.stringify(requests,null,2)+'\n');
writeFileSync(root+'/selection.json',JSON.stringify(selection,null,2)+'\n');
globalThis.console.log('Added explicit rear-view constraints and four north retakes; originals preserved.');
