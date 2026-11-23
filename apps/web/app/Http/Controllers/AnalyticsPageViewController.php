<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class AnalyticsPageViewController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        abort_unless(config('analytics.enabled'), 404);
        abort_unless($request->header('Sec-Fetch-Site') === 'same-origin' && $request->isJson(), 403);
        abort_if(strlen($request->getContent()) > 1024, 413);

        if ($request->header('Sec-GPC') === '1'
            || preg_match('/HeadlessChrome|Playwright|Lighthouse/i', $request->userAgent() ?? '')) {
            return response()->noContent();
        }

        $event = $request->validate([
            'event_id' => ['required', 'uuid:4'],
            'visitor_id' => ['required', 'uuid:4'],
        ]);

        DB::table('analytics_page_views')->insertOrIgnore([
            'event_id' => strtolower($event['event_id']),
            'visitor_hash' => hash('sha256', strtolower($event['visitor_id'])),
            'viewed_on' => CarbonImmutable::today('UTC')->toDateString(),
        ]);

        return response()->noContent();
    }
}
