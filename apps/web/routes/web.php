<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CommerceController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CurrencyPreferenceController;
use App\Http\Controllers\GameAssetController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PaymentWebhookController;
use App\Http\Controllers\ProgressionController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\RunHistoryController;
use App\Http\Controllers\RunItemController;
use App\Http\Controllers\RunPaidActionController;
use App\Http\Middleware\LimitRunPayload;
use App\Payments\TestPaymentGuard;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'Welcome')->name('home');
Route::post('/currency', CurrencyPreferenceController::class)->middleware('throttle:30,1,currency-selection-')->name('currency.select');
Route::get('/guide', GuideController::class)->name('guide');
Route::inertia('/faq', 'Faq')->name('faq');
Route::get('/leaderboard', [LeaderboardController::class, 'index'])->middleware('throttle:60,1,leaderboard-page-')->name('leaderboard');
Route::get('/leaderboard/runs/{publicRun}', [LeaderboardController::class, 'show'])->whereUuid('publicRun')->middleware('throttle:60,1,leaderboard-detail-')->name('leaderboard.run');
Route::get('/api/v1/leaderboard', [LeaderboardController::class, 'index'])->middleware('throttle:60,1,leaderboard-json-');
Route::get('/api/v1/leaderboard/runs/{publicRun}', [LeaderboardController::class, 'show'])->whereUuid('publicRun')->middleware('throttle:60,1,leaderboard-json-detail-');
Route::middleware(['auth', 'verified', 'can:operate-platform'])->group(function (): void {
    Route::get('/operations', [OperationsController::class, 'index'])->middleware('throttle:30,1,operations-read-');
    Route::get('/operations/runs/{run}', [OperationsController::class, 'show'])->whereUuid('run')->middleware('throttle:30,1,operations-run-');
    Route::get('/operations/users/{user}', [OperationsController::class, 'user'])->whereNumber('user')->middleware('throttle:20,1,operations-user-');
    Route::get('/operations/users', [OperationsController::class, 'users'])->middleware('throttle:20,1,operations-users-');
    Route::get('/api/v1/operations/health', [OperationsController::class, 'health'])->middleware('throttle:2,1,operations-health-');
    Route::post('/api/v1/operations/runs/{run}/review', [OperationsController::class, 'decide'])->whereUuid('run')->middleware([LimitRunPayload::class, 'throttle:10,1,operations-review-']);
});

Route::get('/contact', fn () => Inertia::render('Contact', ['received' => session('contactReceived', false)]))->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:3,10,contact-submit-')->name('contact.store');
Route::get('/privacy', fn () => Inertia::render('Legal', ['kind' => 'privacy']))->name('privacy');
Route::get('/terms', fn () => Inertia::render('Legal', ['kind' => 'terms']))->name('terms');
Route::view('/play', 'play')->name('play');
Route::get('/assets/{path}', GameAssetController::class)->where('path', '.*')->name('game.asset');
// In production Vite BASE_URL is /build/; the unchanged game prepends it to assets/.
Route::get('/build/assets/{path}', GameAssetController::class)->where('path', '.*')->name('game.asset.built');

Route::stripeWebhooks('webhook')->name('stripe.webhook');

Route::post('/payments/webhooks/{provider}', PaymentWebhookController::class)->middleware([LimitRunPayload::class, 'throttle:120,1,payment-webhook-']);
if (app(TestPaymentGuard::class)->enabled()) {
    require __DIR__.'/payment-test.php';
}

Route::middleware(['auth', 'verified'])->group(function () {
    Route::redirect('/account', '/dashboard');
    Route::get('/account/orders', [AccountController::class, 'orders'])->name('account.orders');
    Route::get('/account/orders/payment/{order}/invoice', [AccountController::class, 'invoice'])->whereUuid('order')->middleware('throttle:20,1,invoice-read-')->name('account.invoice');
    Route::get('/account/orders/{kind}/{order}', [AccountController::class, 'order'])->where('kind', 'payment|shop')->whereUuid('order')->name('account.order');
    Route::redirect('/account/transactions', '/account/orders')->name('account.transactions');
    Route::redirect('/account/tokens', '/account/orders')->name('account.tokens');
    Route::redirect('/account/inventory-usage', '/inventory#service-usage')->name('account.inventory-usage');
    Route::get('/payments/{order}', [PaymentController::class, 'result'])->whereUuid('order')->middleware('throttle:60,1,payment-page-');
    Route::get('/payments/{order}/{view}', [PaymentController::class, 'result'])->whereUuid('order')->where('view', 'success|pending|failed|canceled')->middleware('throttle:60,1,payment-page-');
    Route::get('/wallet', [CommerceController::class, 'walletPage'])->name('wallet');
    Route::get('/shop', [CommerceController::class, 'shopPage'])->name('shop');
    Route::get('/inventory', [CommerceController::class, 'inventoryPage'])->name('inventory');
    Route::get('dashboard', [ProgressionController::class, 'dashboard'])->name('dashboard');
    Route::get('/settings/public-profile', [PublicProfileController::class, 'edit'])->name('public-profile.edit');
    Route::get('/runs', [RunHistoryController::class, 'index'])->middleware('throttle:60,1,run-history-');
    Route::get('/runs/{run}', [RunHistoryController::class, 'show'])->whereUuid('run')->middleware('throttle:60,1,run-history-detail-');

});

