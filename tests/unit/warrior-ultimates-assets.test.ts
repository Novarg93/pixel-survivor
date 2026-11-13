import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

it('preserves all selected Warrior ultimate RGBA frames and the explicit runtime scope', () => {
  const result = execFileSync(process.execPath, ['scripts/verify-warrior-ultimates-v1.mjs'], { encoding: 'utf8', windowsHide: true });
  expect(result).toContain('"sourceFrames":63'); expect(result).toContain('"RGBA":"identical"');
});
