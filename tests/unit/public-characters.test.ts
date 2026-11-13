import { expect, it } from 'vitest';
import { isPublicCharacter, runCharacter } from '../../src/game/bootstrap/publicCharacters';
import { World } from '../../src/game/systems/World';
it('allows the accepted Warrior in public runs with Mage as default and an explicit dev override', () => {
  expect(isPublicCharacter('mage')).toBe(true); expect(isPublicCharacter('warrior')).toBe(true);
  expect(runCharacter()).toBe('mage'); expect(runCharacter('warrior')).toBe('warrior');
  expect(runCharacter(undefined,'warrior')).toBe('warrior');expect(runCharacter('mage','warrior')).toBe('mage');
  const warrior = new World(1, { character: runCharacter('warrior'), spawnRate: 0 });
  expect(warrior.player.hp).toBe(150); expect(warrior.abilities.cleave.level).toBe(1); expect(warrior.abilities.fireball.level).toBe(0);
});
