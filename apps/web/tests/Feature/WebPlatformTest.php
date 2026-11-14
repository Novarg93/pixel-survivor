<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WebPlatformTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_and_game_are_available_without_registration(): void
    {
        foreach (['/' => 'Welcome', '/faq' => 'Faq', '/contact' => 'Contact', '/privacy' => 'Legal', '/terms' => 'Legal'] as $url => $component) {
            $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
        }
        $this->get('/play')->assertOk()->assertSee('id="app"', false);
    }

    public function test_contact_validates_and_persists_only_accepted_fields(): void
    {
        RateLimiter::clear('');
        $this->post('/contact', ['email' => 'bad'])->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
        $this->assertDatabaseCount('contact_messages', 0);
        $data = ['name' => 'Tester', 'email' => 'tester@example.test', 'subject' => 'Game feedback', 'message' => '<script>alert("x")</script> Feedback preserved as text.'];
        $this->post('/contact', [...$data, 'user_id' => 99])->assertRedirect('/contact')->assertSessionHas('contactReceived', true);
        $this->assertDatabaseHas('contact_messages', $data);
        $this->assertSame(1, DB::table('contact_messages')->count());
    }

    public function test_contact_rate_limit_rejects_fourth_request(): void
    {
        $data = ['name' => 'Tester', 'email' => 'rate@example.test', 'subject' => 'Rate', 'message' => 'A valid feedback message'];
        for ($i = 0; $i < 3; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.41'])->post('/contact', $data)->assertRedirect();
        }
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.41'])->post('/contact', $data)->assertStatus(429);
        $this->assertDatabaseCount('contact_messages', 3);
    }

    public function test_unverified_account_cannot_open_dashboard(): void
    {
        $this->actingAs(User::factory()->unverified()->create())->get('/dashboard')->assertRedirect('/email/verify');
    }

    public function test_assets_are_allowlisted_and_cannot_escape_asset_directory(): void
    {
        $this->get('/assets/hd/mage.png')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->get('/build/assets/hd/mage.png')->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->get('/assets/../../.env')->assertNotFound();
        $this->get('/assets/not-a-file.php')->assertNotFound();
    }
}
