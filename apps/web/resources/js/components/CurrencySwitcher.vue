<script setup lang="ts">
import { router, usePage } from '@inertiajs/vue3';
import { onMounted, ref } from 'vue';
import { useCurrency } from '@/composables/useCurrency';
const page = usePage(), { currencies, selected } = useCurrency();
const busy = ref(false), ready = ref(false), error = ref('');
function change(code: string) {
    if (busy.value || code === selected.value.code) return;
    busy.value = true; error.value = '';
    router.post('/currency', { currency: code }, {
        preserveScroll: true, preserveState: true,
        onSuccess: () => { if (!page.props.auth.authenticated) { try { localStorage.setItem('pixel-display-currency:v1', code); } catch { /* Session remains authoritative. */ } } },
        onError: () => { error.value = 'Could not change currency. Please select it again.'; },
        onFinish: () => { busy.value = false; },
    });
}
onMounted(() => {
    ready.value = true;
    if (page.props.auth.authenticated) return;
    try {
        const code = localStorage.getItem('pixel-display-currency:v1');
        if (code && currencies.value.active.some(c => c.code === code)) change(code);
    } catch { /* Storage is optional; server session persists selection. */ }
});
</script>
<template>
    <div class="currency-switcher" :aria-busy="busy">
        <label for="display-currency" class="sr-only">Display currency</label>
        <select id="display-currency" :value="selected.code" :disabled="!ready || busy" @change="change(($event.target as HTMLSelectElement).value)">
            <option v-for="currency in currencies.active" :key="currency.code" :value="currency.code">{{ currency.code }} {{ currency.symbol }}</option>
        </select>
        <small v-if="error" role="alert">{{ error }}</small>
    </div>
</template>
