import { createServer } from 'vite';
import process from 'node:process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import {fileURLToPath,URL} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { UPGRADES, SUPPLIES } = await server.ssrLoadModule('/src/game/systems/UpgradeSystem.ts');
  const { ABILITIES } = await server.ssrLoadModule('/src/game/abilities/definitions.ts');
  const { MOBILITY_UPGRADES, MOBILITY_SPECIALIZATION_LEVEL, MOBILITY_MAX_RANK } = await server.ssrLoadModule('/src/game/config/mobilityUpgrades.ts');
  const { ULTIMATE, ultimateDefinitions } = await server.ssrLoadModule('/src/game/config/ultimates.ts');
  const entries = [...UPGRADES, ...SUPPLIES].map(u => {
    const ability = ABILITIES.find(a => ['unlock-', 'rank-', 'evolve-'].some(p => p + a.id === u.id));
    const mobility = MOBILITY_UPGRADES.find(m => 'mobility-' + m.id === u.id);
    return { id: u.id, name: u.name, description: u.description, max: Number.isFinite(u.max) ? u.max : 1000,
      character: ability ? ability.character ?? 'mage' : mobility?.character ?? (u.id === 'projectiles' ? 'mage' : null),
      rule: mobility ? 'mobility' : ability ? u.id.split('-')[0] : SUPPLIES.includes(u) ? 'supply' : 'stat',
      ability: ability?.id ?? null, category: mobility?.category ?? null };
  });
  await mkdir('apps/web/resources/game', { recursive: true });
  const json = JSON.stringify({
    version: 'upgrade-pool-v1', entries, mobilityLevel: MOBILITY_SPECIALIZATION_LEVEL, mobilityMax: MOBILITY_MAX_RANK,
    ultimateLevel: ULTIMATE.level, ultimateTime: ULTIMATE.time,
    ultimates: { mage: ultimateDefinitions('mage'), warrior: ultimateDefinitions('warrior') },
    abilities: ABILITIES.map(a => ({ id: a.id, character: a.character ?? 'mage' })),
  }, null, 2) + '\n';
  if(process.argv.includes('--check')){
    if(await readFile('apps/web/resources/game/upgrade-catalog.json','utf8')!==json)throw new Error('Upgrade catalog is stale. Run npm run export:upgrades.');
  }else await writeFile('apps/web/resources/game/upgrade-catalog.json',json);
} finally { await server.close(); }
