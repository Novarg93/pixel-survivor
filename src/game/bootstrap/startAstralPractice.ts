import type {World} from '../systems/World';
import {ASTRAL_PRACTICE} from '../config/bossPractice';
import {preparePracticeMage} from './preparePracticeMage';
export function startAstralPractice(w:World){
  preparePracticeMage(w,ASTRAL_PRACTICE.at);w.practiceBoss='astral-revenant';
  if(!w.spawn(ASTRAL_PRACTICE.kind,{...ASTRAL_PRACTICE.spawn}))throw new Error('Astral practice boss could not spawn');
}
