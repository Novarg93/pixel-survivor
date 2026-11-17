<?php

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GameAssetController extends Controller
{
    public function __invoke(string $path): BinaryFileResponse
    {
        // The monorepo owns one copy of the accepted runtime assets.
        $root = realpath(base_path('../../public/assets'));
        $file = $root ? realpath($root.DIRECTORY_SEPARATOR.$path) : false;
        abort_unless($root && $file && str_starts_with($file, $root.DIRECTORY_SEPARATOR) && is_file($file), 404);
        $mime = match (strtolower(pathinfo($file, PATHINFO_EXTENSION))) {
            'png' => 'image/png', 'json' => 'application/json',
            'wav' => 'audio/wav', 'mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg',
            default => null,
        };
        abort_unless($mime !== null, 404);

        return response()->file($file, ['Content-Type' => $mime, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'public, max-age=3600']);
    }
}
