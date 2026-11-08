import type {World} from '../systems/World';
import {BRIAR_PRACTICE} from '../config/bossPractice';
import {preparePracticeMage} from './preparePracticeMage';
export function startBriarPractice(w:World){
  preparePracticeMage(w,BRIAR_PRACTICE.at);w.practiceBoss='briar-beast';
  if(!w.spawn(BRIAR_PRACTICE.kind,{...BRIAR_PRACTICE.spawn}))throw new Error('Briar practice boss could not spawn');
}
