import {readFileSync,writeFileSync} from 'node:fs';
const root='art/generated/mage-phantom-cast-pixellab-v1';
function inspect(input,removeLoop){const b=readFileSync(input);if(!/^GIF8[79]a$/.test(b.toString('ascii',0,6)))throw Error('Bad GIF');
  const width=b.readUInt16LE(6),height=b.readUInt16LE(8);let p=13+((b[10]&128)?3*(1<<((b[10]&7)+1)):0),last=0,parts=[],delays=[],frames=0,loops=[];
  const skipBlocks=()=>{while(b[p]){p+=1+b[p];}p++;};
  while(p<b.length){const start=p,code=b[p++];if(code===0x3b)break;
    if(code===0x21){const kind=b[p++];if(kind===0xf9){delays.push(b.readUInt16LE(p+2)*10);p+=b[p]+2;}else if(kind===0xff){const n=b[p++],name=b.toString('ascii',p,p+n);p+=n;const loop=name==='NETSCAPE2.0'||name==='ANIMEXTS1.0';if(loop)loops.push(b.readUInt16LE(p+2));skipBlocks();if(loop&&removeLoop){parts.push(b.subarray(last,start));last=p;}}else skipBlocks();
    }else if(code===0x2c){frames++;const packed=b[p+8];p+=9;if(packed&128)p+=3*(1<<((packed&7)+1));p++;skipBlocks();}else throw Error('Unknown GIF block '+code+' at '+start);
  }
  if(removeLoop&&loops.length){parts.push(b.subarray(last));writeFileSync(input,Buffer.concat(parts));}
  return {file:input.slice(root.length+1),width,height,frames,durationsMs:delays,durationMs:delays.reduce((a,b)=>a+b,0),removedLoopExtensions:loops,oneShot:true};
}
const results=['phantom-cast.gif','phantom-cast-alpha.gif'].map(file=>inspect(root+'/'+file,true));
for(const r of results)if(r.frames!==12||r.durationMs!==340)throw Error('GIF count/timing mismatch');
writeFileSync(root+'/validation/gif-audit.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
