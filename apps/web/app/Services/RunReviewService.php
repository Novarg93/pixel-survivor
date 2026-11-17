<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\User;
use App\Support\CanonicalJson;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class RunReviewService
{
    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function decide(int $actorId, string $runId, array $input): array
    {
        Gate::forUser(User::findOrFail($actorId))->authorize('operate-platform');
        $data = Validator::make($input, ['operation_id' => 'required|uuid', 'decision' => 'required|in:approve,reject,hold',
            'expected_version' => 'required|integer|between:0,1000000', 'reason' => 'required|string|min:8|max:500',
            'user_id' => 'prohibited', 'actor_id' => 'prohibited', 'score' => 'prohibited', 'record' => 'prohibited', 'status' => 'prohibited', 'credits' => 'prohibited'])->validate();
        $target = GameRun::findOrFail($runId);
        abort_if((int) $target->user_id === $actorId, 403, 'Operators cannot review their own runs.');
        $data['operation_id'] = strtolower($data['operation_id']);
        $data['reason'] = trim($data['reason']);
        if (mb_strlen($data['reason']) < 8 || preg_match('/[\p{Cc}\p{Cf}]/u', $data['reason'])) {
            throw ValidationException::withMessages(['reason' => 'Provide at least eight visible characters without control characters.']);
        }
        $hash = CanonicalJson::hash(['run_id' => $runId, ...$data]);

        return DB::transaction(function () use ($actorId, $target, $data, $hash): array {
            AccountLock::acquire((int) $target->user_id);
            $audit = app(PlatformAudit::class);
            if ($prior = $audit->replay('user:'.$actorId, $data['operation_id'], $hash)) {
                return $prior;
            }
            $run = GameRun::findOrFail($target->id);
            abort_unless($run->record && $run->finished_at && in_array($run->status, ['accepted', 'pending_review'], true), 409, 'Only submitted non-rejected results can be reviewed.');
            abort_unless($run->review_version === (int) $data['expected_version'], 409, 'Review changed; refresh before deciding.');
            $before = $run->status;
            $board = app(LeaderboardService::class);
            $assessment = app(RunAssessmentService::class)->assess($run, $run->record, $run->finished_at);
            $awarded = false;
            $noop = $data['decision'] === 'approve' && $before === 'accepted';
            if ($data['decision'] === 'approve') {
                abort_unless($assessment->hardFlags === [], 409, 'Hard consistency failures cannot be overridden.');
                if (! $noop) {
                    $run->status = 'accepted';
                    $board->setFacts($run, $assessment, true);
                    $run->save();
                    $awarded = $run->rewards_awarded_at === null;
                    app(ProgressionService::class)->awardAcceptedLocked($run);
                }
            } else {
                abort_unless($data['decision'] !== 'hold' || $before === 'accepted', 409, 'Only accepted results can be held.');
                // Preserve historical awards. A later release must never award them again.
                if ($before === 'accepted' && ! $run->rewards_awarded_at) {
                    $run->rewards_awarded_at = $run->finished_at;
                    $run->reward_receipt = $run->receipt;
                }
                $run->status = $data['decision'] === 'hold' ? 'pending_review' : 'rejected';
                $board->setFacts($run, $assessment);
            }
            if (! $noop) {
                $run->review_version++;
            }
            $run->save();
            $result = ['public_run_id' => $run->public_id, 'status' => $run->status, 'review_version' => $run->review_version,
                'awarded_now' => $awarded, 'reward_receipt' => $run->reward_receipt, 'record_hash' => $assessment->recordHash];
            $result = $audit->record('user:'.$actorId, $actorId, $data['operation_id'], $hash,
                'review_'.$data['decision'].($noop ? '_noop' : ''), 'game_run', (string) $run->public_id, $data['reason'], $result,
                ['previous_status' => $before, 'assessment' => $assessment->evidence()]);
            $board->syncUserLocked((int) $run->user_id);

            return $result;
        }, 5);
    }
}
