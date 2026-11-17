<script setup lang="ts">
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.vue';
import SiteLayout from '@/layouts/SiteLayout.vue';

const { title = '', description = '' } = defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <SiteLayout><AuthLayout :title="title" :description="description">
        <slot />
    </AuthLayout></SiteLayout>
</template>
