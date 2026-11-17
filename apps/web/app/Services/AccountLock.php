<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountLock
{
    /** Call inside a transaction, before reading any account state. */
    public static function acquire(int $userId): void
    {
        if (DB::getDriverName() === 'sqlite') {
            abort_unless(DB::table('users')->where('id', $userId)->update(['updated_at' => DB::raw('updated_at')]) === 1, 404);
        } else {
            User::whereKey($userId)->lockForUpdate()->firstOrFail();
        }
    }
}
