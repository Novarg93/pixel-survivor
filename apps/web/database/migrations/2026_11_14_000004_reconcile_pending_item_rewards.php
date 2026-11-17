<?php

use App\Services\InventoryService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    // Per-grant transactions commit independently; failures remain retryable and audited.
    public $withinTransaction = false;

    public function up(): void
    {
        app(InventoryService::class)->reconcile();
    }

    public function down(): void
    { /* Issued rewards and journal history must never be silently reversed. */
    }
};
