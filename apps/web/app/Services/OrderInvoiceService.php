<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\User;
use Brick\Math\BigDecimal;
use LaravelDaily\Invoices\Classes\Buyer;
use LaravelDaily\Invoices\Classes\InvoiceItem;
use LaravelDaily\Invoices\Classes\Party;
use LaravelDaily\Invoices\Invoice;

class OrderInvoiceService
{
    public function make(PaymentOrder $order, User $buyer): Invoice
    {
        abort_unless($order->user_id === (int) $buyer->id, 404);
        $exponent = $order->currency_exponent;
        abort_unless($exponent >= 0 && $exponent <= 4, 422);
        $decimal = (string) BigDecimal::of($order->amount_minor)->dividedBy(10 ** $exponent, $exponent);
        $statuses = ['created' => 'Created', 'checkout_pending' => 'Awaiting payment', 'processing' => 'Under review', 'succeeded' => 'Paid', 'failed' => 'Payment failed', 'canceled' => 'Canceled', 'expired' => 'Expired'];
        $name = (string) ($order->package_snapshot['name'] ?? 'Tokens');

        return Invoice::make('Invoice')->seller(new Party(['name' => config('app.name', 'Pixel Survivor')]))
            ->buyer(new Buyer(['name' => $buyer->name, 'custom_fields' => ['Email' => $buyer->email]]))
            ->date($order->created_at)->dateFormat('d.m.Y')->serialNumberFormat('PAY-'.$order->id)
            ->filename('invoice-'.$order->id)->currencyCode($order->currency)->currencyDecimals($order->currency_exponent)
            ->currencySymbol('')->currencyFormat('{VALUE} {CODE}')->status($statuses[$order->status] ?? $order->status)
            ->addItem(InvoiceItem::make($name)->quantity(1)->pricePerUnit((float) $decimal))
            ->setCustomData(['number' => 'PAY-'.$order->id, 'amount' => $decimal.' '.$order->currency, 'tokens' => $order->credits_amount,
                'provider' => $order->provider, 'test' => $order->mode === 'test' || in_array($order->provider, ['dev', 'test'], true),
                'paid_at' => $order->confirmed_at ? $order->confirmed_at->format('d.m.Y H:i').' UTC' : null, 'issued_at' => $order->created_at->format('d.m.Y H:i').' UTC'])
            ->template('token-purchase');
    }
}
