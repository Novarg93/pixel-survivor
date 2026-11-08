import type {World} from '../systems/World';
import {GUARDIAN_PRACTICE} from '../config/bossPractice';
import {preparePracticeMage} from './preparePracticeMage';
export function startGuardianPractice(w:World){
  preparePracticeMage(w,GUARDIAN_PRACTICE.at);w.practiceBoss='rootbound-guardian';
  if(!w.spawn(GUARDIAN_PRACTICE.kind,{...GUARDIAN_PRACTICE.spawn}))throw new Error('Guardian practice miniboss could not spawn');
}
