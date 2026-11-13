import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
import assert from 'node:assert/strict';

const root='art/generated/warrior-spear-empty-hand-review-v1';
const review=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'));
const edits=new Map(review.changes.filter(f=>f.changedPixels>0).map(f=>[f.source,f]));
export function emptyHandSource(base,frame){
 const file=posix.normalize(`${base}/${frame.source}`),edit=edits.get(file);
 if(!edit)return frame;
 assert.equal(frame.sha256,edit.sourceSHA256,file);
 const target=`${root}/frames/${edit.clip}-${String(edit.index).padStart(2,'0')}.png`;
 const sha256=createHash('sha256').update(readFileSync(target)).digest('hex');
 assert.equal(sha256,edit.editedSHA256,target);
 return {...frame,source:posix.relative(base,target),sha256};
}
