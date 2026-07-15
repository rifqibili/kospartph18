<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $auth = [
            'VAPID' => [
                'subject'    => config('webpush.vapid.subject'),
                'publicKey'  => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->webPush->setReuseVAPIDHeaders(true);
    }

    /**
     * Kirim push notification ke semua device satu user tertentu.
     */
    public function sendToUser(int $userId, string $title, string $body, string $url = '/', ?string $icon = null): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        $this->dispatchToSubscriptions($subscriptions, $title, $body, $url, $icon);
    }

    /**
     * Kirim push notification ke semua admin dan operator.
     */
    public function sendToAdmins(string $title, string $body, string $url = '/', ?string $icon = null): void
    {
        $adminIds = User::whereIn('role', ['super_admin', 'operator'])->pluck('id');
        $subscriptions = PushSubscription::whereIn('user_id', $adminIds)->get();
        $this->dispatchToSubscriptions($subscriptions, $title, $body, $url, $icon);
    }

    /**
     * Kirim push notification ke semua admin, operator, dan branch operator tertentu.
     */
    public function sendToAdminsOfBranch(int $branchId, string $title, string $body, string $url = '/', ?string $icon = null): void
    {
        // Kirim ke super_admin + operator yang menghandle branch ini
        $adminIds = User::where('role', 'super_admin')
            ->orWhere(function ($q) use ($branchId) {
                $q->where('role', 'operator')
                  ->whereJsonContains('assigned_branches', $branchId);
            })
            ->pluck('id');

        $subscriptions = PushSubscription::whereIn('user_id', $adminIds)->get();
        $this->dispatchToSubscriptions($subscriptions, $title, $body, $url, $icon);
    }

    /**
     * Internal: Queue & flush notifications ke daftar subscriptions.
     */
    private function dispatchToSubscriptions($subscriptions, string $title, string $body, string $url, ?string $icon): void
    {
        if ($subscriptions->isEmpty()) return;

        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'url'   => $url,
            'icon'  => $icon ?? '/images/logo 2.jpeg',
            'badge' => '/images/logo 2.jpeg',
        ]);

        $staleEndpoints = [];

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint'        => $sub->endpoint,
                'publicKey'       => $sub->public_key,
                'authToken'       => $sub->auth_token,
                'contentEncoding' => $sub->content_encoding ?? 'aesgcm',
            ]);

            $this->webPush->queueNotification($subscription, $payload);
        }

        foreach ($this->webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                // Jika endpoint sudah tidak valid (user unsubscribe manual), hapus dari DB
                $endpoint = $report->getRequest()->getUri()->__toString();
                if ($report->isSubscriptionExpired()) {
                    $staleEndpoints[] = $endpoint;
                }
            }
        }

        // Hapus subscription kadaluarsa
        if (!empty($staleEndpoints)) {
            PushSubscription::whereIn('endpoint', $staleEndpoints)->delete();
        }
    }
}
