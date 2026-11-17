<?php

namespace App\Http\Controllers;

use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CurrencyPreferenceController extends Controller
{
    public function __invoke(Request $request, CurrencyService $currencies): RedirectResponse
    {
        $input = $request->validate(['currency' => 'required|string|size:3', 'user_id' => 'prohibited']);
        $currency = $currencies->available($input['currency']);
        if ($request->user()) {
            $request->user()->forceFill(['preferred_currency_id' => $currency->id])->save();
        } else {
            $request->session()->put('display_currency', $currency->code);
        }

        return back(303);
    }
}
