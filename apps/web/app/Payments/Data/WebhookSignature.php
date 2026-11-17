<?php

declare(strict_types=1);

namespace App\Payments\Data;

use Illuminate\Support\Facades\Validator;

final readonly class WebhookSignature
{
    public function __construct(public int $timestamp, public string $digest, public ?string $rawHeader = null) {}

    public static function fromHeaders(?string $timestamp, ?string $digest): self
    {
        $v = Validator::make(['timestamp' => $timestamp, 'digest' => $digest], ['timestamp' => 'required|integer|min:1', 'digest' => 'required|string|regex:/^[a-f0-9]{64}$/'])->validate();

        return new self((int) $v['timestamp'], $v['digest']);
    }
}
