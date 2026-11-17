<?php

namespace App\Runs;

final readonly class RunAssessment
{
    /** @param list<string> $hardFlags
     * @param  list<string>  $reviewFlags
     * @param  array<string,int>  $items
     */
    public function __construct(public array $hardFlags, public array $reviewFlags, public array $items, public int $revives, public int $minimumScore, public int $maximumScore, public string $scoreEvidence, public string $recordHash) {}

    public function pending(): bool
    {
        return $this->hardFlags !== [] || $this->reviewFlags !== [];
    }

    /** @return array<string,mixed> */
    public function evidence(): array
    {
        return ['version' => config('run_review.version'), 'hard_flags' => $this->hardFlags, 'review_flags' => $this->reviewFlags,
            'items' => $this->items, 'revives' => $this->revives, 'minimum_score' => $this->minimumScore, 'maximum_score' => $this->maximumScore,
            'score_evidence' => $this->scoreEvidence, 'record_hash' => $this->recordHash];
    }
}
