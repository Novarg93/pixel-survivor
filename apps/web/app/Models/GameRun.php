<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string $client_run_id
 * @property string $start_hash
 * @property string|null $finish_hash
 * @property string $character_id
 * @property string $biome_id
 * @property string $mode
 * @property string $status
 * @property string $config_version
 * @property array<string, mixed> $start_snapshot
 * @property array<string, mixed>|null $record
 * @property array<string, mixed>|null $receipt
 * @property CarbonImmutable $started_at
 * @property CarbonImmutable|null $finished_at
 * @property string $lifecycle_state
 * @property string|null $death_id
 * @property int $revive_count
 * @property int $item_sequence
 * @property CarbonImmutable|null $session_expires_at
 * @property string|null $public_id
 * @property int|null $ranking_score
 * @property int|null $ranking_elapsed_us
 * @property bool $ranking_eligible
 * @property int $review_version
 * @property array<string,mixed>|null $validation_evidence
 * @property CarbonImmutable|null $rewards_awarded_at
 * @property array<string,mixed>|null $reward_receipt
 */
class GameRun extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['start_snapshot' => 'array', 'record' => 'array', 'receipt' => 'array', 'started_at' => 'immutable_datetime', 'finished_at' => 'immutable_datetime', 'session_expires_at' => 'immutable_datetime', 'revive_count' => 'integer', 'item_sequence' => 'integer',
            'ranking_score' => 'integer', 'ranking_elapsed_us' => 'integer', 'ranking_eligible' => 'boolean', 'review_version' => 'integer', 'validation_evidence' => 'array', 'reward_receipt' => 'array', 'rewards_awarded_at' => 'immutable_datetime'];
    }
}
