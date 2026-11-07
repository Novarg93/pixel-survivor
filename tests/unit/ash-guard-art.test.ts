import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {ashLayout,ASH_CLIPS,ashFrame,ashPose} from '../../src/game/art/ashGuardPack';
import manifest from '../../public/assets/hd/ash-guard.json';
it('preloads a separate bounded atlas with foot pivot, complete poses and actual directional frames',()=>{
 const l=ashLayout(),png=readFileSync('public/assets/hd/ash-guard.png');expect(Object.keys(manifest.frames)).toHaveLength(252);expect(l.width*l.height*4).toBeLessThanOrEqual(16*1048576);expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([l.width,l.height]);
 for(const f of l.frames){expect(manifest.frames[f.name as keyof typeof manifest.frames].frame).toEqual(f.frame);expect(f.frame.x+f.frame.w).toBeLessThanOrEqual(l.width);expect(f.frame.y+f.frame.h).toBeLessThanOrEqual(l.height);}
 for(const pose of Object.keys(ASH_CLIPS) as (keyof typeof ASH_CLIPS)[])for(const face of ['up','down','side'] as const){const names=Array.from({length:60},(_,i)=>ashFrame(pose,face,i/30,1));for(const name of names)expect(Object.keys(manifest.frames)).toContain(name);}
 expect(ashPose('approach',false,true)).toBe('phase3Idle');expect(ashPose('approach',true,true)).toBe('phase3Walk');expect(ashPose('swordActive',true,true)).toBe('swordActive');
});
