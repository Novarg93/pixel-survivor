<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\GameAssetController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'Welcome')->name('home');
Route::inertia('/faq', 'Faq')->name('faq');
Route::get('/contact', fn () => Inertia::render('Contact', ['received' => session('contactReceived', false)]))->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:3,10')->name('contact.store');
Route::get('/privacy', fn () => Inertia::render('Legal', ['kind' => 'privacy']))->name('privacy');
Route::get('/terms', fn () => Inertia::render('Legal', ['kind' => 'terms']))->name('terms');
Route::view('/play', 'play')->name('play');
Route::get('/assets/{path}', GameAssetController::class)->where('path', '.*')->name('game.asset');
// In production Vite BASE_URL is /build/; the unchanged game prepends it to assets/.
Route::get('/build/assets/{path}', GameAssetController::class)->where('path', '.*')->name('game.asset.built');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'Dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
