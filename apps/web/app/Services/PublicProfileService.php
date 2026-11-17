<?php

namespace App\Services;

use App\Models\PublicProfile;
use App\Support\CanonicalJson;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Normalizer;

class PublicProfileService
{
    public function ensure(int $userId): PublicProfile
    {
        return DB::transaction(function () use ($userId): PublicProfile {
            AccountLock::acquire($userId);
            $existing = PublicProfile::where('user_id', $userId)->first();
            if ($existing) {
                return $existing;
            }
            $id = (string) Str::uuid();
            $nickname = 'Survivor-'.substr(str_replace('-', '', $id), 0, 12);

            return PublicProfile::create(['id' => $id, 'user_id' => $userId, 'nickname' => $nickname, 'nickname_key' => strtolower($nickname)]);
        }, 5);
    }

    /** @return array<string,mixed> */
    public function dto(PublicProfile $profile): array
    {
        $next = $profile->nickname_changed_at?->addHours(config('run_review.nickname_cooldown_hours'));

        return ['id' => $profile->id, 'nickname' => $profile->nickname, 'can_rename' => ! $next || $next->isPast(), 'rename_after' => $next?->toISOString()];
    }

    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function rename(int $userId, array $input): array
    {
        $data = Validator::make($input, ['operation_id' => 'required|uuid', 'nickname' => 'required|string|max:200', 'user_id' => 'prohibited', 'is_platform_operator' => 'prohibited'])->validate();
        if (preg_match('/\p{C}/u', $data['nickname'])) {
            throw ValidationException::withMessages(['nickname' => 'Control and invisible characters are not allowed.']);
        }
        $name = Normalizer::normalize($data['nickname'], Normalizer::FORM_KC);
        $name = preg_replace('/\p{Z}+/u', ' ', is_string($name) ? $name : '');
        $name = trim((string) $name);
        if (! preg_match('/\A[\p{L}\p{N}][\p{L}\p{N}\p{M} _-]{2,23}\z/u', $name)) {
            throw ValidationException::withMessages(['nickname' => 'Use 3–24 characters: letters, numbers, spaces, _ or -.']);
        }
        $key = mb_convert_case($name, MB_CASE_FOLD, 'UTF-8');
        if (in_array($key, ['admin', 'administrator', 'moderator', 'system', 'support', 'админ', 'администратор', 'модератор'], true)) {
            throw ValidationException::withMessages(['nickname' => 'This name is reserved.']);
        }
        $operation = strtolower($data['operation_id']);
        $hash = CanonicalJson::hash(['action' => 'nickname_changed', 'nickname' => $name]);
        try {
            $receipt = DB::transaction(function () use ($userId, $name, $key, $operation, $hash): array {
                AccountLock::acquire($userId);
                $audit = app(PlatformAudit::class);
                if ($prior = $audit->replay('user:'.$userId, $operation, $hash)) {
                    return $prior;
                }
                $profile = $this->ensure($userId);
                if ($profile->nickname === $name) {
                    return $audit->record('user:'.$userId, $userId, $operation, $hash, 'nickname_unchanged', 'public_profile', $profile->id, null,
                        ['operation_id' => $operation, 'nickname' => $name]);
                }
                if (! $this->dto($profile)['can_rename']) {
                    throw ValidationException::withMessages(['nickname' => 'You can change your public name once every 24 hours.']);
                }
                if (PublicProfile::where('nickname_key', $key)->where('user_id', '!=', $userId)->exists()) {
                    throw ValidationException::withMessages(['nickname' => 'This public name is already taken.']);
                }
                $old = $profile->nickname;
                $profile->nickname = $name;
                $profile->nickname_key = $key;
                $profile->nickname_changed_at = now();
                $profile->save();

                return $audit->record('user:'.$userId, $userId, $operation, $hash, 'nickname_changed', 'public_profile', $profile->id, null,
                    ['operation_id' => $operation, 'nickname' => $name], ['previous_nickname' => $old]);
            }, 5);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['nickname' => 'This public name is already taken.']);
        }

        return ['receipt' => $receipt, 'profile' => $this->dto(PublicProfile::where('user_id', $userId)->firstOrFail())];
    }
}
