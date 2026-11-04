import { expect, type Page } from '@playwright/test';
import type { CharacterId } from '../../src/game/config/characters';

// Explicit DEV fixture. Public menu access remains Mage-only in every build.
// Existing Warrior gameplay/restart assertions must keep exercising Warrior.
export async function selectTestCharacter(page: Page, hero: string) {
  if (hero !== 'Mage' && hero !== 'Warrior') throw new Error('Unknown fixture character: ' + hero);
  await expect.poll(() => page.evaluate(() => !!window.__PIXEL__)).toBe(true);
  const character: CharacterId = hero === 'Warrior' ? 'warrior' : 'mage';
  await page.evaluate((character: CharacterId) => window.__PIXEL__!.setTestCharacter(character), character);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.character)).toBe(hero.toLowerCase());
}
