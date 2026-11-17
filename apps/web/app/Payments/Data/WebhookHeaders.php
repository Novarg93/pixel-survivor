<?php

declare(strict_types=1);

namespace App\Payments\Data;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

final readonly class WebhookHeaders
{
    /** @param array<string, string> $values */
    private function __construct(private array $values) {}

    /** @param list<string> $names */
    public static function fromRequest(Request $request, array $names): self
    {
        Validator::make(['names' => $names], ['names' => 'array|max:10', 'names.*' => 'required|string|regex:/^[a-zA-Z0-9-]{1,80}$/'])->validate();
        $values = [];
        foreach ($names as $name) {
            $value = $request->header($name);
            if ($value !== null) {
                $values[strtolower($name)] = $value;
            }
        }
        Validator::make(['headers' => $values], ['headers' => 'array|max:10', 'headers.*' => 'string|max:2048'])->validate();

        return new self($values);
    }

    public function get(string $name): ?string
    {
        return $this->values[strtolower($name)] ?? null;
    }
}
