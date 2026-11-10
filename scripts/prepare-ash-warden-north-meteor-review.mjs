import {copyFileSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-north-meteor-review-v1',library='art/generated/ash-warden-animation-library-v1';
for(const d of ['source','reference','prepared','screenshots'])mkdirSync(`${root}/${d}`,{recursive:true});
const m=JSON.parse(readFileSync(`${library}/manifest.json`,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const baseline=`${root}/source/runtime-baseline.json`;
if(!existsSync(baseline))writeFileSync(baseline,JSON.stringify(Object.fromEntries([...walk('src'),...walk('public')].map(f=>[f,hash(readFileSync(f))])),null,2)+'\n');
const references={};
for(const [id,index,name]of [['north-idle',0,'north-idle'],['south-cleave',5,'flame-strike-overhead'],['meteor-fall',0,'meteor-current'],['meteor-telegraph',3,'landing-current']]){
 const layer=m.entries.find(e=>e.id===id).frames[index].layers[0],src=`${library}/${m.frames[layer.asset].file}`,dst=`${root}/reference/${name}.png`;
 copyFileSync(src,dst);references[name]={source:src,sha256:hash(readFileSync(src)),pivot:layer.pivot,scale:layer.scale};
}
const north=readPNG(`${root}/reference/north-idle.png`),padded=new Uint8Array(256*256*4),style=new Uint8Array(128*128*4);
for(let y=0;y<192;y++)padded.set(north.pixels.subarray(y*192*4,(y+1)*192*4),((y+48)*256+32)*4);
for(let y=0;y<128;y++)style.set(north.pixels.subarray(((y+28)*192+48)*4,((y+28)*192+176)*4),y*128*4);
writeFileSync(`${root}/reference/north-padded.png`,png(padded,256,256));
writeFileSync(`${root}/reference/style-native-crop.png`,png(style,128,128));
writeFileSync(`${root}/reference/empty-128.png`,png(new Uint8Array(128*128*4),128,128));
writeFileSync(`${root}/source/references.json`,JSON.stringify({references,northPadding:{offset:[32,48],canvas:[256,256],pivot:[128,202],resized:false},styleCrop:{rect:[48,28,128,128],resized:false},artGuide:{file:'docs/ART_STYLE_GUIDE.md',sha256:hash(readFileSync('docs/ART_STYLE_GUIDE.md'))}},null,2)+'\n');
globalThis.console.log('Prepared native references; runtime protected:',Object.keys(JSON.parse(readFileSync(baseline))).length);
