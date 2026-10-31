export function tileHash(x: number, y: number) { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ n >>> 13, 1274126177); return (n ^ n >>> 16) >>> 0; }
export function chunkKeys(x: number, y: number, width: number, height: number) {
  const keys: { key: string; x: number; y: number }[] = [];
  for (let cx = Math.floor((x - width / 2) / 128) - 1; cx <= Math.floor((x + width / 2) / 128) + 1; cx++) for (let cy = Math.floor((y - height / 2) / 128) - 1; cy <= Math.floor((y + height / 2) / 128) + 1; cy++) keys.push({ key: `chunk-${cx}-${cy}`, x: cx, y: cy });
  return keys;
}
