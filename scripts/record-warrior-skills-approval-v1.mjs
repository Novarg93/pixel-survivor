import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';

const root='art/generated/warrior-skills-directions-review-v5',m=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'));
const registryPath='docs/art/PIXELLAB_ACCEPTED_GENERATIONS.json',registry=JSON.parse(readFileSync(registryPath,'utf8'));
const prefix='warrior-skills-runtime-v1-';
if(registry.records.some(r=>r.id===prefix+'front-cleave'))throw Error('Approval already recorded');
function recipe(c,base){
 if(!c.jobFile&&c.selectedJob)c={...c,jobFile:`source/jobs/${c.selectedJob}.json`};
 if(c.jobFile&&!c.jobFile.includes('patch')){
  const j=JSON.parse(readFileSync(resolve(base,c.jobFile),'utf8'));
  if(j.args)return {tool:j.tool,args:j.args,prompt:j.args.description,enhancedPrompt:j.enhanced_prompt??null,jobId:j.job_id??c.jobId,seed:j.args.seed??null,sourceReference:j.reference??c.inputReference??null,lastReference:j.lastReference??c.lastReference??null,jobFile:resolve(base,c.jobFile).replace(resolve('.')+'\\','').replaceAll('\\','/')};
 }
 const old=registry.records.find(r=>r.jobId===c.jobId&&r.args);
 if(old)return {tool:old.tool,args:old.args,prompt:old.prompt,enhancedPrompt:old.enhancedPrompt??null,jobId:c.jobId,seed:old.args.seed??null,sourceReference:old.sourceReference??old.reference??c.inputReference??null,lastReference:old.lastReference??null,jobFile:old.jobFile??null};
 if(c.canonicalManifest){const path=resolve(base,c.canonicalManifest),m=JSON.parse(readFileSync(path,'utf8'));const next=m.clips?.[c.canonicalClip]??m.variants?.[c.canonicalClip];if(next)return recipe(next,dirname(path));}
 if(c.jobId===null)return {tool:'User-exported PixMiniMax PNG',prompt:'whirlwind animation line warrior on diablo 4',args:{frame_count:12,enhance_prompt:true,direction:'south',view:'low top-down',no_background:true,first_frame:'default stance',last_frame:'same default stance'},seed:null,jobId:null,enhancedPrompt:null,sourceReference:'art/generated/warrior/animation/whirlwind/whirlwind.png'};
 throw Error('Missing exact recipe '+c.id);
}
const records=Object.values(m.clips).map(c=>({id:prefix+c.id,date:'2026-11-13',title:`Warrior skills v5: ${c.id}`,role:`Accepted runtime ${c.skill}, ${c.group}; all eight review routes`,kind:'animation',...recipe(c,root),artifact:`${root}/${c.spriteSheet}`,manifest:`${root}/manifest.json`,clip:c.id,accepted:true,sourcePixels:'Final v5 pixels, including accepted shield repairs; original motion provenance retained',edit:c.id==='north-cleave'?{tool:'PixelLab pixelart_workbench',recipe:`${root}/source/shield-patches.json`,pixels:691}:c.id==='north-throw'?{tool:'Aseprite Lua API',native:`${root}/aseprite/north-throw.aseprite`,recipe:`${root}/source/aseprite-repair.json`,pixels:1104}:c.id==='north-whirlwind'?{tool:'Aseprite Lua API',native:`${root}/aseprite/north-whirlwind.aseprite`,recipe:`${root}/source/whirlwind-aseprite-repair.json`,pixels:574}:null}));
registry.records.push(...records);
registry.userDecisions??=[];registry.userDecisions.push({date:'2026-11-13',acceptanceText:'так кодекс последняя задача была на доработку скилов воина, я их принимаю все, накатывай в игру',accepted:records.map(r=>r.id),scope:'All final v5 clips/directions and programmatic stomp crack; integrate into gameplay. Rejected historical trials remain rejected.'});
writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
const journalPath='docs/art/PIXELLAB_PROMPT_JOURNAL.md';
let entry='\n\n## 2026-11-13 — приняты все финальные навыки Warrior v5 и интеграция\n\nЯвное «я их принимаю все, накатывай в игру» относится к последней демке v5. Приняты все 12 клипов / 48 сочетаний, включая исправленные северные Cleave/Whirlwind/Throw, новый Stomp r2 и front Throw r3. Старые отклонённые пробы не возвращаются. N/NE direct, NW mirror. Южный пользовательский эталон Whirlwind и его рецепт неизменны.\n\nНиже точные сохранённые рецепты выбранных исходников; edits относятся к финальным пикселям v5. Неизвестные данные остаются null. Новых генераций нет.\n';
for(const record of records)entry+=`\n### ${record.clip}\n\n\`\`\`json\n${JSON.stringify(record,null,2)}\n\`\`\`\n`;
entry+='\nОтдельная принятая трещина: `'+root+'/effects/stomp-crack.png`, оригинальная программная пиксельная графика, `source/crack.mjs`, SHA '+m.crack.sha256+'. AI prompt/seed/job отсутствуют. Игровой летящий spear — оригинальная программная текстура `scripts/build-warrior-skills-v1.mjs`, не AI и не отдельная приёмка генерации.\n';
writeFileSync(journalPath,readFileSync(journalPath,'utf8')+entry);
const poolPath='docs/classes/warrior/APPROVED_ANIMATION_POOL.json',pool=JSON.parse(readFileSync(poolPath,'utf8'));
pool.version++;pool.date='2026-11-13';pool.scope='Final skills v5 plus previously accepted Idle/Run/autoattacks integrated in game';
pool.skillReviewHistory??=[];pool.skillReviewHistory.push({date:'2026-11-12',pendingSkillReview:pool.pendingSkillReview,pendingNorthReview:pool.pendingNorthReview});
pool.acceptedSkillRuntime={manifest:'src/game/art/warriorSkillsManifest.json',source:`${root}/manifest.json`,accepted:true,integrated:true,clips:Object.keys(m.clips),routes:m.routes,registryIds:records.map(r=>r.id)};
pool.acceptedSkillRuntime.routes=Object.fromEntries(Object.entries(m.routes).map(([d,r])=>[d,{...r,accepted:true}]));
pool.pendingSkillReview={manifest:`${root}/manifest.json`,clips:[],accepted:true,resolvedBy:'2026-11-13 explicit all-skills approval',runtimeManifest:'src/game/art/warriorSkillsManifest.json'};
pool.pendingNorthReview={manifest:`${root}/manifest.json`,accepted:true,integrated:true,resolvedBy:'acceptedSkillRuntime'};
writeFileSync(poolPath,JSON.stringify(pool,null,2)+'\n');
const guidePath='docs/art/PIXELLAB_GENERATION_GUIDE.md';writeFileSync(guidePath,'# Актуальный статус 2026-11-13\n\nВсе финальные навыки демки `warrior-skills-directions-review-v5` явно приняты и подключены в игру; прежние pending-описания ниже сохраняют историю. Точные рецепты/ручные правки — в журнале, registry и `APPROVED_ANIMATION_POOL.json.acceptedSkillRuntime`. Север N/NE direct, NW mirror. Южный Whirlwind пользователя и его 12-frame PixMiniMax + Enhance рецепт не менялись. Новых генераций нет.\n\n'+readFileSync(guidePath,'utf8'));
