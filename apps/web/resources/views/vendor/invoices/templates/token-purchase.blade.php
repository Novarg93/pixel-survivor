<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Invoice</title>
<style>
@page { margin: 42px 44px; }
body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; line-height: 1.6; color: #263342; }
h1 { font-size: 30px; margin: 0; color: #172536; } h2 { font-size: 12px; margin: 0 0 9px; color: #697788; }
.brand { color: #827040; font-size: 13px; letter-spacing: 2px; margin-bottom: 24px; }
.number { font-size: 10px; color: #697788; overflow-wrap: break-word; margin: 6px 0 20px; }
.badge { padding: 9px 13px; background: #f0f3f6; margin-bottom: 24px; }
.parties { width: 100%; table-layout: fixed; margin: 20px 0 30px; } .parties td { width: 50%; vertical-align: top; padding-right: 18px; word-wrap: break-word; overflow-wrap: anywhere; }
.items { border-collapse: collapse; width: 100%; } .items th { text-align: left; background: #172536; color: white; padding: 11px; font-size: 10px; }
.items td { padding: 14px 11px; border-bottom: 1px solid #dce2e7; vertical-align: top; } .right { text-align: right; }
.total { text-align: right; font-size: 20px; margin-top: 25px; color: #172536; } .muted { color: #697788; } .test { padding: 12px; border: 1px solid #c7b47d; margin-top: 28px; }
.footer { margin-top: 42px; border-top: 1px solid #dce2e7; padding-top: 14px; color: #697788; font-size: 9px; }
@media screen { body { margin: 32px; } }
@media screen and (max-width: 600px) { body { margin: 16px; font-size: 10px; } .items th, .items td { padding: 8px 5px; } .total { font-size: 18px; } }
</style></head>
<body>
@php($record = $invoice->getCustomData())
<div class="brand">PIXEL SURVIVOR</div><h1>Invoice</h1><p class="number">{{ $record['number'] }}</p>
<div class="badge">{{ $invoice->status }} · {{ $record['issued_at'] }}</div>
<table class="parties"><tr><td><h2>Seller</h2>{{ $invoice->seller->name }}</td><td><h2>Buyer</h2>{{ $invoice->buyer->name }}<br>{{ $invoice->buyer->custom_fields['Email'] }}</td></tr></table>
<table class="items"><thead><tr><th>Purchase</th><th>Quantity</th><th class="right">Amount</th></tr></thead><tbody>
@foreach($invoice->items as $item)<tr><td>{{ $item->title }}<br><span class="muted">Top up {{ $record['tokens'] }} Tokens</span></td><td>1</td><td class="right">{{ $record['amount'] }}</td></tr>@endforeach
</tbody></table><p class="total">Total: {{ $record['amount'] }}</p>
<p class="muted">Payment method: {{ $record['provider'] }}</p>
@if($record['paid_at'])<p class="muted">Payment confirmed: {{ $record['paid_at'] }}</p>@endif
@if($record['test'])<div class="test">TEST INVOICE · Simulated payment. No real money was charged.</div>@endif
<div class="footer">The amount and currency were recorded when the order was created. Your account display currency does not change the invoice.</div>
</body></html>
