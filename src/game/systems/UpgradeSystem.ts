import { ULTIMATE_DEFINITIONS, isUltimateId } from '../config/ultimates';
import type { World } from './World';
import { ABILITIES } from '../abilities/definitions';
import { distance } from '../utils/math';
import { MOBILITY_MAX_RANK, MOBILITY_SPECIALIZATION_LEVEL, MOBILITY_UPGRADES } from '../config/mobilityUpgrades';
const RANK_TEXT = {
  fireball: '+20% базового урона огня. V + Жар III: дополнительный пробивающий шар.',
  frost: 'I: root 1.2с. II: радиус +20%. III: базовый cooldown −15%. IV: root 1.7с. V: root 2с и ещё +20% радиуса. Урон +6 за ранг; V + Широкий круг III сохраняет +30% урона.',
  lightning: '+9 урона и +1 цель в цепи (до 7 целей).',
  meteor: '+25 урона и +7px радиуса. I–V: 1/1/2/2/3 метеорита. Интервал 0.15с; дополнительные удары наносят 75% урона. При равной плотности приоритет у целей под root.',
  shield: 'Absorb I–V: 15/20/25/30/35% maxHP. +1с действия за ранг. Повторный каст обновляет запас без накопления.',
  cleave: '+8 базового урона широкого удара.',
  whirlwind: '+4 урона каждому из круговых импульсов.',
  slam: '+15 урона и +5px радиуса удара.',
  blades: '+4 урона клинков. На II/IV ранге ещё один клинок.',
  iron: '+0.5с действия железной кожи.',
};
export interface UpgradeDefinition { id: string; name: string; description: string; max: number; apply: (world: World) => void; eligible?: (world: World) => boolean }
export const UPGRADES: UpgradeDefinition[] = [
  ...MOBILITY_UPGRADES.map(u => ({ id: `mobility-${u.id}`, name: u.name, description: u.description + ' Одна специализация за забег.', max: MOBILITY_MAX_RANK, eligible: (w: World) => (w.status === 'playing' || w.status === 'upgrade') && w.character === u.character && w.experience.level >= MOBILITY_SPECIALIZATION_LEVEL && (w.mobility.variant ? w.mobility.variant === u.id : w.upgradeLevel >= MOBILITY_SPECIALIZATION_LEVEL) && w.mobility.rank < MOBILITY_MAX_RANK, apply: (w: World) => { w.mobility.upgrade(w, u.id); } })),
  { id: 'damage', name: 'Жар углей', description: '+25% к урону способностей.', max: 5, apply: w => { w.stats.damage += 0.25; } },
  { id: 'cooldown', name: 'Быстрый ритуал', description: 'Перезарядка способностей быстрее на 10%.', max: 5, apply: w => { w.stats.cooldown *= 0.9; } },
  { id: 'projectiles', name: 'Двойная искра', description: '+1 огненный шар за атаку (до 4).', max: 3, apply: w => { w.stats.projectiles++; } },
  { id: 'speed', name: 'Лёгкий шаг', description: '+13.5px/с к скорости перемещения.', max: 4, apply: w => { w.player.speed += 13.5; } },
  { id: 'health', name: 'Сила корней', description: '+20 к максимальному здоровью и лечение 30 HP.', max: 5, apply: w => { w.player.maxHp += 20; w.player.hp = Math.min(w.effectiveMaxHp, w.player.hp + 30); } },
  { id: 'pickup', name: 'Притяжение', description: '+20 к радиусу притяжения кристаллов.', max: 5, apply: w => { w.stats.pickup += 20; } },
  { id: 'area', name: 'Широкий круг', description: '+15% к радиусу площадной магии.', max: 4, apply: w => { w.stats.area += 0.15; } },
  ...ABILITIES.filter(a => a.id !== 'fireball' && a.id !== 'cleave').map(a => ({ id: `unlock-${a.id}`, name: a.name, description: a.description ?? `Открыть: ${a.id === 'lightning' ? 'молния прыгает между врагами' : 'периодический щит поглощает удары'}.`, max: 1, eligible: (w: World) => w.abilityDefinitions.includes(a) && w.abilities[a.id].level === 0, apply: (w: World) => { w.abilities[a.id].level = 1; } })),
  ...ABILITIES.map(a => ({ id: `rank-${a.id}`, name: `${a.name} +`, description: RANK_TEXT[a.id], max: 4, eligible: (w: World) => w.abilityDefinitions.includes(a) && w.abilities[a.id].level > 0 && w.abilities[a.id].level < 5, apply: (w: World) => { w.abilities[a.id].level++; } })),
  ...ABILITIES.filter(a => !a.character).map(a => ({ id: `evolve-${a.id}`, name: `${a.name}: эволюция`, description: ({ fireball: 'Первое попадание шара: взрыв 45% урона в радиусе 38px.', frost: 'Два попадания за 4с: +0.75с следующему разрешённому root, не чаще раза в 6с. Не продлевает активный root и не обходит иммунитет после него.', lightning: 'Два вторичных разряда по новым целям с 35% уроном.', meteor: 'Каждый удар оставляет огонь на 3с с периодом 0.5с. Огонь дополнительных метеоритов тоже наносит 75% урона.', shield: 'Разрушение Absorb вызывает один защитный импульс 90px за активацию щита.' })[a.id as 'fireball' | 'frost' | 'lightning' | 'meteor' | 'shield'], max: 1, eligible: (w: World) => w.abilityDefinitions.includes(a) && w.abilities[a.id].level >= 3, apply: () => undefined })),
];
export const SUPPLIES: UpgradeDefinition[] = [
  { id: 'restore', name: 'Глоток жизни', description: 'Восстановить 40 HP.', max: Infinity, apply: w => { w.player.hp = Math.min(w.effectiveMaxHp, w.player.hp + 40); } },
  { id: 'nova', name: 'Вспышка', description: '120 урона всем врагам в радиусе 150px.', max: Infinity, apply: w => { for (const e of [...w.enemies]) if (distance(w.player, e) <= 150 + e.radius) w.damageEnemy(e, 120, 'nova'); w.effect('death', w.player, 150, 0xdabaff); } },
  { id: 'magnet', name: 'Зов кристаллов', description: 'Собрать все кристаллы на поле.', max: Infinity, apply: w => { w.collectAllOrbs(); } },
];
export function eligibleUpgrades(w: World) { return UPGRADES.filter(u => (u.id !== 'projectiles' || w.character === 'mage') && (w.upgrades[u.id] ?? 0) < u.max && (!u.eligible || u.eligible(w))); }
export function chooseUpgrades(w: World) {
  if(w.ultimate.eligible(w)) return ULTIMATE_DEFINITIONS.map(d=>({id:`ultimate-${d.id}`,name:d.name,description:d.description,max:1,apply:()=>undefined}));
  const eligible = eligibleUpgrades(w);
  if (!w.mobility.variant && w.upgradeLevel >= MOBILITY_SPECIALIZATION_LEVEL) return eligible.filter(u => u.id.startsWith('mobility-'));
  const pool = eligible.length >= 3 ? [...eligible] : [...eligible, ...SUPPLIES];
  const result: UpgradeDefinition[] = [];
  while (result.length < 3 && pool.length) result.push(pool.splice(w.rng.int(pool.length), 1)[0]);
  return result;
}
export function applyUpgrade(w: World, id: string) {
  const ultimate = id.slice('ultimate-'.length);
  if(id.startsWith('ultimate-') && isUltimateId(ultimate)) return w.ultimate.choose(w,ultimate);
  const upgrade = [...UPGRADES, ...SUPPLIES].find(u => u.id === id);
  if (!upgrade || (w.upgrades[id] ?? 0) >= upgrade.max || (upgrade.eligible && !upgrade.eligible(w))) return false;
  upgrade.apply(w); w.upgrades[id] = (w.upgrades[id] ?? 0) + 1; return true;
}
