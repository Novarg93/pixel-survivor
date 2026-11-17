<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
defineProps<{ page: { current_page: number; last_page: number; total: number; prev_page_url: string | null; next_page_url: string | null }; label?: string }>();
</script>
<template><nav v-if="page.last_page > 1" class="account-pagination" :aria-label="label ?? 'History pages'"><Link v-if="page.prev_page_url" :href="page.prev_page_url" preserve-scroll>← Back</Link><span>{{ page.current_page }} / {{ page.last_page }} · {{ page.total }} records</span><Link v-if="page.next_page_url" :href="page.next_page_url" preserve-scroll>Next →</Link></nav></template>
