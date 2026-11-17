<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import { accountNavigation } from '@/lib/accountNavigation';
const page = usePage();
function current(href: string) { return href.startsWith('/settings') ? page.url.startsWith('/settings/') : page.url.split('?')[0] === href || (href === '/account/orders' && page.url.startsWith('/account/orders/')); }
</script>
<template>
    <div class="account-shell">
        <aside class="account-sidebar"><p class="overline">PERSONAL CHRONICLE</p><nav aria-label="My account"><Link v-for="item in accountNavigation" :key="item.href" :href="item.href" :aria-current="current(item.href) ? 'page' : undefined"><span aria-hidden="true">{{ item.mark }}</span>{{ item.label }}</Link></nav><Link href="/wallet" class="account-wallet-link">◆ Open Wallet →</Link><Link href="/runs" class="account-wallet-link">Run history →</Link></aside>
        <div class="account-content"><slot /></div>
    </div>
</template>
