<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Pixel Survivor — Play</title>
    @vite('resources/js/game.ts')
</head>
<body><div id="app"></div></body>
</html>
