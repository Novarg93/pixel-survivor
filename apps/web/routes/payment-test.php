<?php

use App\Http\Controllers\TestCheckoutController;
use Illuminate\Support\Facades\Route;

// Included only with local isolated provider enabled; controller rechecks every request.
Route::middleware(['web', 'auth', 'verified'])->prefix('payments/test')->group(function () {
    Route::get('/{checkout}', [TestCheckoutController::class, 'show'])->middleware('throttle:60,1,test-checkout-read-')->name('payments.test');
    Route::post('/{checkout}', [TestCheckoutController::class, 'simulate'])->middleware('throttle:20,1,test-checkout-action-');
});
