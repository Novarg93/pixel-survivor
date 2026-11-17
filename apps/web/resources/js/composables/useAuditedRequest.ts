import { usePage } from '@inertiajs/vue3';
import { onMounted, onUnmounted, ref } from 'vue';

// A transport retry keeps the original operation and payload. Nothing is sent on mount.
export function useAuditedRequest<T extends Record<string, unknown>>(storageKey: string) {
    const ready = ref(false), busy = ref(false), error = ref(''), pending = ref<Record<string, unknown> | null>(null);
    const page = usePage(), controller = new AbortController();
    onMounted(() => { try { const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); if (saved && typeof saved === 'object' && 'operation_id' in saved && typeof saved.operation_id === 'string') pending.value = saved as Record<string, unknown>; } catch { /* Server remains authoritative. */ } ready.value = true; });
    onUnmounted(() => controller.abort());
    function clear() { pending.value = null; try { sessionStorage.removeItem(storageKey); } catch { /* Optional transport journal. */ } }
    async function submit(url: string, payload: T): Promise<Record<string, unknown> | null> {
        if (!ready.value || busy.value) return null;
        pending.value ??= { ...payload, operation_id: crypto.randomUUID() };
        busy.value = true; error.value = '';
        try {
            try { sessionStorage.setItem(storageKey, JSON.stringify(pending.value)); } catch { /* The in-memory retry still preserves the ID. */ }
            const response = await fetch(url, { method: 'POST', credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]), headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': String(page.props.csrfToken ?? '') }, body: JSON.stringify(pending.value) });
            const result = await response.json();
            if (!response.ok) {
                if ([403, 404, 409, 419, 422].includes(response.status)) clear();
                const fields = result.errors as Record<string, string[]> | undefined;
                throw new Error(fields ? Object.values(fields).flat().join(' ') : response.status === 409 ? 'The state changed. Refresh the page before starting another operation.' : response.status === 419 ? 'Your session expired. Refresh the page.' : 'The request failed. Retry with the same ID.');
            }
            clear(); return result;
        } catch (failure) { if (!controller.signal.aborted) error.value = failure instanceof Error ? failure.message : 'No connection. Retry with the same ID.'; return null; }
        finally { busy.value = false; }
    }
    return { ready, busy, error, pending, submit };
}
