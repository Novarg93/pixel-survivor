import {writeFileSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-hooded-front-back-cast-v2',dir=root+'/repairs/s-arm-length-v1';
const rectangle=[27,33,65,75],report=[],overrides={},base=readPNG(root+'/source/front.png');
function lowestSkin(im){let bottom=-1;for(let y=35;y<76;y++)for(let x=29;x<=62;x++){const k=(y*96+x)*4,[r,g,b,a]=im.pixels.slice(k,k+4);if(a&&r>150&&g>95&&b>60&&r>g+30&&g>b+15)bottom=Math.max(bottom,y);}return bottom;}
for(const index of [3,4]){
 const name=String(index).padStart(2,'0'),before=readPNG(dir+'/before/frame-'+name+'.png'),candidate=readPNG(dir+'/raw-'+name+'.png');
 if(candidate.width!==96||candidate.height!==96)throw Error('Unexpected edit canvas');
 const pixels=before.pixels.slice();let modified=0;
 for(let y=rectangle[1];y<=rectangle[3];y++)for(let x=rectangle[0];x<=rectangle[2];x++){
  const k=(y*96+x)*4;if(!Buffer.from(pixels.slice(k,k+4)).equals(Buffer.from(candidate.pixels.slice(k,k+4))))modified++;pixels.set(candidate.pixels.slice(k,k+4),k);
 }
 // Inspected release edit has three isolated skin-colour specks on the cloak/robe.
 // Restore those pixels from the accepted standing base, never alter a hand.
 const restored=[];
 if(index===3)for(const [x,y]of [[29,50],[27,61],[59,67]]){const k=(y*96+x)*4;pixels.set(base.pixels.slice(k,k+4),k);restored.push([x,y]);}
 const after={...before,pixels};let outsideDifferences=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  if(x>=rectangle[0]&&x<=rectangle[2]&&y>=rectangle[1]&&y<=rectangle[3])continue;
  const k=(y*96+x)*4;if(!Buffer.from(pixels.slice(k,k+4)).equals(Buffer.from(before.pixels.slice(k,k+4))))outsideDifferences++;
 }
 const oldSkinBottom=lowestSkin(before),skinBottom=lowestSkin(after);
 if(outsideDifferences||skinBottom<45||skinBottom>59||oldSkinBottom-skinBottom<8)throw Error('Arm-region validation failed '+JSON.stringify({index,outsideDifferences,oldSkinBottom,skinBottom}));
 const file='repairs/s-arm-length-v1/prepared-'+name+'.png';writeFileSync(root+'/'+file,png(pixels,96,96));
 overrides['front-s-'+index]={file,reason:'Natural arm length with foreshortening; user correction',source:'PixelLab edit of the original South pose',rectangle};
 report.push({index,rectangle,modifiedPixels:modified,outsideDifferences,oldSkinBottom,skinBottom,restoredRobePixels:restored,headAndFeetUnchanged:true});
}
writeFileSync(root+'/frame-overrides.json',JSON.stringify(overrides,null,2)+'\n');
writeFileSync(dir+'/anatomy-validation.json',JSON.stringify({frames:report,pass:true,note:'Skin extents are a visual regression bound, not inferred skeleton joint measurements. Head, boots and all pixels outside the selected arm/robe region are exact originals.'},null,2)+'\n');
globalThis.console.log(JSON.stringify(report));
