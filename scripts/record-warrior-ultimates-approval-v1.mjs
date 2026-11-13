import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const load = path => JSON.parse(readFileSync(path, 'utf8'));
const source = 'art/generated/warrior-animation-review-v1', archive = load(`${source}/manifest.json`);
const runtime = load('src/game/art/warriorUltimatesManifest.json');
const registryPath = 'docs/art/PIXELLAB_ACCEPTED_GENERATIONS.json', registry = load(registryPath);
const prefix = 'warrior-ultimates-accepted-v1-';
assert(!registry.records.some(r => r.id.startsWith(prefix)), 'Approval already recorded');
const records = Object.keys(runtime.clips).map(id => {
  const clip = archive.clips[id], jobFile = `${source}/source/jobs/${clip.selectedJob ?? id}.json`, job = load(jobFile);
  assert.equal(job.job_id, clip.jobId, id);
  return { id: prefix + id, date: '2026-11-13', title: `Warrior ultimate: ${id}`, role: id.startsWith('gesture-') ? 'Accepted front body gesture, S/SE/E direct, SW/W mirrored' : 'Accepted ultimate effect, all eight gameplay directions', kind: 'animation', tool: job.tool, args: job.args, prompt: job.args.description ?? job.args.action, enhancedPrompt: job.enhanced_prompt ?? null, seed: job.args.seed ?? null, jobId: job.job_id, sourceReference: `${source}/${clip.inputReference}`, lastReference: job.lastReference ?? job.args.last_frame_url ?? null, jobFile, manifest: `${source}/manifest.json`, runtimeManifest: 'src/game/art/warriorUltimatesManifest.json', clip: id, playbackFrames: clip.frames, frameMs: clip.frameMs, periodMs: clip.periodMs, pivot: clip.pivot, accepted: true };
});
registry.records.push(...records);
registry.userDecisions ??= [];
registry.userDecisions.push({ date: '2026-11-13', acceptanceText: runtime.acceptance.text, accepted: records.map(r => r.id), scope: 'Integrate the three accepted ultimates from warrior-ultimates-animation-review-v1; preserve playback exclusions and existing selected northern skill reuse. No new generation or approval of rejected probes.' });
writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
const journalPath = 'docs/art/PIXELLAB_PROMPT_JOURNAL.md';
let entry = '\n\n## 2026-11-13 — принятые варианты трёх ультимейтов подключены в игру\n\nПрямое поручение: «давай интегрировать принятые варианты ультмейтов в игру». Точный выбранный просмотр — `art/generated/warrior-ultimates-animation-review-v1/viewer.html`. Приняты Banner A, Earthbreaker A, Spear of Ruin B с показанными body/VFX. Исторические pending-записи выше сохранены. Новых AI-заданий нет.\n\nНиже точные рецепты выбранных архивных клипов. Неудачные исходники Banner v1/v2 и Ruin v1 не принимаются. В Banner VFX сохраняется исключение source frames 3/4; в Ruin body — frame 6. N/NE используют уже принятые north-block/stomp/throw от ячейки 4, NW — зеркало, с тем же contact-retiming, что в просмотре; новых северных генераций нет. Полные прежние рецепты северных навыков и южного Whirlwind не меняются.\n';
for (const r of records) entry += `\n### ${r.clip}\n\n\`\`\`json\n${JSON.stringify(r, null, 2)}\n\`\`\`\n`;
entry += '\nГраница лечения, контактные линии/осколки разлома и финальный импульс копья — оригинальная программная Graphics-композиция; prompt/seed/job отсутствуют. Атлас упакован без изменения RGBA; runtime использует simulation clock World.elapsed. Рецепты не означают принятие неизвестных параметров: отсутствующие значения остаются null.\n';
writeFileSync(journalPath, readFileSync(journalPath, 'utf8') + entry);
const poolPath = 'docs/classes/warrior/APPROVED_ANIMATION_POOL.json', pool = load(poolPath);
pool.version++; pool.date = '2026-11-13';
pool.acceptedUltimateRuntime = { accepted: true, integrated: true, acceptance: runtime.acceptance, manifest: 'src/game/art/warriorUltimatesManifest.json', concepts: runtime.sourceConcepts, clips: Object.keys(runtime.clips), northBodyReuse: runtime.northBodyReuse, registryIds: records.map(r => r.id) };
writeFileSync(poolPath, JSON.stringify(pool, null, 2) + '\n');
