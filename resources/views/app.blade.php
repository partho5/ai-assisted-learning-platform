<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to apply font scale before render to avoid flash --}}
        <script>
            (function() {
                var scale = localStorage.getItem('font-scale');
                if (scale && scale !== '1') {
                    document.documentElement.style.fontSize = scale + 'rem';
                }
            })();
        </script>

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/logo.png" type="image/png">
        <link rel="apple-touch-icon" href="/logo.png">

        <meta name="theme-color" content="#0a0a0a">

        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link rel="preload" as="style" href="https://fonts.bunny.net/css?family=bricolage-grotesque:600,700|instrument-sans:400,500,600&display=swap">
        <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:600,700|instrument-sans:400,500,600&display=swap" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia

        {{-- Google Translate Widget (free, no API key required) --}}
        <style>@media(max-width:767px){#gt_wrapper{position:absolute!important;top:8px!important;right:8px!important;z-index:100!important;}}</style>
        <div id="gt_wrapper" style="position:fixed;top:1rem;right:1rem;margin-top:4px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            <button id="gt_toggle" onclick="(function(){var p=document.getElementById('gt_panel');var open=p.style.display==='block';p.style.display=open?'none':'block';})()" style="background:white;border:1px solid #e2e8f0;border-radius:50%;width:30px;height:30px;font-size:20px;padding-top:2px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;line-height:1;" title="Translate page">🌐</button>
            <div id="gt_panel" style="display:none;background:white;padding:6px 10px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.2);border:1px solid #e2e8f0;">
                <div id="google_translate_element"></div>
            </div>
        </div>
        <script type="text/javascript">
            function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                }, 'google_translate_element');
            }
        </script>
        <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
    </body>
</html>
