<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $level_reward_id
 * @property string|null $game_run_id
 * @property int $user_id
 * @property string $track
 * @property int $level
 * @property array<int, array<string, mixed>> $fulfillment
 * @property string $fulfillment_status
 * @property string|null $last_fulfillment_error
 * @property CarbonImmutable|null $fulfillment_attempted_at
 */
class RewardGrant extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    /** @param array<int, array<string, mixed>> $items */
    public function recordFulfillment(array $items): void
    {
        $pending = count(array_filter($items, fn (array $item) => ($item['status'] ?? '') === 'pending_fulfillment'));
        $this->fulfillment = $items;
        $this->fulfillment_status = $pending === 0 ? 'fulfilled' : ($pending === count($items) ? 'pending_fulfillment' : 'partial');
        $this->last_fulfillment_error = null;
        $this->fulfillment_attempted_at = now();
        $this->save();
    }

    protected function casts(): array
    {
        return ['level' => 'integer', 'fulfillment' => 'array', 'fulfillment_attempted_at' => 'immutable_datetime'];
    }
}
