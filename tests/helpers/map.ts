import { expect, type Page } from '@playwright/test';

export async function selectTestMap(page: Page, requested: string) {
  await expect(page.getByRole('button',{name:'Dark Forest',exact:true})).toHaveCount(0);
  if(requested==='Dark Forest') {
    await page.evaluate(async()=>{const url='/src/game/events/bridge.ts';const {commands}=await import(url);commands.emit({type:'preview',biome:'dark-forest'});});
    expect(await page.evaluate(()=>window.__PIXEL__!.world.biome)).toBe('grove');
  } else await page.getByRole('button',{name:'Роща осколков',exact:true}).click();
}
