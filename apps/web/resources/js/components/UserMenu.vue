<script setup lang="ts">
import { Link, usePage } from '@inertiajs/vue3';
import { onMounted, onUnmounted, ref } from 'vue';
import { accountNavigation } from '@/lib/accountNavigation';
const page = usePage(), menu = ref<HTMLDetailsElement>();
function close() { if (menu.value) menu.value.open = false; }
function outside(event: PointerEvent) { if (event.target instanceof Node && !menu.value?.contains(event.target)) close(); }
function escape(event: KeyboardEvent) { if (event.key === 'Escape' && menu.value?.open) { close(); menu.value.querySelector('summary')?.focus(); } }
onMounted(() => { document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape); });
onUnmounted(() => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); });
</script>
<template>
    <details v-if="page.props.auth.authenticated ?? !!page.props.auth.user" ref="menu" class="user-menu">
        <summary>☷ <span>Account</span> <span aria-hidden="true">▾</span></summary>
        <div class="user-menu-panel">
            <p>{{ page.props.auth.user?.name ?? 'Account' }}</p>
            <Link v-for="item in accountNavigation" :key="item.href" :href="item.href" @click="close"><span aria-hidden="true">{{ item.mark }}</span> {{ item.label }}</Link>
            <a v-if="page.props.auth.can_admin" href="/admin/currencies" @click="close">Currencies · Filament</a>
            <form action="/logout" method="post"><input type="hidden" name="_token" :value="page.props.csrfToken" /><button type="submit">Log out</button></form>
        </div>
    </details>
    <div v-else class="guest-menu"><Link href="/login">Log in</Link><Link href="/register">Register</Link></div>
</template>
