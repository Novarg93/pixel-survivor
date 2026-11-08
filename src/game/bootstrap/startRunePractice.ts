import type { World } from '../systems/World';
import { RUNE_PRACTICE } from '../config/bossPractice';
import { preparePracticeMage } from './preparePracticeMage';
export function startRunePractice(w:World){
  preparePracticeMage(w,RUNE_PRACTICE.at);w.practiceBoss='rune-warden';
  const boss=w.spawn('sorcerer',{...RUNE_PRACTICE.spawn});
  if(!boss)throw new Error('Rune practice boss could not spawn');
}
