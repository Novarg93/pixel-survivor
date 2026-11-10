import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import console from 'node:console';
const review='art/generated/music-ambient-review-v1',output='art/generated/music-runtime-v1',assets='public/assets/audio/music-v1';
const source=JSON.parse(await readFile(`${review}/manifest.json`,'utf8'));
await mkdir(output,{recursive:true});await mkdir(assets,{recursive:true});
const entries=[];
for(const track of source.tracks){
  const take=track.takes.find(t=>t.variant===2),bytes=await readFile(`${review}/${take.file}`);
  if(createHash('sha256').update(bytes).digest('hex')!==take.sha256)throw new Error('Source SHA mismatch');
  const file=`${assets}/${track.phase}.mp3`;await copyFile(`${review}/${take.file}`,file);
  entries.push({id:track.phase,title:track.title,stage:track.stage,variant:2,file,source:`${review}/${take.file}`,generationId:take.generationId,sha256:take.sha256,bytes:bytes.length,seconds:take.analysis.seconds,gain:Number(Math.min(.1/take.analysis.rms,.7/take.analysis.peak).toFixed(6))});
}
const approval={accepted:true,selectedVariant:2,userInstruction:'везде второй вариант принимаем и накатываем',runtimeVersion:'music-v1'};
await writeFile(`${review}/approval.json`,JSON.stringify(approval,null,2)+'\n');
await writeFile(`${output}/manifest.json`,JSON.stringify({version:1,approval,sourceFlowId:source.flowId,originalBytesPreserved:true,crossfadeSeconds:1.5,entries},null,2)+'\n');
const data=Object.fromEntries(entries.map(e=>[e.id,{title:e.title,file:`assets/audio/music-v1/${e.id}.mp3`,gain:e.gain,seconds:e.seconds,variant:2}]));
await writeFile('src/game/audio/musicTracks.ts',`// User-approved second takes. Original MP3 bytes and provenance are retained.\nexport const MUSIC_TRACKS = ${JSON.stringify(data,null,2)} as const;\nexport type MusicTrackId = keyof typeof MUSIC_TRACKS;\nexport const MUSIC_CROSSFADE = 1.5;\nexport function musicTrackAt(elapsed: number, boss = false): MusicTrackId {\n  return boss ? 'boss' : elapsed >= 900 ? 'burning' : elapsed >= 600 ? 'dying' : elapsed >= 300 ? 'dusk' : 'normal';\n}\nexport const musicTrackUrl = (track: MusicTrackId) => import.meta.env.BASE_URL + MUSIC_TRACKS[track].file;\n`);
console.log(JSON.stringify({acceptedVariant:2,tracks:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0)}));