Route::prefix('api/v1')->middleware(['auth', 'verified', LimitRunPayload::class])->group(function () {
    Route::post('/runs/{run}/upgrade-offers', [RunPaidActionController::class, 'offer'])->whereUuid('run')->middleware('throttle:60,1,run-upgrade-offer-');
    Route::post('/runs/{run}/actions', [RunPaidActionController::class, 'execute'])->whereUuid('run')->middleware('throttle:30,1,run-paid-action-');
    Route::get('/runs/{run}/actions/{operation}', [RunPaidActionController::class, 'recover'])->whereUuid('run')->whereUuid('operation')->middleware('throttle:60,1,run-paid-recovery-');
    Route::post('/runs/{run}/actions/{operation}/ack', [RunPaidActionController::class, 'acknowledge'])->whereUuid('run')->whereUuid('operation')->middleware('throttle:60,1,run-paid-ack-');
    Route::post('/profile/nickname', [PublicProfileController::class, 'update'])->middleware('throttle:10,1,nickname-change-');
    Route::get('/runs/{run}/status', [RunHistoryController::class, 'status'])->whereUuid('run')->middleware('throttle:60,1,run-status-');
    Route::post('/payments/quote', [PaymentController::class, 'quote'])->middleware('throttle:30,1,payment-quote-');
    Route::post('/payments/orders', [PaymentController::class, 'create'])->middleware('throttle:10,1,payment-create-');
    Route::post('/payments/orders/{order}/dev-confirm', [PaymentController::class, 'confirmDev'])->whereUuid('order')->middleware('throttle:10,1,payment-dev-confirm-');
    Route::get('/payments/orders/{order}', [PaymentController::class, 'show'])->whereUuid('order')->middleware('throttle:60,1,payment-status-');
    Route::post('/payments/orders/{order}/checkout', [PaymentController::class, 'checkout'])->whereUuid('order')->middleware('throttle:10,1,payment-checkout-');
    Route::get('/wallet', [CommerceController::class, 'wallet'])->middleware('throttle:60,1,wallet-read-');
    Route::get('/shop', [CommerceController::class, 'shop'])->middleware('throttle:60,1,shop-read-');
    Route::post('/shop/purchases', [CommerceController::class, 'purchase'])->middleware('throttle:15,1,shop-purchase-');
    Route::get('/progress', [ProgressionController::class, 'show'])->middleware('throttle:60,1,progress-read-');
    // One bounded snapshot returns definitions, balances, recent operations and active effects.
    Route::get('/inventory', [InventoryController::class, 'show'])->middleware('throttle:60,1,inventory-read-');
    Route::post('/inventory/activate-xp-boost', [InventoryController::class, 'activate'])->middleware('throttle:10,1,inventory-activate-');
    Route::post('/runs', [ProgressionController::class, 'start'])->middleware('throttle:10,1,run-start-');
    Route::get('/runs/{run}/inventory', [RunItemController::class, 'show'])->whereUuid('run')->middleware('throttle:60,1,run-items-read-');
    Route::post('/runs/{run}/death', [RunItemController::class, 'death'])->whereUuid('run')->middleware('throttle:20,1,run-death-');
    Route::post('/runs/{run}/items', [RunItemController::class, 'consume'])->whereUuid('run')->middleware('throttle:30,1,run-items-use-');
    Route::post('/runs/{run}/items/{usage}/ack', [RunItemController::class, 'acknowledge'])->whereUuid('run')->whereUuid('usage')->middleware('throttle:60,1,run-items-ack-');
    Route::post('/runs/{run}/finish', [ProgressionController::class, 'finish'])->whereUuid('run')->middleware('throttle:30,1,run-finish-');
});

require __DIR__.'/settings.php';
