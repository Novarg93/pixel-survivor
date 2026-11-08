import type { World } from '../systems/World';
import { FINAL_BOSS } from '../config/finalBoss';
import { preparePracticeMage } from './preparePracticeMage';

// The tested level54/53-choice Mage build, applied through normal upgrade rules.
export function startBossPractice(w:World){
  preparePracticeMage(w,FINAL_BOSS.at);w.practiceBoss='ash-warden';w.finalEncounter.begin(w);
}
