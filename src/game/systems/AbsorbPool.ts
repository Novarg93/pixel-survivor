// One bounded capacity per source. Refresh replaces, never stacks; simulation time only.
export class AbsorbPool {
  absorb=0; absorbUntil=0;
  absorbValue(now:number){return now<this.absorbUntil?Math.max(0,this.absorb):0;}
  refreshAbsorb(amount:number,until:number){this.absorb=Number.isFinite(amount)?Math.max(0,amount):0;this.absorbUntil=Number.isFinite(until)?until:0;}
  absorbDamage(now:number,amount:number){const used=Number.isFinite(amount)?Math.min(this.absorbValue(now),Math.max(0,amount)):0;this.absorb=Math.max(0,this.absorbValue(now)-used);return used;}
  clearAbsorb(){this.absorb=this.absorbUntil=0;}
}
