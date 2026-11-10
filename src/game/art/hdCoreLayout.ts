// Authoring layout of the approved B atlas. Runtime placement uses logical sizes.
export const HD_CORE_TEXTURE = 'hd-core';
export const HD_CORE_URLS = { image: 'assets/hd/core.png', data: 'assets/hd/core.json' } as const;
export function hdCoreLayout() {
  const entries: { name: string; width: number; height: number }[] = [];
  for (const facing of ['down', 'up', 'side']) for (const pose of ['idle', 'walk', 'hurt']) for (let frame = 0; frame < (pose === 'walk' ? 4 : 2); frame++) entries.push({ name: `warrior-${facing}-${pose}-${frame}`, width: 64, height: 80 });
  for (const kind of ['normal', 'elite']) for (let frame = 0; frame < 4; frame++) entries.push({ name: `grunt-${kind}-${frame}`, width: 64, height: 64 });
  entries.push({ name: 'shadow', width: 80, height: 32 });
  for (let frame = 0; frame < 4; frame++) entries.push({ name: `cleave-${frame}`, width: 192, height: 192 });
  let x = 2, y = 2, rowHeight = 0;
  const frames = entries.map(entry => { if (x + entry.width + 2 > 1024) { x = 2; y += rowHeight + 4; rowHeight = 0; } const frame = { name: entry.name, x, y, w: entry.width, h: entry.height }; x += entry.width + 4; rowHeight = Math.max(rowHeight, entry.height); return frame; });
  return { width: 1024, height: y + rowHeight + 2, frames };
}
