<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\ProgressionService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(CurrencySeeder::class);
        // User::factory(10)->create();

        if (! app()->environment(['local', 'testing'])) {
            throw new \LogicException('Demo seeding is only allowed in local/testing environments.');
        }
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        app(ProgressionService::class)->initialize($user->id);
    }
}
