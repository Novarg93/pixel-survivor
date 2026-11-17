import type {AbilityId} from './types';
import {BALANCE} from '../config/gameBalance';
import {ARMAGEDDON,frostNovaStats} from '../config/mageAbilities';
/** Base damage before the existing World applies upgrades, artifacts and buffs once. */
export function baseDamage(id:AbilityId,rank:number):number {
  switch(id){
    case 'fireball':return BALANCE.fireballDamage*(1+(rank-1)*.2);
    case 'lightning':return 22+rank*9;
    case 'frost':return frostNovaStats(rank).damage;
    case 'meteor':return ARMAGEDDON.damageBase+rank*ARMAGEDDON.damagePerRank;
    case 'cleave':return 26+rank*8;
    case 'whirlwind':return 9+rank*4;
    case 'slam':return 45+rank*15;
    case 'blades':return 30+rank*12;
    case 'shield':case 'iron':return 0;
  }
}
