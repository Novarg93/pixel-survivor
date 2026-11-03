import {register} from 'node:module';
import {writeFileSync} from 'node:fs';
import process from 'node:process';
register('./ts-art-loader.mjs',import.meta.url);
const {endgameTrial}=await import('../tests/helpers/endgame.ts');
const {World}=await import('../src/game/systems/World.ts');
const {regularMoveSpeed,spawnCadenceAt}=await import('../src/game/systems/DifficultyDirector.ts');
const {pressureAt}=await import('../src/game/systems/EndgamePressure.ts');
const {enrageAt}=await import('../src/game/config/survivalEnrage.ts');
const {spawnMeasurement}=await import('../tests/helpers/survivalEnrage.ts');
const {bossCadence}=await import('../tests/helpers/bossGuardian.ts');
const trials=[12345,67890,77].flatMap(seed=>['afk','move','blink'].map(mode=>endgameTrial(seed,mode)));
const measurements=[599,600,870,900,930,960,1080,1200,1500].map(t=>{const w=new World();w.elapsed=t;return{t,enrage:enrageAt(t),cadence:spawnCadenceAt(t),spawn:spawnMeasurement(new World(),t),pressure:pressureAt(t),speeds:Object.fromEntries(['grunt','runner','rusher','caster'].map(k=>{const e=w.spawn(k,{x:300,y:0});return[k,regularMoveSpeed(e,t)];}))};});
const bosses=[599,600,870,900,930,960,1080,1200,1500].flatMap(t=>bossCadence(t,12));
const guardians=[];const w=new World();w.elapsed=240;for(let i=0;i<12;i++){const g=w.spawn('guardian',{x:150,y:0});guardians.push({index:i+1,profile:g.guardianProfile});w.guardianSystem.dismiss(w,g.id);}
writeFileSync(`docs/enrage2/${process.argv[2]??'after'}.json`,JSON.stringify({trials,measurements,bosses,guardians},null,2));
