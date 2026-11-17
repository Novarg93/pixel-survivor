<?php

use App\Services\WalletService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        app(WalletService::class)->reconcileRewards();
    }

    public function down(): void
    {
        // Credit history is never silently reversed. Schema rollback is not a refund.
    }
};
