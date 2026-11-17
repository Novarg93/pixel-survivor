// A separate document imports the original entry; no fork of the game or its CSS.
import { installPlatform } from '../../../../src/game/platform/port';
import { HttpPlatform } from './platform/HttpPlatform';
if (document.getElementById('app')?.dataset.platformAccount === '1') installPlatform(new HttpPlatform());
void import('../../../../src/main');
