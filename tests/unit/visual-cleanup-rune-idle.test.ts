import {expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {visualCleanupIntegration as proof} from '../helpers/approvedWardenIntegration';
it('keeps all411 runtime files, adds four ambience files and changes only the six accepted presentation files',()=>{
 const baseline=JSON.parse(readFileSync('art/generated/visual-cleanup-rune-idle-v1/runtime-baseline.json','utf8')) as Record<string,string>;
 const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
 expect(proof).toMatchObject({baselineFiles:411,unchanged:405});expect(proof.added).toHaveLength(4);expect(proof.changed).toEqual(['src/game/art/FireUltimateArt.ts','src/game/audio/AudioController.ts','src/game/audio/AudioPresentation.ts','src/game/audio/catalog.ts','src/game/audio/samples.ts','src/game/scenes/GameScene.ts']);
 expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...proof.added].sort());
 for(const [file,old]of Object.entries({...baseline,...proof.currentSHA256}))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(proof.currentSHA256[file]??old);
});
