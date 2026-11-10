import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import process from 'node:process';
const pack=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')),root='art/main-hero-mage/abilities/hero-model/run-cycle-v2';
mkdirSync(root,{recursive:true});
if(existsSync(root+'/requests.json')){globalThis.console.log('Run-cycle-v2 requests already prepared; preserving original references and receipts.');process.exit(0);}
const requests=[];
for(const [index,direction]of pack.directions.entries()){
 const old=pack.clips['run-'+direction].sourceFiles,reference=old[3];
 const form=new globalThis.FormData();form.set('file',new globalThis.Blob([readFileSync(reference)],{type:'image/png'}),direction+'.png');
 const response=await globalThis.fetch(process.argv[2],{method:'POST',body:form});if(!response.ok)throw Error('Upload '+response.status);
 const upload=await response.json();if(!upload.ref)throw Error('No upload ref');
 const rear=direction.startsWith('north')?'Strict rear view: the back of the head and blue coat face the viewer. Never show the face or chest. ':'';
 requests.push({direction,reference,originalRun:old,args:{
  first_frame_url:upload.ref,last_frame_url:upload.ref,frame_count:8,enhance_prompt:false,no_background:true,direction,view:'low top-down',seed:8118000+index,
  subject_description:'a bearded human male battle mage with short dark hair, long deep blue coat with gold trim and gold armored shoulders, green tabard, red belt and gold boots',
  initial_pose:'Already running at full speed in mid stride, one knee forward and the other leg behind, slight forward lean, arms bent. This is NOT a standing pose.',
  description:rear+'ONE COMPLETE SEAMLESS RUNNING CYCLE IN PLACE at steady full speed, starting already mid-stride and continuing the SAME run forever. Alternate left foot and right foot equally: one left stride, one right stride, returning to exactly the input running phase. Strong bent knee lift and opposing bent-elbow arm swing, airborne passing phases, coat tails flowing continuously. CONSTANT running energy from the FIRST to the LAST frame. NO standing, NO anticipation, NO acceleration, NO slowing down, NO stopping, NO idle ending, NO turning. Hold the exact '+direction+' facing and fixed top-down camera. Root stays centered; preserve the exact reference costume, proportions and scale. Transparent background. The last-to-first transition must be a normal next running step.'
 }});
}
writeFileSync(root+'/requests.json',JSON.stringify(requests,null,2)+'\n');
globalThis.console.log(JSON.stringify(requests.map(q=>({direction:q.direction,...q.args})),null,2));
