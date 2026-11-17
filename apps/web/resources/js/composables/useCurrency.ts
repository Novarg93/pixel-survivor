import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import { convertMinor, formatMinor } from '@/lib/currency';

export function useCurrency() {
    const page = usePage();
    const currencies = computed(() => page.props.currencies);
    const selected = computed(() => currencies.value.active.find(c => c.code === currencies.value.selected) ?? currencies.value.active.find(c => c.code === currencies.value.default)!);
    function display(amount: string, code: string, exponent: number) {
        if (code === 'TOKENS') return { label: `${amount} Tokens`, original: '', converted: false };
        const source = currencies.value.active.find(c => c.code === code);
        const original = formatMinor(amount, exponent, code, source?.symbol);
        if (!source || code === 'XTS' || selected.value.code === code) return { label: original, original: '', converted: false };
        return { label: formatMinor(convertMinor(amount, source, selected.value, exponent), selected.value.decimal_places, selected.value.code, selected.value.symbol), original, converted: true };
    }
    return { currencies, selected, display };
}
