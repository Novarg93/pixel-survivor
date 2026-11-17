<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->session()->forget('contactReceived');
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:254'],
            'subject' => ['required', 'string', 'max:160'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);
        DB::table('contact_messages')->insert([...$data, 'created_at' => now(), 'updated_at' => now()]);

        // A concurrent web GET can consume flash before the redirect reaches Contact.
        $request->session()->put('contactReceived', true);

        return to_route('contact');
    }
}
