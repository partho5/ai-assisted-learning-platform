<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PayPalClient
{
    private readonly string $clientId;

    private readonly string $clientSecret;

    private readonly string $baseUrl;

    public function __construct()
    {
        $this->clientId = config('services.paypal.client_id');
        $this->clientSecret = config('services.paypal.client_secret');
        $this->baseUrl = config('services.paypal.mode') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    // ─── Authentication ──────────────────────────────────────────────────────

    private function accessToken(): string
    {
        return Cache::remember('paypal_access_token', 28800, function () {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post("{$this->baseUrl}/v1/oauth2/token", ['grant_type' => 'client_credentials']);

            $this->throwIfFailed($response, 'PayPal authentication failed');

            return $response->json('access_token');
        });
    }

    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withToken($this->accessToken())
            ->acceptJson()
            ->contentType('application/json');
    }

    // ─── Orders API (one-time payments) ─────────────────────────────────────

    /**
     * Create a PayPal order and return the order ID.
     *
     * @return array{id: string, status: string}
     */
    public function createOrder(float $amount, string $currency, string $description): array
    {
        $response = $this->http()->post("{$this->baseUrl}/v2/checkout/orders", [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'amount' => [
                    'currency_code' => $currency,
                    'value' => number_format($amount, 2, '.', ''),
                ],
                'description' => $description,
            ]],
        ]);

        $this->throwIfFailed($response, 'Failed to create PayPal order');

        return $response->json();
    }

    /**
     * Capture an approved order and return the capture data.
     *
     * @return array<string, mixed>
     */
    public function captureOrder(string $orderId): array
    {
        $response = $this->http()
            ->withBody('{}', 'application/json')
            ->post("{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture");

        $this->throwIfFailed($response, 'Failed to capture PayPal order');

        return $response->json();
    }

    // ─── Subscriptions API (recurring billing) ──────────────────────────────

    /**
     * Create or retrieve a billing plan for a subscription course.
     * The plan charges monthly for $durationMonths total cycles.
     */
    public function createPlan(
        string $courseTitle,
        float $monthlyPrice,
        string $currency,
        int $durationMonths,
        string $productId,
    ): string {
        $response = $this->http()->post("{$this->baseUrl}/v1/billing/plans", [
            'product_id' => $productId,
            'name' => $courseTitle,
            'billing_cycles' => [[
                'frequency' => ['interval_unit' => 'MONTH', 'interval_count' => 1],
                'tenure_type' => 'REGULAR',
                'sequence' => 1,
                'total_cycles' => $durationMonths,
                'pricing_scheme' => [
                    'fixed_price' => [
                        'value' => number_format($monthlyPrice, 2, '.', ''),
                        'currency_code' => $currency,
                    ],
                ],
            ]],
            'payment_preferences' => [
                'auto_bill_outstanding' => true,
                'setup_fee_failure_action' => 'CONTINUE',
                'payment_failure_threshold' => 3,
            ],
        ]);

        $this->throwIfFailed($response, 'Failed to create PayPal billing plan');

        return $response->json('id');
    }

    /**
     * Ensure a PayPal product exists for this application (created once, reused).
     */
    public function ensureProduct(): string
    {
        return Cache::remember('paypal_product_id', 86400 * 30, function () {
            $response = $this->http()->post("{$this->baseUrl}/v1/catalogs/products", [
                'name' => config('app.name'),
                'type' => 'DIGITAL',
                'category' => 'EDUCATIONAL_AND_TEXTBOOKS',
            ]);

            $this->throwIfFailed($response, 'Failed to create PayPal product');

            return $response->json('id');
        });
    }

    /**
     * Create a subscription for a user against a plan.
     *
     * @return array{id: string, status: string}
     */
    public function createSubscription(string $planId, string $returnUrl, string $cancelUrl): array
    {
        $response = $this->http()->post("{$this->baseUrl}/v1/billing/subscriptions", [
            'plan_id' => $planId,
            'application_context' => [
                'return_url' => $returnUrl,
                'cancel_url' => $cancelUrl,
            ],
        ]);

        $this->throwIfFailed($response, 'Failed to create PayPal subscription');

        return $response->json();
    }

    /**
     * Fetch a subscription by ID to verify its status.
     *
     * @return array<string, mixed>
     */
    public function getSubscription(string $subscriptionId): array
    {
        $response = $this->http()->get("{$this->baseUrl}/v1/billing/subscriptions/{$subscriptionId}");

        $this->throwIfFailed($response, 'Failed to fetch PayPal subscription');

        return $response->json();
    }

    // ─── Webhooks ────────────────────────────────────────────────────────────

    /**
     * Verify a PayPal webhook signature.
     *
     * @param  array<string, string>  $headers
     */
    public function verifyWebhook(array $headers, string $rawBody): bool
    {
        $webhookId = config('services.paypal.webhook_id');

        if (! $webhookId) {
            return true; // skip verification in development if not configured
        }

        $response = $this->http()->post("{$this->baseUrl}/v1/notifications/verify-webhook-signature", [
            'auth_algo' => $headers['PAYPAL-AUTH-ALGO'] ?? '',
            'cert_url' => $headers['PAYPAL-CERT-URL'] ?? '',
            'transmission_id' => $headers['PAYPAL-TRANSMISSION-ID'] ?? '',
            'transmission_sig' => $headers['PAYPAL-TRANSMISSION-SIG'] ?? '',
            'transmission_time' => $headers['PAYPAL-TRANSMISSION-TIME'] ?? '',
            'webhook_id' => $webhookId,
            'webhook_event' => json_decode($rawBody, true),
        ]);

        return $response->successful() && $response->json('verification_status') === 'SUCCESS';
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function throwIfFailed(Response $response, string $message): void
    {
        if ($response->failed()) {
            throw new \RuntimeException("{$message}: ".$response->body());
        }
    }
}
