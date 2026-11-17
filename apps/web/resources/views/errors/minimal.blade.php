<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>@yield('title') · Pixel Survivor</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <style>
            * { box-sizing: border-box; }
            html { color-scheme: dark; background: #0c171f; }
            body { margin: 0; color: #e7ebdf; font-family: 'Segoe UI', system-ui, sans-serif; }
            main { display: grid; place-items: center; min-height: 100svh; padding: 32px 20px; background: radial-gradient(ellipse at 80% 10%, #28504e35, transparent 60%); }
            .error-panel { width: min(100%, 560px); padding: 44px; background: #162832; border: 1px solid #69868a; border-top: 2px solid #d8b476; box-shadow: 0 4px 0 #061017; }
            .brand { color: #adc0c0; font: 11px/1.8 monospace; letter-spacing: .15em; text-decoration: none; }
            .brand span { color: #d8b476; font-size: 22px; vertical-align: middle; margin-right: 10px; }
            .error-code { color: #d8b476; font: 700 72px/1 Georgia, serif; margin: 36px 0 20px; }
            h1 { font: 600 30px/1.3 Georgia, serif; margin: 0 0 20px; }
            p { color: #adc0c0; font-size: 14px; line-height: 1.8; }
            .return-link { display: inline-flex; padding: 13px 24px; margin-top: 22px; background: #d8b476; border: 1px solid #eed19d; color: #14222c; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 3px 0 #70583b; }
            .return-link:hover { background: #efce98; }
            a:focus-visible { outline: 2px solid #9bdccc; outline-offset: 5px; }
            @media (max-width: 600px) { .error-panel { padding: 30px 24px; } h1 { font-size: 26px; } }
        </style>
    </head>
    <body>
        <main>
            <section class="error-panel" aria-labelledby="error-title">
                <a href="/" class="brand"><span aria-hidden="true">✦</span>PIXEL SURVIVOR</a>
                <p class="error-code">@yield('code')</p>
                <h1 id="error-title">@yield('message')</h1>
                <p>Return home and try again.</p>
                <a href="/" class="return-link">Back to home →</a>
            </section>
        </main>
    </body>
</html>
