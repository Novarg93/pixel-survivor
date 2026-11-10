import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
export { png } from '../ash-warden-directions-v1/pixels.mjs';

// Lossless RGBA8 PNG reader for the repository's authored PNG exports.
export function readPNG(path) {
  const bytes = readFileSync(path), chunks = [];
  let width, height;
  for (let p = 8; p < bytes.length;) {
    const size = bytes.readUInt32BE(p), type = bytes.toString('ascii', p + 4, p + 8);
    const data = bytes.subarray(p + 8, p + 8 + size);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw Error('Expected non-interlaced RGBA8: ' + path);
    }
    if (type === 'IDAT') chunks.push(data);
    p += size + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), pixels = new Uint8Array(width * height * 4), stride = width * 4;
  const paeth = (a, b, c) => { const p = a + b - c, x = Math.abs(p-a), y = Math.abs(p-b), z = Math.abs(p-c); return x <= y && x <= z ? a : y <= z ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) throw Error('Unknown PNG filter');
    for (let x = 0; x < stride; x++) {
      const k = y * stride + x, a = x >= 4 ? pixels[k-4] : 0, b = y ? pixels[k-stride] : 0, c = y && x >= 4 ? pixels[k-stride-4] : 0;
      pixels[k] = (raw[y*(stride+1)+1+x] + [0,a,b,(a+b)>>1,paeth(a,b,c)][filter]) & 255;
    }
  }
  return {width,height,pixels};
}
