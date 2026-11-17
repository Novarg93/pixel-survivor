<?php

namespace App\Http\Controllers;

use App\Services\PremiumConfiguration;
use Inertia\Inertia;
use Inertia\Response;

class GuideController extends Controller
{
    public function __invoke(PremiumConfiguration $configuration): Response
    {
        return Inertia::render('Guide', ['premium' => $configuration->current()]);
    }
}
