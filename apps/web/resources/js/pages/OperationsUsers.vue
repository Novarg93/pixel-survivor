<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import type { PageSlice } from '@/types/leaderboard';
defineProps<{ users: PageSlice<{ id: number; nickname: string | null; is_platform_operator: boolean }> }>();
</script>
<template><Head title="Operations Users" /><section class="site-section leaderboard-page operations-page"><Link href="/operations" class="quiet-link">← Operations</Link><h1>Users</h1><ul class="review-history"><li v-for="user in users.data" :key="user.id"><Link :href="`/operations/users/${user.id}`">{{ user.nickname ?? 'Profile not created' }} →</Link><small v-if="user.is_platform_operator"> · operator</small></li></ul><nav v-if="users.last_page > 1" class="commerce-pagination" aria-label="Users"><Link v-if="users.current_page > 1" :href="`/operations/users?page=${users.current_page - 1}`">← Back</Link><span>{{ users.current_page }} / {{ users.last_page }}</span><Link v-if="users.current_page < users.last_page" :href="`/operations/users?page=${users.current_page + 1}`">Next →</Link></nav></section></template>
