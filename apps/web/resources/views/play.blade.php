<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Pixel Survivor — Play</title>
    @include('partials.site-icons')
    @vite('resources/js/game.ts')
    @if (config('analytics.enabled'))
        @vite('resources/js/analytics.ts')
    @endif
</head>
<body><div id="app" data-platform-account="{{ auth()->check() ? '1' : '0' }}"></div></body>
</html>
