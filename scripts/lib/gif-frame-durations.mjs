import {readFileSync} from 'node:fs';

// Timing metadata only; companion PNG sheets retain their original RGBA colors.
export function gifFrameDurations(file,canvas=96){
 const bytes=readFileSync(file);if(!/^GIF8[79]a$/.test(bytes.toString('ascii',0,6)))throw Error('Not a GIF '+file);
 let pos=13+(bytes[10]&128?3*(2**((bytes[10]&7)+1)):0),delay=0;const durations=[];
 const blocks=()=>{while(bytes[pos]){pos+=bytes[pos]+1;if(pos>=bytes.length)throw Error('Truncated GIF');}pos++;};
 while(pos<bytes.length){const kind=bytes[pos++];if(kind===0x3b)break;
  if(kind===0x21){const label=bytes[pos++];if(label===0xf9){if(bytes[pos]!==4)throw Error('GIF control');delay=bytes.readUInt16LE(pos+2)*10;}blocks();}
  else if(kind===0x2c){const flags=bytes[pos+8];pos+=9;if(flags&128)pos+=3*(2**((flags&7)+1));pos++;blocks();if(!delay)throw Error('Missing GIF delay');durations.push(delay);delay=0;}
  else throw Error('Unexpected GIF block '+kind);
 }
 if(bytes.readUInt16LE(6)!==canvas||bytes.readUInt16LE(8)!==canvas||!durations.length)throw Error('GIF size/count');return durations;
}
