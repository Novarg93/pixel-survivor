import type { AbilityId } from '../game/abilities/types';
import type { Snapshot } from '../game/systems/World';
import { FROST_NOVA, ARMAGEDDON } from '../game/config/mageAbilities';
import { MOBILITY_SPECIALIZATIONS as M } from '../game/config/mobilityUpgrades';
import { upgradeIdentity } from './upgradeIdentity';

export type UpgradeEmblem = AbilityId | 'ultimate-lightning' | 'ultimate-frost' | 'ultimate-fire' | 'ultimate-banner' | 'ultimate-earthbreaker' | 'ultimate-ruin' | 'projectiles' | 'damage' | 'cooldown' | 'health' | 'speed' | 'pickup' | 'area' | 'nova' | 'rune';
const general = {
  damage: ['+25%', 'урон способностей', 'damage'], cooldown: ['−10%', 'перезарядка', 'cooldown'],
  projectiles: ['+1', 'огненный шар', 'projectiles'], health: ['+20 HP', 'максимум здоровья', 'health'],
  speed: ['+13.5', 'пикселей в секунду', 'speed'], pickup: ['+20', 'радиус притяжения', 'pickup'],
  area: ['+15%', 'радиус площадной магии', 'area'], restore: ['+40 HP', 'восстановление', 'health'],
  nova: ['120', 'урона по области', 'nova'], magnet: ['Весь XP', 'собрать кристаллы', 'pickup'],
} as const satisfies Record<string, readonly [string, string, UpgradeEmblem]>;
const familyNames: Record<AbilityId, string> = { fireball: 'Огонь', frost: 'Морозная нова', lightning: 'Цепная молния', meteor: 'Армагеддон', shield: 'Тайный щит', cleave: 'Cleave', whirlwind: 'Whirlwind', slam: 'Ground Stomp', blades: 'Piercing Throw', iron: 'Shield Block' };
const summaries: Record<AbilityId, string> = {
  fireball: 'Огонь сам находит ближайшего врага. Развивай силу огненных шаров.',
  frost: 'Ледяное кольцо сковывает группу врагов. Боссы и Guardian получают ограниченное замедление.',
  lightning: 'Разряд прыгает между разными целями и поражает цепь противников.',
  meteor: 'Метеориты бьют по плотной группе. Дополнительные удары наносят 75% урона.',
  shield: 'Щит принимает урон перед HP. Новый каст обновляет запас без накопления.',
  cleave: 'Широкий автоматический удар по врагам рядом с Warrior.',
  whirlwind: 'Серия круговых импульсов по окружающим врагам.',
  slam: 'Удар по размеченной области после короткой подготовки.',
  blades: 'Полоса попадания 28px расширяется бонусами площади. Копьё пробивает 3–7 целей, каждую один раз.',
  iron: 'Shield Block: −50% урона, поглощение снарядов и Absorb 20–40% maxHP без накопления.',
};
const evolution = {
  'evolve-fireball': ['45%', 'взрыв при попадании', 'Первое попадание огненного шара вызывает взрыв в радиусе 38px.'],
  'evolve-frost': ['+0.75с', 'следующий разрешённый root', 'Два попадания усиливают следующий разрешённый root. Активный эффект и иммунитет сохраняются.'],
  'evolve-lightning': ['+2', 'вторичных разряда', 'Новые цели получают вторичные разряды с 35% урона.'],
  'evolve-meteor': ['3с', 'огонь после каждого удара', 'Каждый метеорит оставляет огонь. Дополнительный огонь наносит 75% урона.'],
  'evolve-shield': ['90px', 'защитный импульс', 'Разрушение Absorb даёт один защитный импульс за активацию щита.'],
} as const;
const rankBonuses: Record<AbilityId, (tier: number) => readonly [string, string]> = {
  fireball: () => ['+20%', 'базовый урон огня'], frost: t => [`${FROST_NOVA.root[t - 1] ?? 2}с`, 'обездвиживание'],
  lightning: () => ['+1 цель', 'и +9 урона'], meteor: t => [`${ARMAGEDDON.count[t - 1] ?? 3} удара`, 'за один каст'],
  shield: t => [`${10 + t * 5}%`, 'maxHP в Absorb'], cleave: () => ['+8', 'базовый урон'],
  whirlwind: () => ['+4', 'урон каждого импульса'], slam: () => ['+15', 'базовый урон'],
  blades: () => ['+12', 'урон копья и +1 цель'], iron: () => ['+5% HP', 'Absorb и +0.5с блока'],
};
export function upgradeCard(choice: Pick<Snapshot['choices'][number], 'id' | 'tier' | 'description'>) {
  if(choice.id.startsWith('ultimate-')) { return {...upgradeIdentity(choice.id),value:'10/10',caption:'первый заряд готов',icon:choice.id as UpgradeEmblem,label:'ULTIMATE',summary:choice.description}; }
  const { id, tier } = choice, identity = upgradeIdentity(id), rank = Math.max(0, Math.min(2, tier - 1));
  let value = 'Усиление', caption = 'на этот забег', icon: UpgradeEmblem = 'rune', label = 'Общий бонус', summary = choice.description;
  if (Object.hasOwn(general, id)) [value, caption, icon] = general[id as keyof typeof general];
  if (identity.family !== 'general' && identity.family !== 'mobility') {
    icon = id === 'projectiles' ? 'projectiles' : identity.family; label = familyNames[identity.family];
    if (id !== 'projectiles') {
      summary = summaries[identity.family];
      if (Object.hasOwn(evolution, id)) { [value, caption, summary] = evolution[id as keyof typeof evolution]; label += ' · Эволюция'; }
      else if (id.startsWith('rank-')) [value, caption] = rankBonuses[identity.family](tier);
      else { value = 'Открыть'; caption = 'новая способность'; }
    }
  }
  if (identity.family === 'mobility') {
    label = 'Специализация мобильности';
    const mobility: Record<string, readonly [string, string, UpgradeEmblem, string]> = {
      'mobility-flame-trail': [String(M.flameDamage[rank]), 'урона каждые 0.5с', 'fireball', 'Blink оставляет огненную стену по фактически пройденному пути.'],
      'mobility-slowing-flame': ['−40%', 'скорость обычных врагов', 'frost', 'Холодное пламя остаётся на пути Blink. Замедление не складывается.'],
      'mobility-arcane-sprint': [`+${Math.round((M.sprintSpeed[rank] - 1) * 100)}%`, 'скорость после Blink', 'speed', 'Короткое ускорение на 2с. Повторное применение обновляет эффект.'],
      'mobility-cleaving-dash': [String(M.cleaveDamage[rank]), 'урона по пути Dash', 'cleave', 'Одна цель получает один удар за фактически пройденный Dash.'],
      'mobility-absorb-shield': [`${M.absorbFraction[rank] * 100}%`, 'maxHP в Absorb', 'shield', 'После Dash даёт щит на 3с. Запас обновляется без накопления.'],
      'mobility-berserk': [`+${Math.round((M.berserkDamage[rank] - 1) * 100)}%`, 'урон после Dash', 'damage', `На 2с: урон +${Math.round((M.berserkDamage[rank] - 1) * 100)}%, CDR ${Math.round((1 - M.berserkCooldown[rank]) * 100)}%, скорость движения +${Math.round((M.berserkSpeed[rank] - 1) * 100)}%. Бонус CDR действует на новые перезарядки; повторный рывок обновляет эффект без накопления.`],
    };
    [value, caption, icon, summary] = mobility[id] ?? [value, caption, icon, summary];
  }
  return { ...identity, value, caption, icon, label, summary };
}
