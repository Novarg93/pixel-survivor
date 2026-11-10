// Snapshot order breaks the initial no-hit tie; actual damage order selects
// the most recently hurt living miniboss, even for hits in the same tick.
export function selectedBossBar<T extends {damageOrder:number}>(bosses:readonly T[]):T|undefined{
  return bosses.reduce<T|undefined>((chosen,boss)=>!chosen||boss.damageOrder>chosen.damageOrder?boss:chosen,undefined);
}
