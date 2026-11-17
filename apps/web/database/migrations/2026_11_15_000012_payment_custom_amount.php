<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_orders', function (Blueprint $t) {
            $t->string('package_id', 60)->nullable()->change();
            $t->text('checkout_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Financial custom snapshots cannot be discarded to make the FK non-null.
        throw new RuntimeException('Forward-only financial migration; restore a verified backup instead.');
    }
};
