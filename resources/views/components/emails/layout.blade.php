<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subject ?? config('app.name') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f5f7;
            color: #111827;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f4f5f7;
            padding: 40px 16px;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding-bottom: 28px;
        }
        .header img {
            height: 40px;
            width: auto;
        }
        .card {
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .card-accent {
            height: 4px;
            background-color: #4338ca;
        }
        .card-body {
            padding: 36px 40px;
        }
        h1 {
            font-size: 22px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .subtitle {
            font-size: 15px;
            color: #6b7280;
            margin-bottom: 28px;
            line-height: 1.5;
        }
        p {
            font-size: 15px;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        .detail-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px 24px;
            margin: 24px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 14px;
        }
        .detail-row + .detail-row {
            border-top: 1px solid #e5e7eb;
        }
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        .detail-value {
            color: #111827;
            font-weight: 600;
            text-align: right;
        }
        .detail-value.highlight {
            color: #4338ca;
            font-size: 15px;
        }
        .btn {
            display: inline-block;
            background-color: #4338ca;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
            padding: 13px 28px;
            border-radius: 8px;
            margin-top: 8px;
            letter-spacing: 0.01em;
        }
        .btn-center {
            text-align: center;
            margin: 28px 0 8px;
        }
        .divider {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 28px 0;
        }
        .badge {
            display: inline-block;
            background-color: #ede9fe;
            color: #4338ca;
            font-size: 12px;
            font-weight: 600;
            padding: 3px 10px;
            border-radius: 20px;
            margin-bottom: 20px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .badge.success {
            background-color: #d1fae5;
            color: #065f46;
        }
        .badge.warning {
            background-color: #fef3c7;
            color: #92400e;
        }
        .badge.danger {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .footer {
            text-align: center;
            padding: 28px 16px 8px;
            font-size: 13px;
            color: #9ca3af;
            line-height: 1.6;
        }
        .footer a {
            color: #6b7280;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .card-body { padding: 28px 24px; }
            .detail-row { flex-direction: column; align-items: flex-start; gap: 2px; }
            .detail-value { text-align: left; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <img src="{{ config('app.url') }}/logo.png" alt="{{ config('app.name') }}">
            </div>

            <div class="card">
                <div class="card-accent"></div>
                <div class="card-body">
                    {{ $slot }}
                </div>
            </div>

            <div class="footer">
                <p>
                    &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.<br>
                    You received this email because you have an account with us.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
